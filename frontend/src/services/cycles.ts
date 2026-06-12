import { supabase } from '@/lib/supabase'

type CycleRow = {
  id: string
  cycle_number: number
  session_count: number
  status: string
  payment_status: string
  created_at: string
  patients: { full_name: string } | null
  care_sessions: Array<{ status: string }> | null
}

export type CycleListItem = {
  id: string
  cycle_number: number
  session_count: number
  status: string
  payment_status: string
  created_at: string
  patient_name: string
  completed_sessions: number
}

const CYCLE_LIST_SELECT = `
  id,
  cycle_number,
  session_count,
  status,
  payment_status,
  created_at,
  patients ( full_name ),
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
    patient_name: row.patients?.full_name ?? '—',
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
