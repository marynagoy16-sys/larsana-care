export const ASAAS_API_URL = Deno.env.get('ASAAS_API_URL') ?? 'https://api.asaas.com/v3'
/** Valor mínimo de cobrança aceito pelo Asaas (PIX/boleto). */
export const ASAAS_MIN_CHARGE_CENTS = 500

export function isAsaasEnabled(): boolean {
  const flag = Deno.env.get('ASAAS_ENABLED')
  if (flag === 'false') return false
  return Boolean(Deno.env.get('ASAAS_API_KEY'))
}

export function validateAsaasChargeAmountCents(amountCents: number): string | null {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return 'Valor da cobrança inválido'
  }
  if (amountCents < ASAAS_MIN_CHARGE_CENTS) {
    return `O Asaas exige valor mínimo de R$ ${(ASAAS_MIN_CHARGE_CENTS / 100).toFixed(2).replace('.', ',')} por cobrança. Ajuste a taxa de avaliação no admin.`
  }
  return null
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

type AsaasPixKey = {
  status?: string
  key?: string
  type?: string
}

export async function getAsaasPixReceiverStatus(): Promise<{
  ready: boolean
  activeKeyCount: number
  totalKeyCount: number
  message: string | null
}> {
  const result = await asaasRequest('/pix/addressKeys?limit=20', { method: 'GET' })
  if (!result) {
    return {
      ready: false,
      activeKeyCount: 0,
      totalKeyCount: 0,
      message: 'Integração Asaas não configurada.',
    }
  }

  const keys = (result.data ?? []) as AsaasPixKey[]
  const activeKeys = keys.filter((key) => {
    const status = String(key.status ?? '').toUpperCase()
    return status === 'ACTIVE' || status === 'ACTIVATED' || status === 'ATIVA'
  })

  if (activeKeys.length === 0) {
    return {
      ready: false,
      activeKeyCount: 0,
      totalKeyCount: keys.length,
      message:
        'A conta Asaas ainda não possui chave Pix ativa. Cadastre uma chave no painel Asaas (DELUMA SSE LTDA) e gere um novo PIX.',
    }
  }

  return {
    ready: true,
    activeKeyCount: activeKeys.length,
    totalKeyCount: keys.length,
    message: null,
  }
}

export async function deleteAsaasPayment(paymentId: string): Promise<void> {
  await asaasRequest(`/payments/${paymentId}`, { method: 'DELETE' })
}

export async function getAsaasPayment(paymentId: string): Promise<Record<string, unknown> | null> {
  return await asaasRequest(`/payments/${paymentId}`, { method: 'GET' })
}
