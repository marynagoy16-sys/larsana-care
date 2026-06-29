import { supabase } from '@/lib/supabase'

export async function loadCredentialingSnapshot(): Promise<{
  professional: {
    id: string
    full_name: string
    cpf_cnpj: string | null
    person_type: string | null
    birth_date: string | null
    email: string | null
    phone: string | null
    address: string | null
    profession: string | null
    specialty: string | null
    credentialing_status: string | null
    flag_assinado: boolean | null
  }
  council: { council_type: string; registration_number: string } | null
  bank: {
    bank_code: string | null
    bank_name: string | null
    agency: string | null
    account_number: string | null
    account_type: string | null
    pix_key: string | null
    holder_name: string | null
    holder_document: string | null
  } | null
  documents: Array<{
    id: string
    document_type: string
    file_name: string
    storage_path: string
    source_url: string | null
  }>
  acceptedTermTypes: string[]
  contract: { id: string; contract_number: string | null; status: string; signed_at: string | null } | null
} | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: professional, error: proError } = await supabase
    .from('professionals')
    .select(
      'id, full_name, cpf_cnpj, person_type, birth_date, email, phone, address, profession, specialty, credentialing_status, flag_assinado',
    )
    .eq('user_id', user.id)
    .maybeSingle()

  if (proError) throw proError
  if (!professional) return null

  const [
    { data: councils },
    { data: bank },
    { data: documents },
    { data: acceptances },
    { data: contracts },
  ] = await Promise.all([
    supabase
      .from('professional_councils')
      .select('council_type, registration_number')
      .eq('professional_id', professional.id)
      .limit(1),
    supabase
      .from('professional_bank_accounts')
      .select('bank_code, bank_name, agency, account_number, account_type, pix_key, holder_name, holder_document')
      .eq('professional_id', professional.id)
      .maybeSingle(),
    supabase
      .from('professional_documents')
      .select('id, document_type, file_name, storage_path, source_url')
      .eq('professional_id', professional.id),
    supabase
      .from('digital_acceptances')
      .select('term_id, legal_terms(term_type)')
      .eq('professional_id', professional.id),
    supabase
      .from('contracts')
      .select('id, contract_number, status, signed_at')
      .eq('professional_id', professional.id)
      .order('created_at', { ascending: false })
      .limit(1),
  ])

  const acceptedTermTypes = (acceptances ?? [])
    .map((a: any) => a.legal_terms?.term_type)
    .filter(Boolean) as string[]

  return {
    professional: professional as any,
    council: councils?.[0] ?? null,
    bank: bank ?? null,
    documents: (documents ?? []) as any,
    acceptedTermTypes,
    contract: contracts?.[0] ?? null,
  }
}

export async function getProfessionalPublicProfile(): Promise<{
  full_name: string | null
  profession: string | null
  specialty: string | null
  credentialing_status: string | null
  pp_class: string | null
  council_registration: string | null
} | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: professional, error } = await supabase
    .from('professionals')
    .select('id, full_name, profession, specialty, credentialing_status, pp_class')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error
  if (!professional) return null

  const { data: council } = await supabase
    .from('professional_councils')
    .select('registration_number')
    .eq('professional_id', professional.id)
    .eq('council_type', 'CREFITO')
    .maybeSingle()

  return {
    full_name: professional.full_name,
    profession: professional.profession,
    specialty: professional.specialty,
    credentialing_status: professional.credentialing_status,
    pp_class: professional.pp_class,
    council_registration: council?.registration_number ?? null,
  }
}
