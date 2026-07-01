export const DEV_LOGIN_PACIENTE = {
  email: 'cliente@larsanacare.com.br',
  label: 'Paciente',
  password: 'LarsanaCare2026!',
} as const

export function isDevLoginEnabled() {
  return __DEV__ || process.env.EXPO_PUBLIC_ENABLE_DEV_LOGIN === 'true'
}
