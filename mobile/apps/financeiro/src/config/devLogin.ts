export const DEV_LOGIN_FINANCEIRO = {
  email: 'financeiro@larsanacare.com.br',
  label: 'Financeiro',
  password: 'LarsanaCare2026!',
} as const

export function isDevLoginEnabled() {
  return __DEV__ || process.env.EXPO_PUBLIC_ENABLE_DEV_LOGIN === 'true'
}
