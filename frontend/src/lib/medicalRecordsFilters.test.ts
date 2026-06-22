import { describe, expect, it } from 'vitest'
import {
  getMedicalRecordSearchText,
  isMedicalRecordNonCompliant,
  matchesMedicalRecordsFilters,
  type MedicalRecordListRow,
} from '@/lib/medicalRecordsFilters'

const baseRow: MedicalRecordListRow = {
  id: '1',
  record_type: 'evolucao',
  created_at: '2026-06-01T10:00:00Z',
  recorded_at: '2026-06-15T10:00:00Z',
  patient_id: 'p1',
  professional_id: 'pro1',
  session_id: 's1',
  cycle_id: 'c1',
  content_richtext: '<p>Evolução ok</p>',
  patients: { full_name: 'Maria Silva', region_id: 'r1' },
  professionals: { full_name: 'João PP' },
}

describe('medicalRecordsFilters', () => {
  it('matches period and nested region', () => {
    expect(
      matchesMedicalRecordsFilters(baseRow, { recorded_from: '2026-06-15', recorded_to: '2026-06-15' }),
    ).toBe(true)
    expect(matchesMedicalRecordsFilters(baseRow, { region_id: 'r2' })).toBe(false)
    expect(matchesMedicalRecordsFilters(baseRow, { session_link: 'without' })).toBe(false)
  })

  it('flags non-compliant records', () => {
    expect(isMedicalRecordNonCompliant({ ...baseRow, content_richtext: '<p></p>' })).toBe(true)
    expect(isMedicalRecordNonCompliant({ ...baseRow, alert_24h_triggered: true })).toBe(true)
    expect(isMedicalRecordNonCompliant(baseRow)).toBe(false)
  })

  it('builds searchable text from nested fields', () => {
    expect(getMedicalRecordSearchText(baseRow)).toContain('Maria Silva')
    expect(getMedicalRecordSearchText(baseRow)).toContain('João PP')
  })
})
