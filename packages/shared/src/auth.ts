export type UserRole = 'admin' | 'financeiro' | 'gestao' | 'pp' | 'paciente'

export type StaffRole = 'admin' | 'financeiro' | 'gestao'

export const STAFF_ROLES: StaffRole[] = ['admin', 'financeiro', 'gestao']

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  primary_role: UserRole
  is_active: boolean
}

export function getHomePathForRole(role: UserRole): string {
  switch (role) {
    case 'admin':
    case 'financeiro':
    case 'gestao':
      return '/admin'
    case 'pp':
      return '/profissional/demandas'
    case 'paciente':
      return '/paciente'
    default:
      return '/login'
  }
}

export function isStaffRole(role: UserRole): role is StaffRole {
  return STAFF_ROLES.includes(role as StaffRole)
}

export function getMobileHomePathForRole(role: UserRole): string {
  switch (role) {
    case 'pp':
      return '/(app)/(tabs)/demandas'
    case 'paciente':
      return '/(app)/(tabs)/inicio'
    case 'financeiro':
    case 'admin':
      return '/(app)/(tabs)/inicio'
    default:
      return '/login'
  }
}
