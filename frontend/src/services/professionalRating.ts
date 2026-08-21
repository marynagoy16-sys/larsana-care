import { supabase } from '@/lib/supabase'

export async function getProfessionalNpsAverage(professionalId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('nps_surveys')
    .select('score')
    .eq('rated_entity_type', 'professional')
    .eq('rated_entity_id', professionalId)

  if (error) throw error
  if (!data?.length) return null

  const sum = data.reduce((acc, row) => acc + Number(row.score), 0)
  return Math.round((sum / data.length) * 10) / 10
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
