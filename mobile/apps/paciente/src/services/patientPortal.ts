import { supabase } from '@/lib/supabase'

export type LinkedPatient = {
  patientId: string
  patientName: string
  careStatus: string
  responsibleName: string
  professionalName: string | null
}

export type PatientAssessmentSummary = {
  id: string
  status: string
  proposed_session_count: number
  proposed_patient_level: string
  proposed_weekly_frequency: number
  proposal_sent_at: string | null
  response_deadline_at: string | null
  family_response: string | null
  created_at: string
}

export type ActiveCycleSummary = {
  id: string
  cycle_number: number
  session_count: number
  status: string
  payment_status: string
  completedSessions: number
  professionalName: string | null
  nextSessionAt: string | null
}

export type PendingChargeSummary = {
  id: string
  amount_cents: number
  due_date: string | null
  payment_status: string
  cycle_id: string | null
}

export type UpcomingAssessmentAppointment = {
  proposalId: string
  scheduledAt: string
  professionalName: string | null
}

export type PatientHomeContext = {
  linkedPatient: LinkedPatient | null
  latestAssessment: PatientAssessmentSummary | null
  pendingProposal: PatientAssessmentSummary | null
  activeCycle: ActiveCycleSummary | null
  pendingCharge: PendingChargeSummary | null
  upcomingAssessment: UpcomingAssessmentAppointment | null
}

type ResponsibleRow = {
  full_name: string
  patients: {
    id: string
    full_name: string
    care_status: string
    professionals: { full_name: string } | null
  } | null
}

export async function getLinkedPatient(): Promise<LinkedPatient | null> {
  const { data, error } = await supabase
    .from('patient_responsibles')
    .select(
      `full_name,
      patients (
        id,
        full_name,
        care_status,
        professionals:professionals!patients_allocated_professional_id_fkey ( full_name )
      )`,
    )
    .limit(1)
    .maybeSingle()

  if (error) throw error
  const row = data as ResponsibleRow | null
  const patient = row?.patients
  if (!patient) return null

  return {
    patientId: patient.id,
    patientName: patient.full_name,
    careStatus: patient.care_status,
    responsibleName: row.full_name,
    professionalName: patient.professionals?.full_name ?? null,
  }
}

async function getUpcomingAssessmentAppointment(
  patientId: string,
  latestAssessment: PatientAssessmentSummary | null,
): Promise<UpcomingAssessmentAppointment | null> {
  if (latestAssessment) return null

  const { data: proposal, error: proposalError } = await supabase
    .from('scheduling_proposals')
    .select('id, confirmed_slot_id, professional_id')
    .eq('patient_id', patientId)
    .eq('proposal_type', 'avaliacao')
    .eq('status', 'confirmado')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (proposalError) throw proposalError
  if (!proposal?.confirmed_slot_id) return null

  const { data: slot, error: slotError } = await supabase
    .from('scheduling_proposal_slots')
    .select('starts_at')
    .eq('id', proposal.confirmed_slot_id)
    .maybeSingle()

  if (slotError) throw slotError
  if (!slot?.starts_at) return null

  let professionalName: string | null = null
  if (proposal.professional_id) {
    const { data: cycle, error: cycleError } = await supabase
      .from('care_cycles')
      .select('professionals:professionals!care_cycles_assigned_professional_id_fkey ( full_name )')
      .eq('patient_id', patientId)
      .eq('assigned_professional_id', proposal.professional_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!cycleError) {
      professionalName =
        (cycle as { professionals: { full_name: string } | null } | null)?.professionals?.full_name ??
        null
    }
  }

  return {
    proposalId: proposal.id,
    scheduledAt: slot.starts_at,
    professionalName,
  }
}

export async function getPatientHomeContext(patientId: string): Promise<Omit<PatientHomeContext, 'linkedPatient'>> {
  const [assessmentResult, activeCycleResult, chargeResult] = await Promise.all([
    supabase
      .from('initial_assessments')
      .select(
        `id, status, proposed_session_count, proposed_patient_level, proposed_weekly_frequency,
        proposal_sent_at, response_deadline_at, family_response, created_at`,
      )
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('care_cycles')
      .select(
        `id, cycle_number, session_count, status, payment_status, assigned_professional_id,
        professionals:professionals!care_cycles_assigned_professional_id_fkey ( full_name )`,
      )
      .eq('patient_id', patientId)
      .eq('status', 'ativo')
      .eq('payment_status', 'pago')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('charges_patient')
      .select('id, amount_cents, due_date, payment_status, cycle_id')
      .eq('patient_id', patientId)
      .in('payment_status', ['pendente', 'vencido'])
      .order('due_date', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])

  if (assessmentResult.error) throw assessmentResult.error
  if (activeCycleResult.error) throw activeCycleResult.error
  if (chargeResult.error) throw chargeResult.error

  const latestAssessment = assessmentResult.data as PatientAssessmentSummary | null

  const pendingProposal =
    latestAssessment
    && ['proposta_enviada', 'em_analise'].includes(latestAssessment.status)
    && !latestAssessment.family_response
      ? latestAssessment
      : null

  let activeCycle: ActiveCycleSummary | null = null
  const cycleRow = activeCycleResult.data as {
    id: string
    cycle_number: number
    session_count: number
    status: string
    payment_status: string
    professionals: { full_name: string } | null
  } | null

  if (cycleRow) {
    const [sessionsResult, nextSessionResult] = await Promise.all([
      supabase
        .from('care_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('cycle_id', cycleRow.id)
        .eq('status', 'realizada'),
      supabase
        .from('care_sessions')
        .select(
          `scheduled_at,
          professionals:professionals!care_sessions_professional_id_fkey ( full_name )`,
        )
        .eq('cycle_id', cycleRow.id)
        .in('status', ['prevista', 'remarcada'])
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(1)
        .maybeSingle(),
    ])

    if (sessionsResult.error) throw sessionsResult.error
    if (nextSessionResult.error) throw nextSessionResult.error

    const nextSession = nextSessionResult.data as {
      scheduled_at: string
      professionals: { full_name: string } | null
    } | null

    activeCycle = {
      id: cycleRow.id,
      cycle_number: cycleRow.cycle_number,
      session_count: cycleRow.session_count,
      status: cycleRow.status,
      payment_status: cycleRow.payment_status,
      completedSessions: sessionsResult.count ?? 0,
      professionalName:
        cycleRow.professionals?.full_name ?? nextSession?.professionals?.full_name ?? null,
      nextSessionAt: nextSession?.scheduled_at ?? null,
    }
  }

  const chargeRow = chargeResult.data as PendingChargeSummary | null
  const pendingCharge = chargeRow?.id ? chargeRow : null

  let upcomingAssessment: UpcomingAssessmentAppointment | null = null
  try {
    upcomingAssessment = await getUpcomingAssessmentAppointment(patientId, latestAssessment)
  } catch {
    upcomingAssessment = null
  }

  return {
    latestAssessment,
    pendingProposal,
    activeCycle,
    pendingCharge,
    upcomingAssessment,
  }
}

export async function loadPatientHome(): Promise<PatientHomeContext> {
  const linkedPatient = await getLinkedPatient()
  if (!linkedPatient) {
    return {
      linkedPatient: null,
      latestAssessment: null,
      pendingProposal: null,
      activeCycle: null,
      pendingCharge: null,
      upcomingAssessment: null,
    }
  }

  const context = await getPatientHomeContext(linkedPatient.patientId)
  return { linkedPatient, ...context }
}

export const patientPortalQueryKeys = {
  home: ['paciente', 'home'] as const,
  proposta: (assessmentId: string) => ['paciente', 'proposta', assessmentId] as const,
}
