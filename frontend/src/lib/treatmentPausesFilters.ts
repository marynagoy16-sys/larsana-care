import { isTreatmentPauseActive, type TreatmentPauseListRow } from '@/lib/treatmentPausesDisplay'

export type TreatmentPauseStatusFilter = 'active' | 'resumed'

export interface TreatmentPausesListFilters {
  pause_status?: TreatmentPauseStatusFilter
  paused_from?: string
  paused_to?: string
  resumed_from?: string
  resumed_to?: string
  patient_id?: string
  patient_care_status?: string
}

export const emptyTreatmentPausesFilters: TreatmentPausesListFilters = {}

function inDateRange(value: string, from?: string, to?: string): boolean {
  const date = new Date(value)
  if (from) {
    const start = new Date(`${from}T00:00:00`)
    if (date < start) return false
  }
  if (to) {
    const end = new Date(`${to}T23:59:59.999`)
    if (date > end) return false
  }
  return true
}

export function countActiveTreatmentPausesFilters(filters: TreatmentPausesListFilters): number {
  let n = 0
  if (filters.pause_status) n++
  if (filters.paused_from) n++
  if (filters.paused_to) n++
  if (filters.resumed_from) n++
  if (filters.resumed_to) n++
  if (filters.patient_id) n++
  if (filters.patient_care_status) n++
  return n
}

export function matchesTreatmentPausesFilters(
  row: TreatmentPauseListRow,
  filters: TreatmentPausesListFilters,
): boolean {
  if (filters.pause_status === 'active' && !isTreatmentPauseActive(row)) return false
  if (filters.pause_status === 'resumed' && isTreatmentPauseActive(row)) return false

  if (!inDateRange(String(row.paused_at), filters.paused_from, filters.paused_to)) return false

  if (filters.resumed_from || filters.resumed_to) {
    if (!row.resumed_at) return false
    if (!inDateRange(String(row.resumed_at), filters.resumed_from, filters.resumed_to)) return false
  }

  if (filters.patient_id && row.patient_id !== filters.patient_id) return false

  if (filters.patient_care_status && row.patients?.care_status !== filters.patient_care_status) {
    return false
  }

  return true
}
