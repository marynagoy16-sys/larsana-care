import { supabase } from '@/lib/supabase'
import type { PatientServiceRequestValues } from '@/schemas/patientServiceRequest'

export type PatientServiceDemand = {
  id: string
  status: 'aberta' | 'alocada' | 'cancelada'
  demand_type: string
  request_source: string
  created_at: string
  assigned_professional_id: string | null
}

export type PatientServiceStatus = {
  linked: boolean
  patient_id?: string
  patient_name?: string
  region_id?: string | null
  region_code?: string | null
  region_name?: string | null
  service_available?: boolean
  primary_address_id?: string | null
  active_demand?: PatientServiceDemand | null
  waitlist?: { id: string; status: string; created_at: string } | null
}

export type PatientRequestPrefill = {
  patientFullName: string
  patientCpf: string
  birthDate: string
  responsibleFullName: string
  responsibleCpf: string
  attendancePeriod: '' | 'MANHA' | 'TARDE' | 'NOITE'
  diagnosticHypothesis: string
  referralSource: '' | PatientServiceRequestValues['referralSource']
}

export type PatientServiceLegalTerm = {
  id: string
  term_type: string
  title: string
}

export type RequestAttendanceResult = {
  success: boolean
  reason?: 'no_coverage' | 'already_available'
  message?: string
  demand_id?: string
  already_exists?: boolean
  status?: string
}

export type JoinWaitlistResult = {
  success: boolean
  reason?: string
  message?: string
  waitlist_id?: string
  already_exists?: boolean
}

export async function getPatientServiceStatus(): Promise<PatientServiceStatus> {
  const { data, error } = await supabase.rpc('patient_get_service_status' as never)
  if (error) throw error
  return (data ?? { linked: false }) as PatientServiceStatus
}

export async function getPatientRequestPrefill(): Promise<PatientRequestPrefill | null> {
  const status = await getPatientServiceStatus()
  if (!status.linked || !status.patient_id) return null

  const patientId = status.patient_id

  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select(
      'full_name, cpf, birth_date, attendance_period, diagnostic_hypothesis, referral_source',
    )
    .eq('id', patientId)
    .maybeSingle()

  if (patientError) throw patientError
  if (!patient) return null

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: responsible, error: responsibleError } = user?.id
    ? await supabase
        .from('patient_responsibles')
        .select('full_name, cpf')
        .eq('patient_id', patientId)
        .eq('user_id', user.id)
        .maybeSingle()
    : await supabase
        .from('patient_responsibles')
        .select('full_name, cpf')
        .eq('patient_id', patientId)
        .order('is_primary', { ascending: false })
        .limit(1)
        .maybeSingle()

  if (responsibleError) throw responsibleError

  return {
    patientFullName: patient.full_name ?? '',
    patientCpf: patient.cpf ?? '',
    birthDate: patient.birth_date ?? '',
    responsibleFullName: responsible?.full_name ?? '',
    responsibleCpf: responsible?.cpf ?? '',
    attendancePeriod: (patient.attendance_period as PatientRequestPrefill['attendancePeriod']) ?? '',
    diagnosticHypothesis: patient.diagnostic_hypothesis ?? '',
    referralSource: (patient.referral_source as PatientRequestPrefill['referralSource']) ?? '',
  }
}

export async function getPatientServiceLegalTerms(): Promise<PatientServiceLegalTerm[]> {
  const { data, error } = await supabase
    .from('legal_terms')
    .select('id, term_type, title')
    .eq('is_current', true)
    .in('term_type', ['CONTRATO_INTERMEDIACAO', 'TERMO_CONSENTIMENTO', 'LGPD'])

  if (error) throw error
  return (data ?? []) as PatientServiceLegalTerm[]
}

export async function submitServiceRequest(
  values: PatientServiceRequestValues,
): Promise<RequestAttendanceResult> {
  const { data, error } = await supabase.rpc('patient_submit_service_request' as never, {
    p_patient_full_name: values.patientFullName,
    p_patient_cpf: values.patientCpf,
    p_birth_date: values.birthDate,
    p_attendance_period: values.attendancePeriod,
    p_diagnostic_hypothesis: values.diagnosticHypothesis,
    p_referral_source: values.referralSource,
    p_responsible_full_name: values.responsibleFullName || null,
    p_responsible_cpf: values.responsibleCpf || null,
    p_terms_accepted: values.termsAccepted,
  } as never)

  if (error) throw error
  return data as RequestAttendanceResult
}

/** @deprecated Use submitServiceRequest */
export async function requestAttendance(notes?: string): Promise<RequestAttendanceResult> {
  const { data, error } = await supabase.rpc('patient_request_attendance' as never, {
    p_notes: notes ?? null,
  } as never)
  if (error) throw error
  return data as RequestAttendanceResult
}

export async function joinWaitlist(notes?: string): Promise<JoinWaitlistResult> {
  const { data, error } = await supabase.rpc('patient_join_waitlist' as never, {
    p_notes: notes ?? null,
  } as never)
  if (error) throw error
  return data as JoinWaitlistResult
}

export const patientServiceQueryKeys = {
  status: ['paciente', 'service-status'] as const,
  prefill: ['paciente', 'service-request-prefill'] as const,
  legalTerms: ['paciente', 'service-request-legal-terms'] as const,
}
