import { supabase } from '@/lib/supabase'
import type { PatientServiceRequestValues } from '@/schemas/patientServiceRequest'
import { edgeFunctions } from '@/services/edgeFunctions'

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
  attendancePeriod: '' | 'MANHA' | 'TARDE' | 'NOITE' | 'INDIFERENTE'
  diagnosticHypothesis: string
  referralSource: '' | PatientServiceRequestValues['referralSource']
}

export type PatientServiceLegalTerm = {
  id: string
  term_type: string
  title: string
}

export type JoinWaitlistResult = {
  success: boolean
  reason?: string
  message?: string
  waitlist_id?: string
  already_exists?: boolean
}

export type PrepareServiceRequestResult = {
  success: boolean
  reason?: 'no_coverage'
  message?: string
  patient_id?: string
  can_checkout?: boolean
  assessment_fee_cents?: number
  assessment_fee_message?: string
  already_paid_assessment?: boolean
}

export type CreateAssessmentChargeResult = {
  charge_id?: string
  amount_cents?: number
  already_exists?: boolean
  already_paid?: boolean
  message?: string
}

export type SyncAssessmentChargeResult = {
  synced: boolean
  asaasEnabled: boolean
  chargeId: string
  pixQrCode: string | null
  pixCopyPaste: string | null
  error?: string
}

export type CompleteAssessmentCheckoutResult = {
  chargeId: string
  alreadyPaid: boolean
  asaasSyncFailed: boolean
  syncError?: string
}

const ASAAS_SYNC_MAX_RETRIES = 3
const ASAAS_SYNC_RETRY_MS = 800

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getPendingAssessmentRequestCharge(
  patientId: string,
): Promise<{ id: string; amount_cents: number; due_date: string | null; created_at: string } | null> {
  const { data, error } = await supabase
    .from('charges')
    .select('id, amount_cents, due_date, created_at')
    .eq('patient_id', patientId)
    .eq('charge_kind', 'assessment_request')
    .in('payment_status', ['pendente', 'vencido'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
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
    .in('term_type', ['TCLE_FISIO', 'LGPD'] as never)

  if (error) throw error
  return (data ?? []) as PatientServiceLegalTerm[]
}

export async function prepareServiceRequest(
  values: PatientServiceRequestValues,
): Promise<PrepareServiceRequestResult> {
  const { data, error } = await supabase.rpc('patient_prepare_service_request' as never, {
    p_patient_full_name: values.patientFullName,
    p_patient_cpf: values.patientCpf,
    p_birth_date: values.birthDate,
    p_attendance_period: values.attendancePeriod,
    p_diagnostic_hypothesis: values.diagnosticHypothesis,
    p_referral_source: values.referralSource,
    p_responsible_full_name: values.responsibleFullName || null,
    p_responsible_cpf: values.responsibleCpf || null,
    p_birth_place: values.birthPlace,
    p_marital_status: values.maritalStatus,
    p_gender: values.gender,
    p_terms_accepted: values.termsAccepted,
  } as never)

  if (error) throw error
  return data as PrepareServiceRequestResult
}

export async function createAssessmentRequestCharge(
  paymentMethod: 'PIX' | 'BOLETO' = 'PIX',
): Promise<CreateAssessmentChargeResult> {
  const { data, error } = await supabase.rpc('patient_create_assessment_request_charge' as never, {
    p_payment_method: paymentMethod,
  } as never)
  if (error) throw error
  return data as CreateAssessmentChargeResult
}

export async function syncAssessmentChargeWithAsaas(
  patientId: string,
  chargeId: string,
  amountCents: number,
  paymentMethod: 'PIX' | 'BOLETO' = 'PIX',
): Promise<SyncAssessmentChargeResult> {
  const today = new Date().toISOString().slice(0, 10)
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= ASAAS_SYNC_MAX_RETRIES; attempt += 1) {
    try {
      const result = await edgeFunctions.createCharge({
        patient_id: patientId,
        charge_id: chargeId,
        amount_cents: amountCents,
        due_date: today,
        payment_method: paymentMethod,
        description: 'Taxa de avaliação domiciliar Larsana Care',
      })
      return {
        synced: true,
        asaasEnabled: result.asaas_enabled,
        chargeId,
        pixQrCode: result.pix_qr_code,
        pixCopyPaste: result.pix_copy_paste,
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < ASAAS_SYNC_MAX_RETRIES) {
        await sleep(ASAAS_SYNC_RETRY_MS * attempt)
      }
    }
  }

  return {
    synced: false,
    asaasEnabled: true,
    chargeId,
    pixQrCode: null,
    pixCopyPaste: null,
    error: lastError?.message ?? 'Falha ao sincronizar cobrança',
  }
}

export async function completeAssessmentCheckout(
  patientId: string,
  assessmentFeeCents: number,
  paymentMethod: 'PIX' | 'BOLETO' = 'PIX',
): Promise<CompleteAssessmentCheckoutResult> {
  const charge = await createAssessmentRequestCharge(paymentMethod)
  if (charge.already_paid) {
    return { chargeId: charge.charge_id ?? '', alreadyPaid: true, asaasSyncFailed: false }
  }

  const chargeId = charge.charge_id
  if (!chargeId) throw new Error('Não foi possível gerar a cobrança')

  const sync = await syncAssessmentChargeWithAsaas(
    patientId,
    chargeId,
    charge.amount_cents ?? assessmentFeeCents,
    paymentMethod,
  )

  return {
    chargeId,
    alreadyPaid: false,
    asaasSyncFailed: !sync.synced,
    syncError: sync.error,
  }
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
  pendingAssessmentCharge: (patientId: string) =>
    ['paciente', 'pending-assessment-charge', patientId] as const,
  prefill: ['paciente', 'service-request-prefill'] as const,
  legalTerms: ['paciente', 'service-request-legal-terms'] as const,
}
