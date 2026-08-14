import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const PAYMENT_CONFIRMED_EVENTS = new Set([
  'PAYMENT_RECEIVED',
  'PAYMENT_CONFIRMED',
  'PAYMENT_RECEIVED_IN_CASH',
])

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const eventType = String(payload?.event ?? 'unknown')
    const paymentId = payload?.payment?.id ? String(payload.payment.id) : null

    await supabase.from('payment_webhook_events').insert({
      asaas_event_type: eventType,
      asaas_payment_id: paymentId,
      payload,
    })

    if (paymentId && PAYMENT_CONFIRMED_EVENTS.has(eventType)) {
      const { data: charge } = await supabase
        .from('charges')
        .select('id, payment_status')
        .eq('asaas_payment_id', paymentId)
        .maybeSingle()

      if (charge?.id && charge.payment_status !== 'pago') {
        await supabase.rpc('simulate_charge_payment', { p_charge_id: charge.id })
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook error'
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
