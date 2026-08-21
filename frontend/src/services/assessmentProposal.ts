import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type PatientLevel = Database['public']['Enums']['patient_level']

export async function finalizeAssessmentForPp(assessmentId: string): Promise<{
  assessment_id: string
  status: string
  requires_admin_review?: boolean
  proposal_sent_at?: string
  response_deadline_at?: string
}> {
  const { data, error } = await supabase.rpc('pp_finalize_assessment' as never, {
    p_assessment_id: assessmentId,
  } as never)
  if (error) throw error
  return data as {
    assessment_id: string
    status: string
    requires_admin_review?: boolean
    proposal_sent_at?: string
    response_deadline_at?: string
  }
}

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

export async function estimateAssessmentRepasseTotalCents(input: {
  patientId: string
  patientLevel: string
  sessionCount: number
  ppClass?: string | null
}): Promise<number | null> {
  const chargeTotal = await estimateAssessmentProposalTotalCents({
    patientId: input.patientId,
    patientLevel: input.patientLevel,
    sessionCount: input.sessionCount,
  })
  if (chargeTotal == null || input.sessionCount <= 0) return null

  const perSession = Math.round(chargeTotal / input.sessionCount)
  const { resolveCyclePercents } = await import('@/lib/demandSimulation')
  const { getActivePricingVersion, getPricingBundle } = await import('@/services/pricing')
  const version = await getActivePricingVersion()
  if (!version) return null
  const bundle = await getPricingBundle(version.id)
  const { cycle2Percent } = resolveCyclePercents({
    commissions: bundle.commissions,
    retention: bundle.retention,
    ppClass: input.ppClass,
  })
  return Math.round((perSession * input.sessionCount * cycle2Percent) / 100)
}
