import { supabase } from '@/lib/supabase'

export async function createMedicalRecord(params: {
  patient_id: string
  professional_id: string
  content_richtext: string
  crefito_number: string
  record_type: 'evolucao' | 'avaliacao' | 'anotacao'
  session_id?: string | null
  cycle_id?: string | null
}) {
  const { data, error } = await (supabase as any).from('medical_records').insert({
    patient_id: params.patient_id,
    professional_id: params.professional_id,
    content_richtext: params.content_richtext,
    crefito_number: params.crefito_number,
    record_type: params.record_type,
    session_id: params.session_id ?? null,
    cycle_id: params.cycle_id ?? null,
    recorded_at: new Date().toISOString(),
  }).select('id').single()

  if (error) throw error
  return data
}

export async function getPPProfessionalCrefito(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: professional } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.id) return null

  const { data, error } = await supabase
    .from('professional_councils')
    .select('registration_number')
    .eq('professional_id', professional.id)
    .eq('council_type', 'CREFITO')
    .maybeSingle()

  if (error) throw error
  return data?.registration_number ?? null
}
