import { describe, expect, it } from 'vitest'
import { cpfSchema } from '@/schemas/common'
import { patientEditSchema, patientStepSchema, patientWizardSchema } from '@/schemas/patient'
import { syncCityRegion } from '@/services/regions'

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

  it('salva edição mesmo sem CPF, nascimento ou cidade', () => {
    const result = patientEditSchema.safeParse({
      full_name: 'Maria Silva',
      cpf: '',
      birth_date: '',
      patient_level: 'N1',
      care_status: 'ATIVO',
      region_id: '',
      city_id: '',
      allocated_professional_id: '00000000-0000-4000-8000-000000000010',
      clinical_summary: '  Nova nota  ',
      is_valor_social: false,
    })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.cpf).toBeNull()
    expect(result.data.birth_date).toBeNull()
    expect(result.data.city_id).toBeNull()
    expect(result.data.clinical_summary).toBe('Nova nota')
    expect(result.data.allocated_professional_id).toBe('00000000-0000-4000-8000-000000000010')
  })

  it('exige cidade igual entre paciente e endereço no wizard', () => {
    const base = {
      patient: {
        full_name: 'Maria Silva',
        cpf: '52998224725',
        birth_date: '1990-01-15',
        patient_level: 'N1' as const,
        care_status: 'ATIVO' as const,
        region_id: '00000000-0000-4000-8000-000000000001',
        city_id: '00000000-0000-4000-8000-000000000002',
        is_valor_social: false,
      },
      responsible: {
        full_name: 'João Silva',
        cpf: '39053344705',
        email: 'joao@example.com',
        phone: '11999999999',
        is_primary: true,
      },
      address: {
        street: 'Rua A',
        number: '100',
        neighborhood: 'Centro',
        postal_code: '09300000',
        city_id: '00000000-0000-4000-8000-000000000003',
      },
      documents: [],
    }

    expect(patientWizardSchema.safeParse(base).success).toBe(false)
    expect(
      patientWizardSchema.safeParse({
        ...base,
        address: { ...base.address, city_id: base.patient.city_id },
      }).success,
    ).toBe(true)
  })
})

describe('syncCityRegion', () => {
  it('retorna região da cidade selecionada', () => {
    const cities = [
      { id: 'city-1', region_id: 'region-1' },
      { id: 'city-2', region_id: 'region-2' },
    ]

    expect(syncCityRegion('city-2', cities)).toEqual({
      cityId: 'city-2',
      regionId: 'region-2',
    })
    expect(syncCityRegion('missing', cities)).toBeNull()
  })
})
