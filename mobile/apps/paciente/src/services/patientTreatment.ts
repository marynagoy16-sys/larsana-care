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
  cycle_number: number
  status: string
  session_count: number
  completedSessions: number
  professionalName: string | null
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
  cycle_number: number
  status: string
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

function summarizeCycle(row: CycleListRow): PatientCycleSummary {
  const sessions = row.care_sessions ?? []
  const completedSessions = sessions.filter((s) => s.status === 'realizada').length
  const nowIso = new Date().toISOString()
  const nextSessionAt =
    sessions
      .filter(
        (s) =>
          (s.status === 'prevista' || s.status === 'remarcada') &&
          s.scheduled_at &&
          s.scheduled_at >= nowIso,
      )
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
  }
}

function isVisibleTreatmentCycle(status: string): boolean {
  return status !== 'rascunho'
}

export async function loadPatientTreatmentPage(): Promise<PatientTreatmentPageData> {
  const { data, error } = await supabase
    .from('care_cycles')
    .select(
      `id, cycle_number, status, payment_status, session_count,
      professionals:assigned_professional_id ( full_name ),
      care_sessions ( status, scheduled_at )`,
    )
    .neq('status', 'rascunho')
    .order('created_at', { ascending: false })

  if (error) throw error

  const cycles = ((data ?? []) as CycleListRow[])
    .filter((row) => isVisibleTreatmentCycle(row.status))
    .map(summarizeCycle)
  const activeCycle =
    cycles.find((cycle) => cycle.status === 'ativo' && cycle.payment_status === 'pago') ?? null

  return { activeCycle, cycles }
}

export async function loadPatientCycleDetail(cycleId: string): Promise<PatientCycleDetail | null> {
  const { data, error } = await supabase
    .from('care_cycles')
    .select(
      `id, cycle_number, status, session_count,
      professionals:assigned_professional_id ( full_name ),
      care_sessions (
        id, session_number, scheduled_at, status,
        professionals:professional_id ( full_name )
      )`,
    )
    .eq('id', cycleId)
    .order('session_number', { referencedTable: 'care_sessions', ascending: true })
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const row = data as CycleDetailRow
  if (!isVisibleTreatmentCycle(row.status)) return null

  const sessions = row.care_sessions ?? []

  return {
    id: row.id,
    cycle_number: row.cycle_number,
    status: row.status,
    session_count: row.session_count,
    completedSessions: sessions.filter((s) => s.status === 'realizada').length,
    professionalName: row.professionals?.full_name ?? null,
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
