export const ASAAS_API_URL = Deno.env.get('ASAAS_API_URL') ?? 'https://api.asaas.com/v3'

export function isAsaasEnabled(): boolean {
  const flag = Deno.env.get('ASAAS_ENABLED')
  if (flag === 'false') return false
  return Boolean(Deno.env.get('ASAAS_API_KEY'))
}

export async function asaasRequest(path: string, init: RequestInit) {
  const apiKey = Deno.env.get('ASAAS_API_KEY')
  if (!apiKey) return null

  const response = await fetch(`${ASAAS_API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      access_token: apiKey,
      ...(init.headers ?? {}),
    },
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message =
      typeof payload?.errors?.[0]?.description === 'string'
        ? payload.errors[0].description
        : `Asaas HTTP ${response.status}`
    throw new Error(message)
  }
  return payload
}

export function validateAsaasWebhookToken(req: Request): boolean {
  const expected = Deno.env.get('ASAAS_WEBHOOK_TOKEN')
  if (!expected) return true
  const received = req.headers.get('asaas-access-token')
  return received === expected
}
