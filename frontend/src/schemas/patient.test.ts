import { describe, expect, it } from 'vitest'
import { cpfSchema } from '@/schemas/common'
import { patientStepSchema } from '@/schemas/patient'

describe('patient schemas', () => {
  it('rejeita CPF inválido', () => {
    const result = cpfSchema.safeParse('11111111111')
    expect(result.success).toBe(false)
  })

  it('aceita dados mínimos do paciente', () => {
    const result = patientStepSchema.safeParse({
      full_name: 'Maria Silva',
      cpf: '52998224725',
      birth_date: '1990-01-15',
      patient_level: 'N1',
      care_status: 'ATIVO',
      region_id: '00000000-0000-4000-8000-000000000001',
      city_id: '00000000-0000-4000-8000-000000000002',
      is_valor_social: false,
    })
    expect(result.success).toBe(true)
  })
})
