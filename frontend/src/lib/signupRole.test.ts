import { describe, expect, it } from 'vitest'
import { isPublicSignupRole, resolvePublicSignupRole } from '@/lib/signupRole'

describe('resolvePublicSignupRole', () => {
  it('aceita pp', () => {
    expect(resolvePublicSignupRole('pp')).toBe('pp')
    expect(resolvePublicSignupRole('PP')).toBe('pp')
  })

  it('força paciente para qualquer outro valor, inclusive staff', () => {
    expect(resolvePublicSignupRole('paciente')).toBe('paciente')
    expect(resolvePublicSignupRole('admin')).toBe('paciente')
    expect(resolvePublicSignupRole('financeiro')).toBe('paciente')
    expect(resolvePublicSignupRole('gestao')).toBe('paciente')
    expect(resolvePublicSignupRole(undefined)).toBe('paciente')
    expect(resolvePublicSignupRole('')).toBe('paciente')
  })

  it('reconhece apenas paciente e pp como roles públicos', () => {
    expect(isPublicSignupRole('paciente')).toBe(true)
    expect(isPublicSignupRole('pp')).toBe(true)
    expect(isPublicSignupRole('admin')).toBe(false)
  })
})
