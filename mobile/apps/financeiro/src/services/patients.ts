import { supabase } from '@/lib/supabase'

export type PatientSearchResult = {
  id: string
  full_name: string
}

export async function searchPatients(query: string): Promise<PatientSearchResult[]> {
  const term = query.trim()
  if (term.length < 2) return []

  const { data, error } = await supabase
    .from('patients')
    .select('id, full_name')
    .ilike('full_name', `%${term}%`)
    .order('full_name')
    .limit(20)

  if (error) throw error
  return (data ?? []) as PatientSearchResult[]
}

export async function getPatientEmail(patientId: string): Promise<string | null> {
  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('id', patientId)
    .maybeSingle()

  if (!patient) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', patientId)
    .maybeSingle()

  return profile?.email ?? null
}
