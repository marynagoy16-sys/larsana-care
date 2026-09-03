import { supabase } from '@/lib/supabase'
import { sanitizeStorageFileName } from '@/lib/sanitize'
import { mapSupabaseError } from '@/lib/supabase-errors'
import {
  PP_CATEGORIAS_TERM,
  PP_REGRAS_TYPES,
  PP_SIGILO_TERM,
  PP_TERMOS_TYPES,
  type CredentialingSnapshot,
  type CredentialingStepId,
} from '@/lib/credentialingModel'
import { PP_CREDENTIALING_TERM_TYPES } from '@/constants/legalTerms'
import type {
  BancoStepValues,
  CategoriasStepValues,
  ConselhoStepValues,
  DadosStepValues,
} from '@/schemas/credentialing'
import { normalizeTechnicalCategoriesForSave } from '@/lib/ppTechnicalCategories'
import { recordLegalAcceptances } from '@/services/legalDocuments'
import type { LegalTermType } from '@/constants/legalTerms'
import type { Tables, TablesInsert } from '@/types/database'

export const PROFESSIONAL_DOCS_BUCKET = 'professional-documents'
const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

export const credentialingQueryKeys = {
  snapshot: ['pp', 'credentialing'] as const,
}

async function requireProfessionalId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sessão expirada')

  const { data, error } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Profissional não encontrado')
  return data.id
}

export async function loadCredentialingSnapshot(): Promise<CredentialingSnapshot | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: professional, error: proError } = await supabase
    .from('professionals')
    .select(
      'id, full_name, cpf_cnpj, person_type, birth_date, email, phone, address, profession, specialty, technical_categories, patient_preferences, cardiorrespiratory_habilitation_status, cardiorrespiratory_request_basis, cardiorrespiratory_experience_description, credentialing_status, flag_assinado',
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

export async function saveDadosStep(values: DadosStepValues) {
  const professionalId = await requireProfessionalId()
  const { error } = await supabase
    .from('professionals')
    .update({
      full_name: values.full_name,
      person_type: values.person_type,
      cpf_cnpj: values.cpf_cnpj,
      birth_date: values.birth_date,
      email: values.email,
      phone: values.phone,
      address: values.address,
      profession: values.profession,
    })
    .eq('id', professionalId)

  if (error) throw error

  if (values.referral_code?.trim()) {
    const { error: referralError } = await supabase.rpc('register_pp_referral_on_signup', {
      p_referred_professional_id: professionalId,
      p_referral_code: values.referral_code.trim(),
    })
    if (referralError) throw referralError
  }
}

export async function saveCategoriasStep(values: CategoriasStepValues) {
  const professionalId = await requireProfessionalId()
  const categories = normalizeTechnicalCategoriesForSave(
    values.technical_categories,
    values.requests_cardio_habilitation,
  )

  const { error } = await supabase
    .from('professionals')
    .update({
      technical_categories: categories,
      patient_preferences: values.patient_preferences ?? [],
      cardiorrespiratory_request_basis: values.requests_cardio_habilitation
        ? values.cardiorrespiratory_request_basis ?? null
        : null,
      cardiorrespiratory_experience_description: values.requests_cardio_habilitation
        ? values.cardiorrespiratory_experience_description?.trim() ?? null
        : null,
    })
    .eq('id', professionalId)

  if (error) throw error
}

export async function saveConselhoStep(values: ConselhoStepValues) {
  const professionalId = await requireProfessionalId()
  const { error } = await supabase
    .from('professional_councils')
    .upsert(
      {
        professional_id: professionalId,
        council_type: values.council_type,
        registration_number: values.registration_number,
      },
      { onConflict: 'professional_id,council_type' },
    )

  if (error) throw error
}

export async function saveBancoStep(values: BancoStepValues) {
  const professionalId = await requireProfessionalId()
  const { error } = await supabase
    .from('professional_bank_accounts')
    .upsert(
      {
        professional_id: professionalId,
        bank_code: values.bank_code ?? null,
        bank_name: values.bank_name,
        agency: values.agency,
        account_number: values.account_number,
        account_type: values.account_type,
        pix_key: values.pix_key,
        holder_name: values.holder_name,
        holder_document: values.holder_document,
      },
      { onConflict: 'professional_id' },
    )

  if (error) throw error
}

export async function uploadProfessionalDocument(
  file: File,
  documentType: Tables<'professional_documents'>['document_type'],
) {
  if (!ALLOWED_MIME.includes(file.type)) {
    throw new Error('Tipo de arquivo não permitido. Use PDF, JPEG, PNG ou WebP.')
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Arquivo excede o limite de 10 MB.')
  }

  const professionalId = await requireProfessionalId()
  const safeFileName = sanitizeStorageFileName(file.name)
  const storagePath = `${professionalId}/${documentType}-${Date.now()}-${safeFileName}`

  const { error: uploadError } = await supabase.storage
    .from(PROFESSIONAL_DOCS_BUCKET)
    .upload(storagePath, file, { upsert: true, contentType: file.type })

  if (uploadError) throw uploadError

  const { data: existing } = await supabase
    .from('professional_documents')
    .select('id, storage_path')
    .eq('professional_id', professionalId)
    .eq('document_type', documentType)
    .maybeSingle()

  if (existing?.storage_path) {
    await supabase.storage.from(PROFESSIONAL_DOCS_BUCKET).remove([existing.storage_path])
  }

  if (existing) {
    const { error } = await supabase
      .from('professional_documents')
      .update({ storage_path: storagePath, file_name: file.name, uploaded_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) throw error
    return
  }

  const { error } = await supabase.from('professional_documents').insert({
    professional_id: professionalId,
    document_type: documentType,
    storage_path: storagePath,
    file_name: file.name,
  } satisfies TablesInsert<'professional_documents'>)

  if (error) throw error
}

export async function removeProfessionalDocument(documentId: string) {
  const professionalId = await requireProfessionalId()

  const { data: doc, error: fetchError } = await supabase
    .from('professional_documents')
    .select('storage_path')
    .eq('id', documentId)
    .eq('professional_id', professionalId)
    .maybeSingle()

  if (fetchError) throw fetchError
  if (!doc) return

  if (doc.storage_path) {
    await supabase.storage.from(PROFESSIONAL_DOCS_BUCKET).remove([doc.storage_path])
  }

  const { error } = await supabase.from('professional_documents').delete().eq('id', documentId)
  if (error) throw error
}

async function loadCurrentLegalTerms(termTypes: readonly string[]) {
  const { data, error } = await supabase
    .from('legal_terms')
    .select('id, term_type, title, version, content, acceptance_mode')
    .in('term_type', [...termTypes] as never)
    .eq('is_current', true)

  if (error) throw error
  return data ?? []
}

export async function loadPpLegalTermsForStep(step: CredentialingStepId) {
  if (step === 'termos') return loadCurrentLegalTerms(PP_TERMOS_TYPES)
  if (step === 'categorias') return loadCurrentLegalTerms([PP_CATEGORIAS_TERM])
  if (step === 'sigilo') return loadCurrentLegalTerms([PP_SIGILO_TERM])
  if (step === 'regras') return loadCurrentLegalTerms(PP_REGRAS_TYPES)
  return loadCurrentLegalTerms(PP_CREDENTIALING_TERM_TYPES)
}

/** @deprecated use loadPpLegalTermsForStep */
export async function loadPpLegalTermsForContrato() {
  return loadPpLegalTermsForStep('contrato')
}

export async function recordCredentialingLegalAcceptances(termTypes: readonly LegalTermType[]) {
  await recordLegalAcceptances(termTypes, 'credentialing')
}

export async function acceptContratoAndSubmit() {
  const { data, error } = await supabase.rpc('submit_pp_credentialing' as never)
  if (error) throw new Error(mapSupabaseError(error))

  const result = data as { contract_number?: string } | null
  return { contractNumber: result?.contract_number ?? null }
}

export type SaveStepFn = {
  dados: typeof saveDadosStep
  categorias: typeof saveCategoriasStep
  conselho: typeof saveConselhoStep
  banco: typeof saveBancoStep
}

export const CREDENTIALING_STEP_SAVE: SaveStepFn = {
  dados: saveDadosStep,
  categorias: saveCategoriasStep,
  conselho: saveConselhoStep,
  banco: saveBancoStep,
}

export function stepHasPersistedSave(step: CredentialingStepId): step is keyof SaveStepFn {
  return step === 'dados' || step === 'categorias' || step === 'conselho' || step === 'banco'
}

export function stepRequiresLegalAcceptance(step: CredentialingStepId): boolean {
  return step === 'termos' || step === 'categorias' || step === 'sigilo' || step === 'regras'
}
