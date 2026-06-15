import { supabase } from '@/lib/supabase'

export type CurrentProfessional = {
  id: string
  full_name: string
  pp_class: string | null
  profession: string | null
  credentialing_status: string
}

export async function getCurrentProfessional(): Promise<CurrentProfessional | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('professionals')
    .select('id, full_name, pp_class, profession, credentialing_status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error
  return data
}
