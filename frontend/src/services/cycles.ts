import { supabase } from '@/lib/supabase'

type CycleRow = {
  id: string
  cycle_number: number
  session_count: number
  status: string
  payment_status: string
  created_at: string
  started_at: string | null
  patient_id: string
  assigned_professional_id: string
  region_id: string | null
  patient_level: string
  patients: { full_name: string } | null
  professionals: { full_name: string } | null
  care_sessions: Array<{ status: string }> | null
}

export type CycleListItem = {
  id: string
  cycle_number: number
  session_count: number
  status: string
  payment_status: string
  created_at: string
  started_at: string | null
  patient_id: string
  assigned_professional_id: string
  region_id: string | null
  patient_level: string
  patient_name: string
  professional_name: string
  completed_sessions: number
}

const CYCLE_LIST_SELECT = `
  id,
  cycle_number,
  session_count,
  status,
  payment_status,
  created_at,
  started_at,
  patient_id,
  assigned_professional_id,
  region_id,
  patient_level,
  patients ( full_name ),
  professionals:professionals!care_cycles_assigned_professional_id_fkey ( full_name ),
  care_sessions ( status )
`

function mapCycleRow(row: CycleRow): CycleListItem {
  const sessions = row.care_sessions ?? []
  const completed_sessions = sessions.filter((s) => s.status === 'realizada').length

  return {
    id: row.id,
    cycle_number: row.cycle_number,
    session_count: row.session_count,
    status: row.status,
    payment_status: row.payment_status,
    created_at: row.created_at,
    started_at: row.started_at,
    patient_id: row.patient_id,
    assigned_professional_id: row.assigned_professional_id,
    region_id: row.region_id,
    patient_level: row.patient_level,
    patient_name: row.patients?.full_name ?? '—',
    professional_name: row.professionals?.full_name ?? '—',
    completed_sessions,
  }
}

export async function listCareCycles() {
  const { data, error } = await supabase
    .from('care_cycles')
    .select(CYCLE_LIST_SELECT)
    .order('created_at', { ascending: false })

  if (error) throw error

  const rows = (data ?? []) as unknown as CycleRow[]
  const mapped = rows.map(mapCycleRow)

  return { data: mapped, count: mapped.length }
}
