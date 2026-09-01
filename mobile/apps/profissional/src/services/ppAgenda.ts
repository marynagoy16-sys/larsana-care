import {
  addDays,
  endOfDay,
  isSameDay,
  startOfDay,
} from 'date-fns'
import { getWeekRange } from '@/lib/agendaWeek'
import { supabase } from '@/lib/supabase'
import { resolveSessionTimes } from '@/lib/agendaTimeline'
import { resolveAgendaDisplayStatus } from '@/lib/sessionStatus'

const AGENDA_SESSION_SELECT = `
  id,
  session_number,
  scheduled_at,
  status,
  check_in_at,
  check_out_at,
  is_assessment_session,
  cycle_id,
  care_cycles (
    cycle_number,
    patient_level,
    patients (
      id,
      full_name,
      attendance_period,
      patient_addresses ( full_address, neighborhood, is_primary )
    )
  ),
  medical_records ( id )
`

export type AgendaSessionRow = {
  id: string
  session_number: number
  scheduled_at: string | null
  status: string
  check_in_at: string | null
  check_out_at: string | null
  is_assessment_session: boolean
  cycle_id: string
  care_cycles: {
    cycle_number: number
    patient_level: string
    patients: {
      id: string
      full_name: string
      attendance_period: string | null
      patient_addresses: Array<{
        full_address: string
        neighborhood: string | null
        is_primary: boolean
      }> | null
    } | null
  } | null
  medical_records: Array<{ id: string }> | { id: string } | null
}

export type AgendaSessionItem = {
  id: string
  sessionNumber: number
  cycleNumber: number
  patientId: string
  patientName: string
  patientLevel: string
  attendancePeriod: string | null
  address: string | null
  neighborhood: string | null
  status: string
  displayStatus: ReturnType<typeof resolveAgendaDisplayStatus>
  isAssessment: boolean
  scheduledAt: string | null
  checkInAt: string | null
  checkOutAt: string | null
  start: Date
  end: Date
  hasEvolution: boolean
}

export type AgendaDaySummary = {
  total: number
  completed: number
  scheduled: number
  pendingEvolution: number
}

export const ppAgendaQueryKeys = {
  day: (isoDate: string) => ['pp', 'agenda', 'day', isoDate] as const,
  upcoming: (limit: number) => ['pp', 'agenda', 'upcoming', limit] as const,
  week: (isoDate: string) => ['pp', 'agenda', 'week', isoDate] as const,
  session: (sessionId: string) => ['pp', 'agenda', 'session', sessionId] as const,
}

function normalizeRecords(records: AgendaSessionRow['medical_records']): Array<{ id: string }> {
  if (!records) return []
  return Array.isArray(records) ? records : [records]
}

function resolvePrimaryAddress(
  addresses: Array<{ full_address: string; neighborhood: string | null; is_primary: boolean }> | null | undefined,
): { full_address: string; neighborhood: string | null } | null {
  if (!addresses?.length) return null
  return addresses.find((a) => a.is_primary) ?? addresses[0] ?? null
}

function mapSessionRow(row: AgendaSessionRow): AgendaSessionItem | null {
  const times = resolveSessionTimes(row.scheduled_at, row.check_in_at, row.check_out_at)
  if (!times) return null

  const patient = row.care_cycles?.patients
  if (!patient) return null

  const hasEvolution = normalizeRecords(row.medical_records).length > 0
  const addressInfo = resolvePrimaryAddress(patient.patient_addresses)

  return {
    id: row.id,
    sessionNumber: row.session_number,
    cycleNumber: row.care_cycles?.cycle_number ?? 0,
    patientId: patient.id,
    patientName: patient.full_name,
    patientLevel: row.care_cycles?.patient_level ?? '',
    attendancePeriod: patient.attendance_period,
    address: addressInfo?.full_address ?? null,
    neighborhood: addressInfo?.neighborhood ?? null,
    status: row.status,
    displayStatus: resolveAgendaDisplayStatus(row.status, hasEvolution),
    isAssessment: row.is_assessment_session,
    scheduledAt: row.scheduled_at,
    checkInAt: row.check_in_at,
    checkOutAt: row.check_out_at,
    start: times.start,
    end: times.end,
    hasEvolution,
  }
}

export function buildAgendaDaySummary(sessions: AgendaSessionItem[]): AgendaDaySummary {
  return {
    total: sessions.length,
    completed: sessions.filter((s) => s.status === 'realizada' && s.hasEvolution).length,
    scheduled: sessions.filter((s) => s.status === 'prevista' || s.status === 'remarcada').length,
    pendingEvolution: sessions.filter((s) => s.displayStatus === 'evolucao_pendente').length,
  }
}

async function resolveProfessionalId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: professional, error } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error
  return professional?.id ?? null
}

async function listAgendaSessionsInRange(rangeStart: Date, rangeEnd: Date): Promise<AgendaSessionItem[]> {
  const professionalId = await resolveProfessionalId()
  if (!professionalId) return []

  const { data, error } = await supabase
    .from('care_sessions')
    .select(AGENDA_SESSION_SELECT)
    .eq('professional_id', professionalId)
    .gte('scheduled_at', rangeStart.toISOString())
    .lte('scheduled_at', rangeEnd.toISOString())
    .order('scheduled_at', { ascending: true })

  if (error) throw error

  return (data as unknown as AgendaSessionRow[])
    .map(mapSessionRow)
    .filter((item): item is AgendaSessionItem => item !== null)
}

export async function listAgendaSessionsForDay(day: Date): Promise<AgendaSessionItem[]> {
  return listAgendaSessionsInRange(startOfDay(day), endOfDay(day))
}

export async function listUpcomingAgendaSessions(options?: {
  limit?: number
  horizonDays?: number
}): Promise<AgendaSessionItem[]> {
  const limit = options?.limit ?? 5
  const horizonDays = options?.horizonDays ?? 14
  const today = startOfDay(new Date())
  const rangeEnd = endOfDay(addDays(today, horizonDays))
  const now = new Date()

  const sessions = await listAgendaSessionsInRange(today, rangeEnd)

  return sessions
    .filter((session) => {
      if (session.status !== 'prevista' && session.status !== 'remarcada') return false
      return session.start >= now || isSameDay(session.start, today)
    })
    .slice(0, limit)
}

export async function listAgendaSessionsForWeek(anchor: Date): Promise<AgendaSessionItem[]> {
  const { start, end } = getWeekRange(anchor)
  return listAgendaSessionsInRange(startOfDay(start), endOfDay(end))
}

export async function getAgendaSessionById(sessionId: string): Promise<AgendaSessionItem | null> {
  const professionalId = await resolveProfessionalId()
  if (!professionalId) return null

  const { data, error } = await supabase
    .from('care_sessions')
    .select(AGENDA_SESSION_SELECT)
    .eq('id', sessionId)
    .eq('professional_id', professionalId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapSessionRow(data as unknown as AgendaSessionRow)
}
