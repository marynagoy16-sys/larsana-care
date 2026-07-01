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

export type PatientHomeContext = {
  linkedPatient: LinkedPatient | null
  latestAssessment: PatientAssessmentSummary | null
  pendingProposal: PatientAssessmentSummary | null
  activeCycle: ActiveCycleSummary | null
  pendingCharge: PendingChargeSummary | null
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
        professionals:allocated_professional_id ( full_name )
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

export async function getPatientHomeContext(patientId: string): Promise<Omit<PatientHomeContext, 'linkedPatient'>> {
  const [assessmentResult, cycleResult, chargeResult] = await Promise.all([
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
        professionals:assigned_professional_id ( full_name )`,
      )
      .eq('patient_id', patientId)
      .in('status', ['ativo', 'aguardando_pagamento', 'rascunho'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('charges_patient')
      .select('id, amount_cents, due_date, payment_status, cycle_id')
      .in('payment_status', ['pendente', 'vencido'])
      .order('due_date', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])

  if (assessmentResult.error) throw assessmentResult.error
  if (cycleResult.error) throw cycleResult.error
  if (chargeResult.error) throw chargeResult.error

  const latestAssessment = assessmentResult.data as PatientAssessmentSummary | null

  const pendingProposal =
    latestAssessment
    && ['proposta_enviada', 'em_analise'].includes(latestAssessment.status)
    && !latestAssessment.family_response
      ? latestAssessment
      : null

  let activeCycle: ActiveCycleSummary | null = null
  const cycleRow = cycleResult.data as {
    id: string
    cycle_number: number
    session_count: number
    status: string
    payment_status: string
    professionals: { full_name: string } | null
  } | null

  if (cycleRow?.status === 'ativo' && cycleRow.payment_status === 'pago') {
    const [sessionsResult, nextSessionResult] = await Promise.all([
      supabase
        .from('care_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('cycle_id', cycleRow.id)
        .eq('status', 'realizada'),
      supabase
        .from('care_sessions')
        .select('scheduled_at')
        .eq('cycle_id', cycleRow.id)
        .eq('status', 'prevista')
        .order('scheduled_at', { ascending: true })
        .limit(1)
        .maybeSingle(),
    ])

    if (sessionsResult.error) throw sessionsResult.error
    if (nextSessionResult.error) throw nextSessionResult.error

    activeCycle = {
      id: cycleRow.id,
      cycle_number: cycleRow.cycle_number,
      session_count: cycleRow.session_count,
      status: cycleRow.status,
      payment_status: cycleRow.payment_status,
      completedSessions: sessionsResult.count ?? 0,
      professionalName: cycleRow.professionals?.full_name ?? null,
      nextSessionAt: (nextSessionResult.data as { scheduled_at: string } | null)?.scheduled_at ?? null,
    }
  }

  const chargeRow = chargeResult.data as PendingChargeSummary | null
  const pendingCharge = chargeRow?.id ? chargeRow : null

  return {
    latestAssessment,
    pendingProposal,
    activeCycle,
    pendingCharge,
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
    }
  }

  const context = await getPatientHomeContext(linkedPatient.patientId)
  return { linkedPatient, ...context }
}

export const patientPortalQueryKeys = {
  home: ['paciente', 'home'] as const,
  proposta: (assessmentId: string) => ['paciente', 'proposta', assessmentId] as const,
}
