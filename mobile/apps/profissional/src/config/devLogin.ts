export const DEV_LOGIN_PP = {
  email: 'parceiro@larsanacare.com.br',
  label: 'Profissional (PP)',
  password: 'LarsanaCare2026!',
} as const

export function isDevLoginEnabled() {
  return __DEV__ || process.env.EXPO_PUBLIC_ENABLE_DEV_LOGIN === 'true'
}
