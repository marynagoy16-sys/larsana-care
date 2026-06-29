import { supabase } from '@/lib/supabase'

export async function createNpsSurvey(input: {
  cycle_id: string
  score: number
  comment?: string | null
}): Promise<void> {
  const { error } = await supabase.from('nps_surveys').insert({
    cycle_id: input.cycle_id,
    score: input.score,
    comment: input.comment?.trim() || null,
    rater_type: 'paciente',
    rated_entity_type: 'platform',
  })
  if (error) throw error
}
