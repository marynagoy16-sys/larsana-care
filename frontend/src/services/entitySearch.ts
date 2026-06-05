import { supabase } from '@/lib/supabase'
import { formatCpf } from '@/lib/formatters'
import { cycleStatusLabels } from '@/constants/labels'
import { listPatients } from '@/services/patients'

export interface SearchOption {
  id: string
  label: string
  subtitle?: string
}

export async function searchPatients(query: string): Promise<SearchOption[]> {
  const { data } = await listPatients({ search: query.trim() || undefined, pageSize: 15, page: 0 })
  return data.map((p) => ({
    id: p.id,
    label: p.full_name,
    subtitle: formatCpf(p.cpf),
  }))
}

export async function getPatientSearchOption(id: string): Promise<SearchOption | null> {
  const { data, error } = await supabase.from('patients').select('id, full_name, cpf').eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) return null
  return { id: data.id, label: data.full_name, subtitle: formatCpf(data.cpf) }
}

export interface ProfessionalSearchFilters {
  profession?: string
  credentialing_status?: string
}

export async function searchProfessionals(
  query: string,
  filters: ProfessionalSearchFilters = {},
): Promise<SearchOption[]> {
  let dbQuery = supabase
    .from('professionals')
    .select('id, full_name, profession, credentialing_status')
    .order('full_name')
    .limit(15)

  const q = query.trim()
  if (q) {
    dbQuery = dbQuery.ilike('full_name', `%${q}%`)
  }

  if (filters.profession) {
    dbQuery = dbQuery.eq('profession', filters.profession as never)
  }
  if (filters.credentialing_status) {
    dbQuery = dbQuery.eq('credentialing_status', filters.credentialing_status as never)
  }

  const { data, error } = await dbQuery
  if (error) throw error

  return (data ?? []).map((p) => ({
    id: p.id,
    label: p.full_name,
    subtitle: p.profession ?? undefined,
  }))
}

export async function getProfessionalSearchOption(id: string): Promise<SearchOption | null> {
  const { data, error } = await supabase
    .from('professionals')
    .select('id, full_name, profession')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return { id: data.id, label: data.full_name, subtitle: data.profession ?? undefined }
}

function mapCycleRow(cycle: {
  id: string
  cycle_number: number
  session_count: number
  status: string
  patients: { full_name: string } | { full_name: string }[] | null
}): SearchOption {
  const patientRaw = cycle.patients
  const patient = Array.isArray(patientRaw) ? patientRaw[0] : patientRaw
  const patientName = patient?.full_name ?? 'Paciente'
  const status = cycleStatusLabels[cycle.status] ?? cycle.status
  return {
    id: cycle.id,
    label: `#${cycle.cycle_number} — ${patientName}`,
    subtitle: `${cycle.session_count} sessões · ${status}`,
  }
}

export async function searchCareCycles(query: string, patientId?: string): Promise<SearchOption[]> {
  const q = query.trim()
  const asNumber = q ? Number.parseInt(q, 10) : Number.NaN

  if (q && !Number.isNaN(asNumber) && String(asNumber) === q) {
    let dbQuery = supabase
      .from('care_cycles')
      .select('id, cycle_number, session_count, status, patients(full_name)')
      .eq('cycle_number', asNumber)
      .order('created_at', { ascending: false })
      .limit(15)
    if (patientId) dbQuery = dbQuery.eq('patient_id', patientId)
    const { data, error } = await dbQuery
    if (error) throw error
    return (data ?? []).map(mapCycleRow)
  }

  let patientIds: string[] | undefined
  if (q) {
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id')
      .ilike('full_name', `%${q}%`)
      .limit(20)
    if (patientsError) throw patientsError
    patientIds = (patients ?? []).map((p) => p.id)
    if (patientIds.length === 0) return []
  }

  let dbQuery = supabase
    .from('care_cycles')
    .select('id, cycle_number, session_count, status, patients(full_name)')
    .order('created_at', { ascending: false })
    .limit(15)

  if (patientId) {
    dbQuery = dbQuery.eq('patient_id', patientId)
  } else if (patientIds) {
    dbQuery = dbQuery.in('patient_id', patientIds)
  }

  const { data, error } = await dbQuery
  if (error) throw error

  return (data ?? []).map((cycle) => mapCycleRow(cycle as Parameters<typeof mapCycleRow>[0]))
}

export async function getCareCycleSearchOption(id: string): Promise<SearchOption | null> {
  const { data, error } = await supabase
    .from('care_cycles')
    .select('id, cycle_number, session_count, status, patients(full_name)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return mapCycleRow(data as Parameters<typeof mapCycleRow>[0])
}
