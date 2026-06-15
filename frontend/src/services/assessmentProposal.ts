import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type PatientLevel = Database['public']['Enums']['patient_level']

export async function sendAssessmentProposal(assessmentId: string): Promise<{
  assessment_id: string
  status: string
  proposal_sent_at: string
  response_deadline_at: string
}> {
  const { data, error } = await supabase.rpc('send_assessment_proposal', {
    p_assessment_id: assessmentId,
  })

  if (error) throw error
  return data as {
    assessment_id: string
    status: string
    proposal_sent_at: string
    response_deadline_at: string
  }
}

export async function estimateAssessmentProposalTotalCents(input: {
  patientId: string
  patientLevel: string
  sessionCount: number
}): Promise<number | null> {
  const { data, error } = await supabase.rpc('estimate_assessment_proposal_total_cents', {
    p_patient_id: input.patientId,
    p_patient_level: input.patientLevel as PatientLevel,
    p_session_count: input.sessionCount,
  })

  if (error) {
    console.warn('estimate_assessment_proposal_total_cents', error.message)
    return null
  }

  return typeof data === 'number' ? data : null
}
