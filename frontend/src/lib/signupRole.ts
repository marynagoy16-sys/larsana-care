export const PUBLIC_SIGNUP_ROLES = ['paciente', 'pp'] as const

export type PublicSignupRole = (typeof PUBLIC_SIGNUP_ROLES)[number]

/** Roles accepted from public self-signup. Staff is provisioned only by admin/seed. */
export function resolvePublicSignupRole(requested: string | undefined | null): PublicSignupRole {
  return requested?.trim().toLowerCase() === 'pp' ? 'pp' : 'paciente'
}

export function isPublicSignupRole(value: string | undefined | null): value is PublicSignupRole {
  return value === 'paciente' || value === 'pp'
}
