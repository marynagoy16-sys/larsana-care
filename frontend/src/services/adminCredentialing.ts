import { supabase } from '@/lib/supabase'
import { PROFESSIONAL_DOCS_BUCKET } from '@/services/credentialing'
import type { Tables } from '@/types/database'
import {
  PP_LEGAL_TERM_TYPES,
  type CredentialingSnapshot,
} from '@/lib/credentialingModel'
import { hasCompleteRequiredDocuments } from '@/lib/credentialingFilters'

export type CredentialingListItem = {
  id: string
  full_name: string
  cpf_cnpj: string | null
  profession: string
  pp_class: string
  email: string
  credentialing_status: string
  updated_at: string
  council_registration: string | null
  council_type: string | null
  flag_assinado: boolean
  has_complete_documents: boolean
  cardiorrespiratory_habilitation_status: string
  technical_categories: string[] | null
}

const LIST_SELECT = `
  id,
  full_name,
  cpf_cnpj,
  profession,
  pp_class,
  email,
  credentialing_status,
  updated_at,
  flag_assinado,
  cardiorrespiratory_habilitation_status,
  technical_categories,
  professional_councils ( council_type, registration_number ),
  professional_documents ( document_type )
`

function mapListRow(row: Record<string, unknown>): CredentialingListItem {
  const councils = row.professional_councils as Array<{
    council_type: string
    registration_number: string
  }> | null
  const council = councils?.[0] ?? null
  const documents = row.professional_documents as Array<{ document_type: string }> | null
  const documentTypes = (documents ?? []).map((d) => d.document_type)

  return {
    id: String(row.id),
    full_name: String(row.full_name),
    cpf_cnpj: row.cpf_cnpj != null ? String(row.cpf_cnpj) : null,
    profession: String(row.profession),
    pp_class: String(row.pp_class),
    email: String(row.email),
    credentialing_status: String(row.credentialing_status),
    updated_at: String(row.updated_at),
    council_type: council?.council_type ?? null,
    council_registration: council?.registration_number ?? null,
    flag_assinado: Boolean(row.flag_assinado),
    has_complete_documents: hasCompleteRequiredDocuments(documentTypes),
    cardiorrespiratory_habilitation_status: String(row.cardiorrespiratory_habilitation_status ?? 'nao_solicitado'),
    technical_categories: (row.technical_categories as string[] | null) ?? [],
  }
}

export async function listCredentialingProfessionals(): Promise<{
  data: CredentialingListItem[]
  count: number
}> {
  const { data, error } = await supabase
    .from('professionals')
    .select(LIST_SELECT)
    .neq('credentialing_status', 'descredenciado')
    .order('updated_at', { ascending: false })

  if (error) throw error

  const mapped = (data ?? []).map((row) => mapListRow(row as Record<string, unknown>))
  return { data: mapped, count: mapped.length }
}

export async function loadAdminCredentialingSnapshot(
  professionalId: string,
): Promise<CredentialingSnapshot | null> {
  const { data: professional, error: proError } = await supabase
    .from('professionals')
    .select(
      'id, full_name, cpf_cnpj, person_type, birth_date, email, phone, address, profession, specialty, technical_categories, cardiorrespiratory_habilitation_status, cardiorrespiratory_request_basis, cardiorrespiratory_experience_description, credentialing_status, flag_assinado, pp_class, created_at, updated_at, asaas_wallet_id',
    )
    .eq('id', professionalId)
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
      .eq('professional_id', professionalId)
      .limit(1),
    supabase
      .from('professional_bank_accounts')
      .select('bank_code, bank_name, agency, account_number, account_type, pix_key, holder_name, holder_document')
      .eq('professional_id', professionalId)
      .maybeSingle(),
    supabase
      .from('professional_documents')
      .select('id, document_type, file_name, storage_path, source_url')
      .eq('professional_id', professionalId),
    supabase
      .from('digital_acceptances')
      .select('term_id, legal_terms(term_type)')
      .eq('professional_id', professionalId),
    supabase
      .from('contracts')
      .select('id, contract_number, status, signed_at')
      .eq('professional_id', professionalId)
      .order('created_at', { ascending: false })
      .limit(1),
  ])

  const acceptedTermTypes = (acceptances ?? [])
    .map((a) => {
      const term = a.legal_terms as { term_type?: string } | null
      return term?.term_type
    })
    .filter(Boolean) as string[]

  return {
    professional,
    council: councils?.[0] ?? null,
    bank: bank ?? null,
    documents: documents ?? [],
    acceptedTermTypes,
    contract: contracts?.[0] ?? null,
  }
}

export async function getProfessionalDocumentViewUrl(
  doc: Pick<Tables<'professional_documents'>, 'storage_path' | 'source_url'>,
): Promise<string | null> {
  if (doc.source_url) return doc.source_url
  if (!doc.storage_path) return null

  const { data, error } = await supabase.storage
    .from(PROFESSIONAL_DOCS_BUCKET)
    .createSignedUrl(doc.storage_path, 3600)

  if (error) throw error
  return data.signedUrl
}

export async function approveCredentialing(professionalId: string) {
  const { error } = await supabase
    .from('professionals')
    .update({
      credentialing_status: 'ativo',
      is_active: true,
    })
    .eq('id', professionalId)

  if (error) throw error
}

export async function requestCredentialingRevision(professionalId: string) {
  const { error } = await supabase
    .from('professionals')
    .update({
      credentialing_status: 'documentos_pendentes',
      is_active: false,
    })
    .eq('id', professionalId)

  if (error) throw error
}

export type CardiorrespiratoryReviewStatus =
  | 'em_analise'
  | 'habilitado'
  | 'nao_habilitado'
  | 'suspenso'

export async function reviewCardiorrespiratoryHabilitation(
  professionalId: string,
  newStatus: CardiorrespiratoryReviewStatus,
  adminNotes?: string,
) {
  const { error } = await supabase.rpc('review_cardiorrespiratory_habilitation' as never, {
    p_professional_id: professionalId,
    p_new_status: newStatus,
    p_admin_notes: adminNotes ?? null,
  } as never)

  if (error) throw error
}

export const adminCredentialingQueryKeys = {
  list: ['admin', 'credentialing'] as const,
  detail: (id: string) => ['admin', 'credentialing', id] as const,
}

export { PP_LEGAL_TERM_TYPES }
