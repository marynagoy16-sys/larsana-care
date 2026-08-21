import { supabase } from '@/lib/supabase'

export type AssessmentLevelReviewDecision = 'aprovado' | 'rejeitado'

export async function reviewAssessmentLevelChange(
  assessmentId: string,
  decision: AssessmentLevelReviewDecision,
  adminNotes?: string,
): Promise<void> {
  const { error } = await supabase.rpc('review_assessment_level_change', {
    p_assessment_id: assessmentId,
    p_decision: decision,
    p_admin_notes: adminNotes,
  })
  if (error) throw error
}
