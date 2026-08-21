import { supabase } from '@/lib/supabase'

export type ProposalOption = {
  weekly_frequency: number
  session_count: number
  total_amount_cents: number
  gross_amount_cents: number
  assessment_credit_cents: number
  is_recommended: boolean
}

export type PatientProposalPreview = {
  assessment_id: string
  patient_id: string
  patient_name: string
  professional_name: string | null
  proposed_weekly_frequency: number
  proposed_session_count: number
  proposed_patient_level: string
  proposal_sent_at: string | null
  response_deadline_at: string | null
  status: string
  options: ProposalOption[]
  early_cycle_discount_pct: number
  /** @deprecated use options */
  total_amount_cents?: number | null
}

export type AcceptProposalResult = {
  assessment_id: string
  family_response: 'SIM' | 'NAO'
  cycle_id?: string
  charge_id?: string
  session_count?: number
  amount_cents?: number
  assessment_credit_cents?: number
  early_discount_cents?: number
}

export async function getPatientProposalPreview(
  assessmentId: string,
): Promise<PatientProposalPreview> {
  const { data, error } = await supabase.rpc('get_patient_proposal_preview', {
    p_assessment_id: assessmentId,
  })

  if (error) throw error
  return data as PatientProposalPreview
}

export async function acceptAssessmentProposal(input: {
  assessmentId: string
  response: 'SIM' | 'NAO'
  chosenWeeklyFrequency?: number
  paymentTiming?: 'antecipado' | 'pos_ciclo'
}): Promise<AcceptProposalResult> {
  const { data, error } = await supabase.rpc('accept_assessment_proposal', {
    p_assessment_id: input.assessmentId,
    p_response: input.response,
    p_chosen_weekly_frequency: input.chosenWeeklyFrequency ?? null,
    p_payment_timing: input.paymentTiming ?? 'antecipado',
  })

  if (error) throw error
  return data as AcceptProposalResult
}

export const assessmentFamilyResponseQueryKeys = {
  preview: (assessmentId: string) => ['paciente', 'proposta', assessmentId] as const,
}
