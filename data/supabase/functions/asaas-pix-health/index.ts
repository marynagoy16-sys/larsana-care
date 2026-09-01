import { corsHeaders } from '../_shared/cors.ts'
import { asaasRequest, getAsaasPayment, getAsaasPixReceiverStatus, isAsaasEnabled } from '../_shared/asaas.ts'
import { fetchPixQrCode } from '../_shared/charges.ts'

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Método não permitido' })
  }

  if (!isAsaasEnabled()) {
    return json(200, { asaas_enabled: false })
  }

  let body: { payment_id?: string } = {}
  try {
    body = (await req.json()) as { payment_id?: string }
  } catch {
    body = {}
  }

  try {
    const pixStatus = await getAsaasPixReceiverStatus()
    const keys = await asaasRequest('/pix/addressKeys?limit=20', { method: 'GET' })
    const payment = body.payment_id ? await getAsaasPayment(body.payment_id) : null
    const pixQr = body.payment_id ? await fetchPixQrCode(body.payment_id) : null

    return json(200, {
      asaas_enabled: true,
      pix_receiver: pixStatus,
      pix_keys: keys?.data ?? [],
      payment,
      pix_qr: pixQr
        ? {
            has_image: Boolean(pixQr.encodedImage),
            payload_prefix: pixQr.payload?.slice(0, 80) ?? null,
            payload_length: pixQr.payload?.length ?? 0,
          }
        : null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao consultar Asaas'
    return json(400, { error: message })
  }
})
