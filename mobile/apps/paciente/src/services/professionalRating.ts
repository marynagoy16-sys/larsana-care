import { supabase } from '@/lib/supabase'

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

  return { name: professional.full_name, rating: null }
}
