import type { DemandListItem } from '@/services/demands'

export interface DemandListFilters {
  status?: string
  demand_type?: string
  required_profession?: string
  region_id?: string
  assigned_professional_id?: string
  sem_pp?: boolean
  patient_level?: string
  attendance_period?: string
  neighborhood?: string
  created_from?: string
  created_to?: string
}

export const emptyDemandFilters: DemandListFilters = {}

export function countActiveDemandFilters(filters: DemandListFilters): number {
  let n = 0
  if (filters.status) n++
  if (filters.demand_type) n++
  if (filters.required_profession) n++
  if (filters.region_id) n++
  if (filters.assigned_professional_id) n++
  if (filters.sem_pp) n++
  if (filters.patient_level) n++
  if (filters.attendance_period) n++
  if (filters.neighborhood?.trim()) n++
  if (filters.created_from) n++
  if (filters.created_to) n++
  return n
}

export function matchesDemandFilters(row: DemandListItem, filters: DemandListFilters): boolean {
  if (filters.status && String(row.status) !== filters.status) return false
  if (filters.demand_type && row.demand_type !== filters.demand_type) return false
  if (filters.required_profession && String(row.required_profession) !== filters.required_profession) return false
  if (filters.region_id && row.region_id !== filters.region_id) return false
  if (filters.sem_pp && row.assigned_professional_id) return false
  if (filters.assigned_professional_id && row.assigned_professional_id !== filters.assigned_professional_id) {
    return false
  }
  if (filters.patient_level && row.patient_level !== filters.patient_level) return false
  if (filters.attendance_period && row.attendance_period_raw !== filters.attendance_period) return false
  if (filters.neighborhood?.trim()) {
    const q = filters.neighborhood.trim().toLowerCase()
    if (!row.location_neighborhood?.toLowerCase().includes(q)) return false
  }
  if (filters.created_from && row.created_at) {
    const created = new Date(String(row.created_at))
    const from = new Date(`${filters.created_from}T00:00:00`)
    if (created < from) return false
  }
  if (filters.created_to && row.created_at) {
    const created = new Date(String(row.created_at))
    const to = new Date(`${filters.created_to}T23:59:59.999`)
    if (created > to) return false
  }
  return true
}
