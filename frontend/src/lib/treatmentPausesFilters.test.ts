import { describe, expect, it } from 'vitest'
import { matchesTreatmentPausesFilters, type TreatmentPausesListFilters } from '@/lib/treatmentPausesFilters'
import type { TreatmentPauseListRow } from '@/lib/treatmentPausesDisplay'

const baseRow: TreatmentPauseListRow = {
  id: '1',
  patient_id: 'p1',
  paused_at: '2026-06-05T11:26:00Z',
  resumed_at: null,
  reason: 'Cancelamento',
  created_at: '2026-06-05T11:26:00Z',
  patients: { full_name: 'Paciente Demo', care_status: 'PAUSA' },
}

describe('treatmentPausesFilters', () => {
  it('filters by status, patient and care status', () => {
    expect(matchesTreatmentPausesFilters(baseRow, { pause_status: 'active' })).toBe(true)
    expect(matchesTreatmentPausesFilters(baseRow, { pause_status: 'resumed' })).toBe(false)
    expect(matchesTreatmentPausesFilters(baseRow, { patient_id: 'p1' })).toBe(true)
    expect(matchesTreatmentPausesFilters(baseRow, { patient_care_status: 'ATIVO' })).toBe(false)
  })

  it('filters by paused and resumed date ranges', () => {
    const resumed: TreatmentPauseListRow = {
      ...baseRow,
      resumed_at: '2026-06-10T10:00:00Z',
    }
    expect(
      matchesTreatmentPausesFilters(baseRow, { paused_from: '2026-06-05', paused_to: '2026-06-05' }),
    ).toBe(true)
    expect(
      matchesTreatmentPausesFilters(resumed, { resumed_from: '2026-06-10', resumed_to: '2026-06-10' }),
    ).toBe(true)
    expect(matchesTreatmentPausesFilters(baseRow, { resumed_from: '2026-06-01' })).toBe(false)
  })
})
