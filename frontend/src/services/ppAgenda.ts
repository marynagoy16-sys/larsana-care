import {
  addDays,
  endOfDay,
  format,
  isSameDay,
  startOfDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { getWeekRange } from '@/lib/agendaWeek'
import {
  DEFAULT_SESSION_DURATION_MIN,
  resolveSessionTimes,
} from '@/lib/agendaTimeline'
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
      patient_addresses ( full_address, neighborhood, is_primary, latitude, longitude )
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
        latitude: number | null
        longitude: number | null
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
  latitude: number | null
  longitude: number | null
  status: string
  displayStatus: ReturnType<typeof resolveAgendaDisplayStatus>
  isAssessment: boolean
  scheduledAt: string | null
  start: Date
  end: Date
  hasEvolution: boolean
  checkInAt: string | null
  checkOutAt: string | null
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
  week: (isoWeekStart: string) => ['pp', 'agenda', 'week', isoWeekStart] as const,
  range: (isoStart: string, isoEnd: string) => ['pp', 'agenda', 'range', isoStart, isoEnd] as const,
  session: (sessionId: string) => ['pp', 'agenda', 'session', sessionId] as const,
}

function normalizeRecords(
  records: AgendaSessionRow['medical_records'],
): Array<{ id: string }> {
  if (!records) return []
  return Array.isArray(records) ? records : [records]
}

function resolvePrimaryAddress(
  addresses: Array<{
    full_address: string
    neighborhood: string | null
    is_primary: boolean
    latitude: number | null
    longitude: number | null
  }> | null | undefined,
): {
  full_address: string
  neighborhood: string | null
  latitude: number | null
  longitude: number | null
} | null {
  if (!addresses?.length) return null
  const primary = addresses.find((a) => a.is_primary) ?? addresses[0]
  return primary ?? null
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
    latitude: addressInfo?.latitude ?? null,
    longitude: addressInfo?.longitude ?? null,
    status: row.status,
    displayStatus: resolveAgendaDisplayStatus(row.status, hasEvolution),
    isAssessment: row.is_assessment_session,
    scheduledAt: row.scheduled_at,
    start: times.start,
    end: times.end,
    hasEvolution,
    checkInAt: row.check_in_at,
    checkOutAt: row.check_out_at,
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

export function formatAgendaDayTitle(date: Date): string {
  const label = format(date, "EEEE, d 'de' MMMM", { locale: ptBR })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** Título compacto para cabeçalho em telas estreitas. */
export function formatAgendaDayTitleShort(date: Date): string {
  const label = format(date, "EEE, d 'de' MMM", { locale: ptBR })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function formatAgendaDayShort(date: Date): string {
  if (isSameDay(date, new Date())) return 'Hoje'
  return format(date, 'dd/MM', { locale: ptBR })
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

async function listAgendaSessionsInRange(
  rangeStart: Date,
  rangeEnd: Date,
): Promise<AgendaSessionItem[]> {
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

export async function listAgendaSessionsForRange(
  rangeStart: Date,
  rangeEnd: Date,
): Promise<AgendaSessionItem[]> {
  return listAgendaSessionsInRange(startOfDay(rangeStart), endOfDay(rangeEnd))
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

export function describeSessionType(session: AgendaSessionItem): string {
  const kind = session.isAssessment ? 'Avaliação inicial' : 'Evolução clínica'
  return `${kind} · domiciliar · ${DEFAULT_SESSION_DURATION_MIN} min`
}
