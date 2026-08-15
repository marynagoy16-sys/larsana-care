import { describe, expect, it } from 'vitest'
import {
  patientServiceRequestSchema,
  requiresResponsibleByBirthDate,
} from '@/schemas/patientServiceRequest'

const basePayload = {
  patientFullName: 'Maria Silva',
  patientCpf: '52998224725',
  birthDate: '1990-06-15',
  responsibleFullName: '',
  attendancePeriod: 'MANHA' as const,
  diagnosticHypothesis: 'Dor lombar',
  referralSource: 'GOOGLE' as const,
  termsAccepted: true as const,
}

describe('requiresResponsibleByBirthDate', () => {
  it('exige responsável para menor de 18 anos', () => {
    expect(requiresResponsibleByBirthDate('2010-01-01')).toBe(true)
  })

  it('exige responsável para idoso com 60 anos ou mais', () => {
    expect(requiresResponsibleByBirthDate('1960-01-01')).toBe(true)
  })

  it('não exige responsável para adulto entre 18 e 59', () => {
    expect(requiresResponsibleByBirthDate('1990-01-01')).toBe(false)
  })
})

describe('patientServiceRequestSchema', () => {
  it('aceita adulto sem dados do responsável', () => {
    const result = patientServiceRequestSchema.safeParse(basePayload)
    expect(result.success).toBe(true)
  })

  it('rejeita menor sem responsável', () => {
    const result = patientServiceRequestSchema.safeParse({
      ...basePayload,
      birthDate: '2015-05-10',
    })
    expect(result.success).toBe(false)
  })

  it('aceita menor com responsável completo', () => {
    const result = patientServiceRequestSchema.safeParse({
      ...basePayload,
      birthDate: '2015-05-10',
      responsibleFullName: 'João Silva',
      responsibleCpf: '39053344705',
    })
    expect(result.success).toBe(true)
  })

  it('exige aceite dos termos', () => {
    const result = patientServiceRequestSchema.safeParse({
      ...basePayload,
      termsAccepted: false,
    })
    expect(result.success).toBe(false)
  })
})
