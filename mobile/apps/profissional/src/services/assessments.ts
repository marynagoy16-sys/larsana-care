import { supabase } from '@/lib/supabase'

export type AssessmentDetail = {
  id: string
  patient_id: string
  status: string
  clinical_content: string | null
  crefito_number: string
  created_at: string
  proposal_sent_at: string | null
  response_deadline_at: string | null
  family_response: string | null
  responded_at: string | null
  suggested_weekly_frequency: number | null
  proposed_weekly_frequency: number
  proposed_session_count: number
  suggested_patient_level: string
  proposed_patient_level: string
  patient_level_change_reason: string | null
  primary_diagnosis: string
  comorbidities: string | null
  mobility: string
  patients?: {
    full_name: string
    regions?: { code: string; name: string } | null
    cities?: { name: string } | null
    patient_responsibles?: Array<{ full_name: string; is_primary: boolean }> | null
  } | null
  evaluator?: {
    full_name: string
    pp_class: string | null
  } | null
}

export async function getAssessmentDetail(id: string): Promise<AssessmentDetail | null> {
  const { data, error } = await (supabase as any)
    .from('initial_assessments')
    .select(`
      id, patient_id, status, clinical_content, crefito_number, created_at,
      proposal_sent_at, response_deadline_at, family_response, responded_at,
      suggested_weekly_frequency, proposed_weekly_frequency, proposed_session_count,
      suggested_patient_level, proposed_patient_level, patient_level_change_reason,
      primary_diagnosis, comorbidities, mobility,
      patients (
        full_name,
        regions ( code, name ),
        cities ( name ),
        patient_responsibles ( full_name, is_primary )
      ),
      evaluator:professionals!initial_assessments_evaluator_professional_id_fkey (
        full_name,
        pp_class
      )
    `)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data as unknown as AssessmentDetail | null
}

export async function estimateAssessmentProposalTotalCents(input: {
  patientId: string
  patientLevel: string
  sessionCount: number
}): Promise<number | null> {
  const { data, error } = await (supabase as any).rpc('estimate_assessment_proposal_total_cents', {
    p_patient_id: input.patientId,
    p_patient_level: input.patientLevel,
    p_session_count: input.sessionCount,
  })
  if (error) {
    console.warn('estimate_assessment_proposal_total_cents', error.message)
    return null
  }
  return typeof data === 'number' ? data : null
}
