import { supabase } from '@/lib/supabase'

export async function getProfessionalNpsAverage(professionalId: string): Promise<number | null> {
  const { data, error } = await supabase.rpc('pp_nps_score' as never, {
    p_professional_id: professionalId,
  } as never)
  if (error) {
    const { data: fallback, error: fallbackError } = await supabase
      .from('nps_surveys')
      .select('score')
      .eq('rated_entity_type', 'professional')
      .eq('rated_entity_id', professionalId)
      .order('submitted_at', { ascending: false })
      .limit(100)
    if (fallbackError) throw fallbackError
    if (!fallback?.length) return null
    const sum = fallback.reduce((acc, row) => acc + Number(row.score), 0)
    return Math.round((sum / fallback.length) * 10) / 10
  }
  if (data == null) return null
  return Number(data)
}

export async function getAssignedProfessionalSummary(
  professionalId: string,
): Promise<{ name: string; rating: number | null } | null> {
  const { data: professional, error } = await supabase
    .from('professionals')
    .select('full_name')
    .eq('id', professionalId)
    .maybeSingle()

  if (error) throw error
  if (!professional) return null

  const rating = await getProfessionalNpsAverage(professionalId)
  return { name: professional.full_name, rating }
}
