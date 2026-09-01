import { describe, expect, it } from 'vitest'
import {
  normalizeBirthDate,
  normalizeBoolean,
  normalizeCpf,
  normalizePatientLevel,
  normalizePatientRow,
  normalizePatente,
  normalizeRegionCode,
} from '@/services/bulkImportNormalizer'

describe('bulkImportNormalizer', () => {
  it('converte CPF em notação científica', () => {
    expect(normalizeCpf('6.177652182E10')).toHaveLength(11)
  })

  it('converte serial Excel em data ISO', () => {
    expect(normalizeBirthDate(45000)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('normaliza nível legível', () => {
    expect(normalizePatientLevel('Nível 2')).toBe('N2')
  })

  it('normaliza região legível', () => {
    expect(normalizeRegionCode('Região A')).toBe('A')
  })

  it('normaliza patente case-insensitive', () => {
    expect(normalizePatente('Bronze')).toBe('BRONZE')
  })

  it('normaliza boolean Excel', () => {
    expect(normalizeBoolean('1')).toBe('true')
    expect(normalizeBoolean('0')).toBe('false')
  })

  it('move texto clínico de asaas_customer_id para clinical_summary', () => {
    const longText = 'Paciente com dor lombar crônica e limitação funcional importante no dia a dia'
    const row = normalizePatientRow({
      full_name: 'Maria',
      asaas_customer_id: longText,
      clinical_summary: '',
    })
    expect(row.clinical_summary).toBe(longText)
    expect(row.asaas_customer_id).toBe('')
  })
})
