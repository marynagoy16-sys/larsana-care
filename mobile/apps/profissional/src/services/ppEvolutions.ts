import { supabase } from '@/lib/supabase'

export type PendingEvolutionRow = {
  id: string
  session_number: number
  scheduled_at: string | null
  check_out_at: string | null
  updated_at: string
  cycle_id: string
  care_cycles: {
    cycle_number: number
    patient_id: string
    patients: { full_name: string } | null
  } | null
}

export type EvolutionSessionContext = {
  sessionId: string
  sessionNumber: number
  cycleId: string
  cycleNumber: number
  patientId: string
  patientName: string
}

export const ppEvolutionsQueryKeys = {
  pending: ['pp', 'evolucoes', 'pending'] as const,
}

export async function getEvolutionSessionContext(sessionId: string): Promise<EvolutionSessionContext | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: professional } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.id) return null

  const { data, error } = await (supabase as any)
    .from('care_sessions')
    .select(`
      id,
      session_number,
      cycle_id,
      care_cycles!inner (
        cycle_number,
        patient_id,
        patients ( full_name )
      )
    `)
    .eq('id', sessionId)
    .eq('professional_id', professional.id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const cycle = data.care_cycles as PendingEvolutionRow['care_cycles']
  if (!cycle?.patient_id) return null

  return {
    sessionId: data.id,
    sessionNumber: data.session_number,
    cycleId: data.cycle_id,
    cycleNumber: cycle.cycle_number,
    patientId: cycle.patient_id,
    patientName: cycle.patients?.full_name ?? 'Paciente',
  }
}

export async function listPendingEvolutionsForPp(): Promise<{
  data: PendingEvolutionRow[]
  count: number
}> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], count: 0 }

  const { data: professional } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.id) return { data: [], count: 0 }

  const { data: sessions, error: sessionsError } = await supabase
    .from('care_sessions')
    .select(`
      id,
      session_number,
      scheduled_at,
      check_out_at,
      updated_at,
      cycle_id,
      care_cycles!inner (
        cycle_number,
        patient_id,
        patients ( full_name )
      )
    `)
    .eq('professional_id', professional.id)
    .eq('status', 'realizada')
    .order('check_out_at', { ascending: false, nullsFirst: false })

  if (sessionsError) throw sessionsError
  if (!sessions?.length) return { data: [], count: 0 }

  const sessionIds = sessions.map((s) => s.id)
  const { data: records, error: recordsError } = await supabase
    .from('medical_records')
    .select('session_id')
    .in('session_id', sessionIds)

  if (recordsError) throw recordsError

  const withRecord = new Set((records ?? []).map((r) => r.session_id))
  const pending = sessions.filter((s) => !withRecord.has(s.id)) as PendingEvolutionRow[]

  return { data: pending, count: pending.length }
}

export function hoursSinceSession(row: PendingEvolutionRow): number | null {
  const ref = row.check_out_at ?? row.scheduled_at
  if (!ref) return null
  return Math.floor((Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60))
}

export function pendingEvolutionDeadlineLabel(row: PendingEvolutionRow): string {
  const hours = hoursSinceSession(row)
  if (hours === null) return '—'
  if (hours >= 24) return `Atrasada · ${hours}h`
  return `Restam ${24 - hours}h`
}
