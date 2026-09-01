import { supabase } from '@/lib/supabase'
import { listPendingEvolutionsForPp } from '@/services/ppEvolutions'
import { getCurrentProfessional } from '@/services/professionals'
import { resolvePPPatientSituation } from '@/lib/ppPatientSituation'

export type PPPatientListItem = {
  id: string
  full_name: string
  care_status: string
  patient_level: string | null
  diagnostic_hypothesis: string | null
  attendance_period: string | null
  clinical_summary: string | null
  birth_date: string | null
  sex: string | null
  suggested_weekly_frequency: number | null
  evaluation_pending: boolean
  latest_assessment_status: string | null
  latest_cycle_status: string | null
  latest_cycle_payment_status: string | null
  pending_evolution_count: number
  situation: ReturnType<typeof resolvePPPatientSituation>
}

export type PPPatientDetail = PPPatientListItem & {
  patient_addresses: Array<{
    full_address: string
    street: string | null
    number: string | null
    neighborhood: string | null
    postal_code: string | null
    is_primary: boolean
  }> | null
  regions: { code: string; name: string } | null
  cities: { name: string } | null
  initial_assessments: Array<{ id: string; status: string; created_at: string }> | null
}

const PATIENT_LIST_SELECT = `
  id,
  full_name,
  care_status,
  patient_level,
  diagnostic_hypothesis,
  attendance_period,
  clinical_summary,
  birth_date,
  sex,
  suggested_weekly_frequency,
  allocated_professional_id,
  initial_assessments ( id, status, created_at ),
  care_cycles ( id, status, payment_status, cycle_number )
`

type AssessmentRow = { id: string; status: string; created_at: string }
type CycleRow = { id: string; status: string; payment_status: string; cycle_number: number }

function pickLatestAssessment(assessments: AssessmentRow[] | null | undefined): AssessmentRow | null {
  if (!assessments?.length) return null
  return [...assessments].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )[0]
}

function pickLatestCycle(cycles: CycleRow[] | null | undefined): CycleRow | null {
  if (!cycles?.length) return null
  return [...cycles].sort((a, b) => b.cycle_number - a.cycle_number)[0]
}

function resolveEvaluationPending(
  assessments: AssessmentRow[] | null | undefined,
  cycles: CycleRow[] | null | undefined,
): boolean {
  return (assessments?.length ?? 0) === 0 && (cycles?.length ?? 0) === 0
}

const PATIENT_DETAIL_SELECT = `
  id,
  full_name,
  care_status,
  patient_level,
  diagnostic_hypothesis,
  attendance_period,
  clinical_summary,
  birth_date,
  sex,
  suggested_weekly_frequency,
  allocated_professional_id,
  regions ( code, name ),
  cities ( name ),
  patient_addresses (
    full_address, street, number, neighborhood, postal_code, is_primary
  ),
  initial_assessments ( id, status, created_at ),
  care_cycles ( id, status, payment_status, cycle_number )
`

function buildPatientSituationFields(
  care_status: string,
  assessments: AssessmentRow[] | null | undefined,
  cycles: CycleRow[] | null | undefined,
  pendingEvolutionCount = 0,
) {
  const latestAssessment = pickLatestAssessment(assessments)
  const latestCycle = pickLatestCycle(cycles)
  const evaluation_pending = resolveEvaluationPending(assessments, cycles)
  const situationInput = {
    evaluation_pending,
    latest_assessment_status: latestAssessment?.status ?? null,
    latest_cycle_status: latestCycle?.status ?? null,
    latest_cycle_payment_status: latestCycle?.payment_status ?? null,
    pending_evolution_count: pendingEvolutionCount,
    care_status,
  }

  return {
    evaluation_pending,
    latest_assessment_status: situationInput.latest_assessment_status,
    latest_cycle_status: situationInput.latest_cycle_status,
    latest_cycle_payment_status: situationInput.latest_cycle_payment_status,
    situation: resolvePPPatientSituation(situationInput),
  }
}

export async function listPPPatients(): Promise<{ data: PPPatientListItem[]; count: number }> {
  const professional = await getCurrentProfessional()
  if (!professional) return { data: [], count: 0 }

  const { data, error } = await supabase
    .from('patients')
    .select(PATIENT_LIST_SELECT)
    .eq('allocated_professional_id', professional.id)
    .order('full_name')

  if (error) throw error

  const rows = data ?? []
  const { data: pendingEvolutions } = await listPendingEvolutionsForPp()
  const pendingEvolutionCountByPatient = new Map<string, number>()
  for (const row of pendingEvolutions) {
    const patientId = row.care_cycles?.patient_id
    if (!patientId) continue
    pendingEvolutionCountByPatient.set(
      patientId,
      (pendingEvolutionCountByPatient.get(patientId) ?? 0) + 1,
    )
  }

  const mapped = rows.map((row) => {
    const latestAssessment = pickLatestAssessment(row.initial_assessments as AssessmentRow[] | null)
    const latestCycle = pickLatestCycle(row.care_cycles as CycleRow[] | null)
    const evaluation_pending = resolveEvaluationPending(
      row.initial_assessments as AssessmentRow[] | null,
      row.care_cycles as CycleRow[] | null,
    )
    const pending_evolution_count = pendingEvolutionCountByPatient.get(row.id) ?? 0
    const situationInput = {
      evaluation_pending,
      latest_assessment_status: latestAssessment?.status ?? null,
      latest_cycle_status: latestCycle?.status ?? null,
      latest_cycle_payment_status: latestCycle?.payment_status ?? null,
      pending_evolution_count,
      care_status: row.care_status,
    }

    return {
      id: row.id,
      full_name: row.full_name,
      care_status: row.care_status,
      patient_level: row.patient_level,
      diagnostic_hypothesis: row.diagnostic_hypothesis,
      attendance_period: row.attendance_period,
      clinical_summary: row.clinical_summary,
      birth_date: row.birth_date,
      sex: row.sex,
      suggested_weekly_frequency: row.suggested_weekly_frequency,
      evaluation_pending,
      latest_assessment_status: situationInput.latest_assessment_status,
      latest_cycle_status: situationInput.latest_cycle_status,
      latest_cycle_payment_status: situationInput.latest_cycle_payment_status,
      pending_evolution_count,
      situation: resolvePPPatientSituation(situationInput),
    }
  })

  return { data: mapped, count: mapped.length }
}

export async function getPPPatientDetail(id: string): Promise<PPPatientDetail | null> {
  const professional = await getCurrentProfessional()
  if (!professional) return null

  const { data, error } = await supabase
    .from('patients')
    .select(PATIENT_DETAIL_SELECT)
    .eq('id', id)
    .eq('allocated_professional_id', professional.id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const assessments = data.initial_assessments as AssessmentRow[] | null
  const cycles = data.care_cycles as CycleRow[] | null

  return {
    ...(data as Omit<PPPatientDetail, 'evaluation_pending' | 'latest_assessment_status' | 'latest_cycle_status' | 'latest_cycle_payment_status' | 'situation' | 'pending_evolution_count'>),
    pending_evolution_count: 0,
    ...buildPatientSituationFields(data.care_status, assessments, cycles),
  }
}

export async function getPPProfessionalCrefito(): Promise<string | null> {
  const professional = await getCurrentProfessional()
  if (!professional) return null

  const { data, error } = await supabase
    .from('professional_councils')
    .select('registration_number')
    .eq('professional_id', professional.id)
    .eq('council_type', 'CREFITO')
    .maybeSingle()

  if (error) throw error
  return data?.registration_number ?? null
}

export type PPPatientProntuarioRecord = {
  id: string
  record_type: string
  content_richtext: string | null
  recorded_at: string
  created_at: string
  session_id: string | null
  session_number: number | null
  cycle_number: number | null
}

export type PPPatientProntuarioSession = {
  id: string
  session_number: number
  status: string
  scheduled_at: string | null
  evolution: PPPatientProntuarioRecord | null
}

export type PPPatientProntuarioCycle = {
  cycleId: string
  cycleNumber: number
  status: string | null
  sessionCount: number
  sessions: PPPatientProntuarioSession[]
}

export type PPPatientProntuario = {
  assessmentRecords: PPPatientProntuarioRecord[]
  cycles: PPPatientProntuarioCycle[]
}

function stripHtmlPreview(html: string | null, maxLength = 120): string {
  if (!html) return 'Sem conteúdo registrado.'
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}…`
}

export { stripHtmlPreview as prontuarioContentPreview }

const UNPLANNED_SESSION_STATUS = 'a_agendar'

type CareSessionRow = {
  id: string
  session_number: number
  scheduled_at: string | null
  status: string
}

type CareCycleRow = {
  id: string
  cycle_number: number
  status: string | null
  session_count: number
  care_sessions: CareSessionRow[] | null
}

function buildCycleSessions(
  cycle: CareCycleRow,
  evolutionBySessionId: Map<string, PPPatientProntuarioRecord>,
): PPPatientProntuarioSession[] {
  const sessionsByNumber = new Map(
    (cycle.care_sessions ?? []).map((session) => [session.session_number, session]),
  )

  return Array.from({ length: cycle.session_count }, (_, index) => {
    const sessionNumber = index + 1
    const session = sessionsByNumber.get(sessionNumber)

    if (!session) {
      return {
        id: `${cycle.id}-slot-${sessionNumber}`,
        session_number: sessionNumber,
        status: UNPLANNED_SESSION_STATUS,
        scheduled_at: null,
        evolution: null,
      }
    }

    return {
      id: session.id,
      session_number: session.session_number,
      status: session.status,
      scheduled_at: session.scheduled_at,
      evolution: evolutionBySessionId.get(session.id) ?? null,
    }
  })
}

export async function getPPPatientProntuario(patientId: string): Promise<PPPatientProntuario | null> {
  const professional = await getCurrentProfessional()
  if (!professional) return null

  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id')
    .eq('id', patientId)
    .eq('allocated_professional_id', professional.id)
    .maybeSingle()

  if (patientError) throw patientError
  if (!patient) return null

  const [cyclesRes, recordsRes] = await Promise.all([
    supabase
      .from('care_cycles')
      .select(`
        id,
        cycle_number,
        status,
        session_count,
        care_sessions (
          id,
          session_number,
          scheduled_at,
          status
        )
      `)
      .eq('patient_id', patientId)
      .order('cycle_number', { ascending: false })
      .order('session_number', { referencedTable: 'care_sessions', ascending: true }),
    supabase
      .from('medical_records')
      .select(`
        id,
        record_type,
        content_richtext,
        recorded_at,
        created_at,
        session_id,
        care_sessions ( session_number ),
        care_cycles ( cycle_number, id )
      `)
      .eq('patient_id', patientId)
      .order('recorded_at', { ascending: false }),
  ])

  if (cyclesRes.error) throw cyclesRes.error
  if (recordsRes.error) throw recordsRes.error

  type MedicalRecordRow = {
    id: string
    record_type: string
    content_richtext: string | null
    recorded_at: string
    created_at: string
    session_id: string | null
    care_sessions: { session_number: number } | null
    care_cycles: { cycle_number: number; id: string } | null
  }

  const records = (recordsRes.data ?? []).map((row) => {
    const typed = row as MedicalRecordRow
    return {
      id: typed.id,
      record_type: typed.record_type,
      content_richtext: typed.content_richtext,
      recorded_at: typed.recorded_at,
      created_at: typed.created_at,
      session_id: typed.session_id,
      session_number: typed.care_sessions?.session_number ?? null,
      cycle_number: typed.care_cycles?.cycle_number ?? null,
    }
  }) satisfies PPPatientProntuarioRecord[]

  const assessmentRecords = records.filter((r) => r.record_type === 'avaliacao')
  const evolutionBySessionId = new Map(
    records
      .filter((r) => r.record_type === 'evolucao' && r.session_id)
      .map((record) => [record.session_id!, record]),
  )

  const cycles = ((cyclesRes.data ?? []) as CareCycleRow[])
    .filter((cycle) => isStartedTreatmentCycle(cycle.status))
    .map((cycle) => ({
    cycleId: cycle.id,
    cycleNumber: cycle.cycle_number,
    status: cycle.status,
    sessionCount: cycle.session_count,
    sessions: buildCycleSessions(cycle, evolutionBySessionId),
  }))

  return { assessmentRecords, cycles }
}

export function isStartedTreatmentCycle(status: string): boolean {
  return status !== 'rascunho' && status !== 'aguardando_pagamento'
}

export type PatientLatestAssessment = {
  id: string
  status: string
}

export const ppPatientQueryKeys = {
  latestAssessment: (patientId: string) => ['pp', 'patient_latest_assessment', patientId] as const,
}

export async function getPatientLatestAssessment(
  patientId: string,
): Promise<PatientLatestAssessment | null> {
  const { data, error } = await supabase
    .from('initial_assessments')
    .select('id, status')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

export function describeRegisteredAssessment(status: string): string {
  if (status === 'em_analise') {
    return 'Avaliação enviada para revisão da Larsana'
  }
  if (status === 'proposta_enviada') {
    return 'Avaliação enviada — proposta com a família'
  }
  if (status === 'avaliacao_feita') {
    return 'Avaliação registrada'
  }
  return 'Avaliação já registrada'
}
