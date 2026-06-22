import type { CycleListItem } from '@/services/cycles'

export interface CareCyclesListFilters {
  status?: string
  payment_status?: string
  patient_id?: string
  assigned_professional_id?: string
  region_id?: string
  patient_level?: string
  session_count?: number
  started_from?: string
  started_to?: string
}

export const emptyCareCyclesFilters: CareCyclesListFilters = {}

export function getCareCycleSearchText(row: CycleListItem): string {
  return [
    row.patient_name,
    row.professional_name,
    `#${row.cycle_number}`,
    row.status,
    row.payment_status,
    row.patient_level,
  ]
    .filter(Boolean)
    .join(' ')
}

function inDateRange(value: string | null, from?: string, to?: string): boolean {
  if (!from && !to) return true
  if (!value) return false
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

export function countActiveCareCyclesFilters(filters: CareCyclesListFilters): number {
  let n = 0
  if (filters.status) n++
  if (filters.payment_status) n++
  if (filters.patient_id) n++
  if (filters.assigned_professional_id) n++
  if (filters.region_id) n++
  if (filters.patient_level) n++
  if (filters.session_count) n++
  if (filters.started_from) n++
  if (filters.started_to) n++
  return n
}

export function matchesCareCyclesFilters(row: CycleListItem, filters: CareCyclesListFilters): boolean {
  if (filters.status && row.status !== filters.status) return false
  if (filters.payment_status && row.payment_status !== filters.payment_status) return false
  if (filters.patient_id && row.patient_id !== filters.patient_id) return false
  if (filters.assigned_professional_id && row.assigned_professional_id !== filters.assigned_professional_id) {
    return false
  }
  if (filters.region_id && row.region_id !== filters.region_id) return false
  if (filters.patient_level && row.patient_level !== filters.patient_level) return false
  if (filters.session_count && row.session_count !== filters.session_count) return false

  const rangeDate = row.started_at ?? row.created_at
  if (!inDateRange(rangeDate, filters.started_from, filters.started_to)) return false

  return true
}

export function isCareCyclePaymentPending(row: Pick<CycleListItem, 'payment_status'>): boolean {
  return row.payment_status === 'pendente' || row.payment_status === 'vencido'
}
