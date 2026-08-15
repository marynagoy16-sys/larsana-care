import { supabase } from '@/lib/supabase'

export type PatientCycleSummary = {
  id: string
  cycle_number: number
  status: string
  payment_status: string
  session_count: number
  completedSessions: number
  professionalName: string | null
  nextSessionAt: string | null
  pendingChargeId: string | null
}

export type PatientTreatmentPageData = {
  activeCycle: PatientCycleSummary | null
  cycles: PatientCycleSummary[]
}

export type PatientCycleSession = {
  id: string
  session_number: number
  scheduled_at: string | null
  status: string
  professionalName: string | null
}

export type PatientCycleDetail = {
  id: string
  patient_id: string
  cycle_number: number
  status: string
  payment_status: string
  session_count: number
  completedSessions: number
  professionalName: string | null
  pendingChargeId: string | null
  sessions: PatientCycleSession[]
}

type CycleListRow = {
  id: string
  cycle_number: number
  status: string
  payment_status: string
  session_count: number
  professionals: { full_name: string } | null
  care_sessions: Array<{ status: string; scheduled_at: string | null }> | null
}

type CycleDetailRow = {
  id: string
  patient_id: string
  cycle_number: number
  status: string
  payment_status: string
  session_count: number
  professionals: { full_name: string } | null
  care_sessions: Array<{
    id: string
    session_number: number
    scheduled_at: string | null
    status: string
    professionals: { full_name: string } | null
  }> | null
}

function summarizeCycle(row: CycleListRow, pendingChargeId: string | null): PatientCycleSummary {
  const sessions = row.care_sessions ?? []
  const completedSessions = sessions.filter((s) => s.status === 'realizada').length
  const nextSessionAt =
    sessions
      .filter((s) => s.status === 'prevista' && s.scheduled_at)
      .map((s) => s.scheduled_at!)
      .sort()[0] ?? null

  return {
    id: row.id,
    cycle_number: row.cycle_number,
    status: row.status,
    payment_status: row.payment_status,
    session_count: row.session_count,
    completedSessions,
    professionalName: row.professionals?.full_name ?? null,
    nextSessionAt,
    pendingChargeId,
  }
}

async function loadPendingChargesByCycleId(): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('charges_patient')
    .select('id, cycle_id')
    .in('payment_status', ['pendente', 'vencido'])

  if (error) throw error

  const map = new Map<string, string>()
  for (const row of data ?? []) {
    const cycleId = (row as { id: string; cycle_id: string | null }).cycle_id
    const chargeId = (row as { id: string; cycle_id: string | null }).id
    if (cycleId && !map.has(cycleId)) {
      map.set(cycleId, chargeId)
    }
  }
  return map
}

export async function loadPatientTreatmentPage(): Promise<PatientTreatmentPageData> {
  const [{ data, error }, pendingChargesByCycleId] = await Promise.all([
    supabase
      .from('care_cycles')
      .select(
        `id, cycle_number, status, payment_status, session_count,
      professionals:professionals!care_cycles_assigned_professional_id_fkey ( full_name ),
      care_sessions ( status, scheduled_at )`,
      )
      .order('created_at', { ascending: false }),
    loadPendingChargesByCycleId(),
  ])

  if (error) throw error

  const cycles = ((data ?? []) as CycleListRow[]).map((row) =>
    summarizeCycle(row, pendingChargesByCycleId.get(row.id) ?? null),
  )
  const activeCycle =
    cycles.find((cycle) => cycle.status === 'ativo' && cycle.payment_status === 'pago') ?? null

  return { activeCycle, cycles }
}

export async function loadPatientCycleDetail(cycleId: string): Promise<PatientCycleDetail | null> {
  const [{ data, error }, pendingChargesByCycleId] = await Promise.all([
    supabase
      .from('care_cycles')
      .select(
        `id, patient_id, cycle_number, status, payment_status, session_count,
      professionals:professionals!care_cycles_assigned_professional_id_fkey ( full_name ),
      care_sessions (
        id, session_number, scheduled_at, status,
        professionals:professionals!care_sessions_professional_id_fkey ( full_name )
      )`,
      )
      .eq('id', cycleId)
      .order('session_number', { referencedTable: 'care_sessions', ascending: true })
      .maybeSingle(),
    loadPendingChargesByCycleId(),
  ])

  if (error) throw error
  if (!data) return null

  const row = data as CycleDetailRow
  const sessions = row.care_sessions ?? []

  return {
    id: row.id,
    patient_id: row.patient_id,
    cycle_number: row.cycle_number,
    status: row.status,
    payment_status: row.payment_status,
    session_count: row.session_count,
    completedSessions: sessions.filter((s) => s.status === 'realizada').length,
    professionalName: row.professionals?.full_name ?? null,
    pendingChargeId: pendingChargesByCycleId.get(row.id) ?? null,
    sessions: sessions.map((session) => ({
      id: session.id,
      session_number: session.session_number,
      scheduled_at: session.scheduled_at,
      status: session.status,
      professionalName: session.professionals?.full_name ?? null,
    })),
  }
}

export const patientTreatmentQueryKeys = {
  list: ['paciente', 'cycles-list'] as const,
  detail: (cycleId: string) => ['paciente', 'cycle-detail', cycleId] as const,
}
