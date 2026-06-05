import type { UserRole } from '@/types/auth'

export interface DevLoginUser {
  email: string
  label: string
  role: UserRole
}

export const DEV_LOGIN_PASSWORD = 'LarsanaCare2026!'

export const DEV_LOGIN_USERS: DevLoginUser[] = [
  { email: 'admin@larsanacare.com.br', label: 'Admin', role: 'admin' },
  { email: 'financeiro@larsanacare.com.br', label: 'Financeiro', role: 'financeiro' },
  { email: 'gestao@larsanacare.com.br', label: 'Gestão', role: 'gestao' },
  { email: 'parceiro@larsanacare.com.br', label: 'Profissional (PP)', role: 'pp' },
  { email: 'cliente@larsanacare.com.br', label: 'Paciente', role: 'paciente' },
]

export function isDevLoginEnabled() {
  return import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_LOGIN === 'true'
}
