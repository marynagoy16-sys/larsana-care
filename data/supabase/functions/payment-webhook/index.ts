import { createClient } from 'jsr:@supabase/supabase-js@2'

/**
 * Asaas webhook (official auth): header `asaas-access-token` vs secret
 * `ASAAS_WEBHOOK_TOKEN` (32–255 chars, not the API key).
 * https://docs.asaas.com/docs/receba-eventos-do-asaas-no-seu-endpoint-de-webhook
 *
 * verify_jwt is disabled for this function — Asaas does not send a user JWT.
 */

const PAYMENT_CONFIRMED_EVENTS = new Set([
  'PAYMENT_RECEIVED',
  'PAYMENT_CONFIRMED',
  'PAYMENT_RECEIVED_IN_CASH',
])

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function tokensMatch(provided: string, expected: string): boolean {
  const a = new TextEncoder().encode(provided)
  const b = new TextEncoder().encode(expected)
  if (a.byteLength !== b.byteLength) return false
  let diff = 0
  for (let i = 0; i < a.byteLength; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

function minimizePayload(payload: Record<string, unknown>) {
  const payment = (payload.payment ?? {}) as Record<string, unknown>
  return {
    event: payload.event ?? null,
    event_id: payload.id ?? null,
    dateCreated: payload.dateCreated ?? null,
    payment_id: payment.id ?? null,
    payment_status: payment.status ?? null,
    value: payment.value ?? null,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok')
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Método não permitido' })
  }

  const expected = Deno.env.get('ASAAS_WEBHOOK_TOKEN')?.trim() ?? ''
  if (!expected) {
    return json(503, { error: 'Webhook não configurado' })
  }

  const provided = req.headers.get('asaas-access-token') ?? ''
  if (!provided || !tokensMatch(provided, expected)) {
    return json(401, { error: 'Não autorizado' })
  }

  let payload: Record<string, unknown>
  try {
    payload = (await req.json()) as Record<string, unknown>
  } catch {
    return json(400, { error: 'Payload inválido' })
  }

  const eventType = String(payload.event ?? 'unknown')
  const payment = (payload.payment ?? {}) as Record<string, unknown>
  const paymentId = payment.id ? String(payment.id) : null
  const eventId = payload.id
    ? String(payload.id)
    : [eventType, paymentId ?? '', String(payload.dateCreated ?? '')].join(':')

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!supabaseUrl || !serviceKey) {
    return json(503, { error: 'Serviço indisponível' })
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: existing } = await supabase
    .from('payment_webhook_events')
    .select('id, processed_at')
    .eq('asaas_event_id', eventId)
    .maybeSingle()

  if (existing?.processed_at) {
    return json(200, { received: true, duplicate: true })
  }

  let eventRowId = existing?.id as string | undefined
  if (!eventRowId) {
    const { data: inserted, error: insertError } = await supabase
      .from('payment_webhook_events')
      .insert({
        asaas_event_id: eventId,
        asaas_event_type: eventType,
        asaas_payment_id: paymentId,
        payload: minimizePayload(payload),
      })
      .select('id')
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return json(200, { received: true, duplicate: true })
      }
      return json(500, { error: 'Falha ao registrar evento' })
    }
    eventRowId = inserted.id
  }

  try {
    if (paymentId && PAYMENT_CONFIRMED_EVENTS.has(eventType)) {
      const { data: charge } = await supabase
        .from('charges')
        .select('id, payment_status')
        .eq('asaas_payment_id', paymentId)
        .maybeSingle()

      if (charge?.id && charge.payment_status !== 'pago') {
        const { error: confirmError } = await supabase.rpc('confirm_charge_payment', {
          p_charge_id: charge.id,
        })
        if (confirmError) throw confirmError
      }
    }

    if (paymentId && eventType === 'PAYMENT_OVERDUE') {
      await supabase
        .from('charges')
        .update({ payment_status: 'vencido', updated_at: new Date().toISOString() })
        .eq('asaas_payment_id', paymentId)
        .in('payment_status', ['pendente'])
    }

    await supabase
      .from('payment_webhook_events')
      .update({ processed_at: new Date().toISOString(), error_message: null })
      .eq('id', eventRowId)

    return json(200, { received: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook error'
    await supabase
      .from('payment_webhook_events')
      .update({ error_message: message.slice(0, 500) })
      .eq('id', eventRowId)
    return json(500, { error: 'Falha ao processar evento' })
  }
})
