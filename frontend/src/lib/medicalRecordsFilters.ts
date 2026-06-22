export interface MedicalRecordListRow {
  id: string
  record_type: string
  created_at: string
  recorded_at: string
  patient_id: string
  professional_id: string
  session_id?: string | null
  cycle_id?: string | null
  content_richtext?: string | null
  definitive_deadline_at?: string | null
  alert_24h_triggered?: boolean
  patients?: { full_name?: string; region_id?: string | null } | null
  professionals?: { full_name?: string } | null
}

export type MedicalRecordSessionLink = 'all' | 'with' | 'without'

export interface MedicalRecordsListFilters {
  recorded_from?: string
  recorded_to?: string
  patient_id?: string
  professional_id?: string
  record_type?: string
  region_id?: string
  cycle_id?: string
  session_link?: MedicalRecordSessionLink
  compliance_only?: boolean
}

export const emptyMedicalRecordsFilters: MedicalRecordsListFilters = {}

export function getMedicalRecordSearchText(row: MedicalRecordListRow): string {
  const patient = row.patients?.full_name ?? ''
  const professional = row.professionals?.full_name ?? ''
  const type = row.record_type ?? ''
  const content = row.content_richtext?.replace(/<[^>]*>/g, ' ') ?? ''
  return [patient, professional, type, content, row.patient_id, row.professional_id].join(' ')
}

export function hasMedicalRecordContent(row: MedicalRecordListRow): boolean {
  const plain = row.content_richtext?.replace(/<[^>]*>/g, '').trim()
  return Boolean(plain)
}

export function isMedicalRecordNonCompliant(row: MedicalRecordListRow): boolean {
  if (!hasMedicalRecordContent(row)) return true
  if (row.alert_24h_triggered) return true
  return false
}

export function countActiveMedicalRecordsFilters(filters: MedicalRecordsListFilters): number {
  let n = 0
  if (filters.recorded_from) n++
  if (filters.recorded_to) n++
  if (filters.patient_id) n++
  if (filters.professional_id) n++
  if (filters.record_type) n++
  if (filters.region_id) n++
  if (filters.cycle_id) n++
  if (filters.session_link && filters.session_link !== 'all') n++
  if (filters.compliance_only) n++
  return n
}

export function matchesMedicalRecordsFilters(
  row: MedicalRecordListRow,
  filters: MedicalRecordsListFilters,
): boolean {
  const recordedAt = new Date(row.recorded_at ?? row.created_at)

  if (filters.recorded_from) {
    const from = new Date(`${filters.recorded_from}T00:00:00`)
    if (recordedAt < from) return false
  }
  if (filters.recorded_to) {
    const to = new Date(`${filters.recorded_to}T23:59:59.999`)
    if (recordedAt > to) return false
  }
  if (filters.patient_id && row.patient_id !== filters.patient_id) return false
  if (filters.professional_id && row.professional_id !== filters.professional_id) return false
  if (filters.record_type && row.record_type !== filters.record_type) return false
  if (filters.region_id && row.patients?.region_id !== filters.region_id) return false
  if (filters.cycle_id && row.cycle_id !== filters.cycle_id) return false

  if (filters.session_link === 'with' && !row.session_id) return false
  if (filters.session_link === 'without' && row.session_id) return false

  if (filters.compliance_only && !isMedicalRecordNonCompliant(row)) return false

  return true
}
