export const ASAAS_SIGNUP_URL = 'https://www.asaas.com/onboarding/createAccount'

export const ASAAS_WALLET_HELP =
  'A conta de recebimento é a sua própria conta Asaas, não uma subconta da Larsana. Crie a conta, entre na versão web do Asaas e copie o wallet ID. Sem esse ID o repasse não é enviado.'

const WALLET_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isAsaasWalletId(value: string): boolean {
  return WALLET_UUID.test(value.trim())
}
