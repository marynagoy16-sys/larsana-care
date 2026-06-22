import { describe, expect, it } from 'vitest'
import {
  formatPauseDuration,
  getTreatmentPauseStatusLabel,
  isTreatmentPauseActive,
} from '@/lib/treatmentPausesDisplay'

describe('treatmentPausesDisplay', () => {
  it('detects active and resumed pauses', () => {
    expect(isTreatmentPauseActive({ resumed_at: null })).toBe(true)
    expect(isTreatmentPauseActive({ resumed_at: '2026-06-10T10:00:00Z' })).toBe(false)
    expect(getTreatmentPauseStatusLabel({ resumed_at: null })).toBe('Em pausa')
    expect(getTreatmentPauseStatusLabel({ resumed_at: '2026-06-10T10:00:00Z' })).toBe('Retomado')
  })

  it('formats pause duration', () => {
    expect(formatPauseDuration('2026-06-01T10:00:00Z', '2026-06-04T10:00:00Z')).toBe('3 dias')
    expect(formatPauseDuration('2026-06-01T10:00:00Z', '2026-06-01T12:00:00Z')).toBe('2 h')
  })
})
