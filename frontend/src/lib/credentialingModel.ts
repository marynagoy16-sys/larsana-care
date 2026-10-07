import type { Tables } from '@/types/database'
import {
  allTermsAccepted,
  hasAcceptedTermType,
  type LegalTermType,
  PP_CREDENTIALING_TERM_TYPES,
} from '@/constants/legalTerms'
import {
  CARDIORRESPIRATORY_CATEGORY,
  ppHasCardiorrespiratoryCategory,
  type CardiorrespiratoryRequestBasis,
  type PpTechnicalCategory,
} from '@/lib/ppTechnicalCategories'

/** Etapas do wizard self-service do PP conforme mapa documentos (Ago/2026). */
export const CREDENTIALING_STEPS = [
  { id: 'dados', label: 'Dados' },
  { id: 'conselho', label: 'Conselho' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'banco', label: 'Banco' },
  { id: 'termos', label: 'Termos de uso' },
  { id: 'categorias', label: 'Categorias técnicas' },
  { id: 'sigilo', label: 'Sigilo e dados' },
  { id: 'contrato', label: 'Contrato' },
  { id: 'regras', label: 'Regras comerciais' },
] as const

export type CredentialingStepId = (typeof CREDENTIALING_STEPS)[number]['id']

export const PP_TERMOS_TYPES = ['TERMO_USO_PP', 'DIRETRIZES_PP', 'LGPD_PP'] as const satisfies readonly LegalTermType[]
export const PP_CATEGORIAS_TERM = 'ANEXO_III_CATEGORIAS_PP' as const satisfies LegalTermType
export const PP_SIGILO_TERM = 'ANEXO_IV_SIGILO_PP' as const satisfies LegalTermType
export const PP_REGRAS_TYPES = ['ANEXO_I_COMERCIAL_PP', 'ANEXO_II_OPERACIONAL_PP'] as const satisfies readonly LegalTermType[]

/** @deprecated Use PP_TERMOS_TYPES */
export const PP_LEGAL_TERM_TYPES = PP_TERMOS_TYPES

export const REQUIRED_PP_DOCUMENTS = [
  'RG_CNH',
  'COUNCIL_CARD',
  'CRIMINAL_BACKGROUND',
] as const satisfies readonly Tables<'professional_documents'>['document_type'][]

export const OPTIONAL_PP_DOCUMENTS = [
  'CERTIFICATE',
] as const satisfies readonly Tables<'professional_documents'>['document_type'][]

export const CARDIO_HABILITATION_DOCUMENTS = [
  'CARDIO_CERTIFICATE',
  'CARDIO_EXPERIENCE_PROOF',
  'CARDIO_CV',
  'CARDIO_PROFESSIONAL_DECLARATION',
  'CARDIO_OTHER',
] as const satisfies readonly Tables<'professional_documents'>['document_type'][]

export function defaultCouncilForProfession(
  profession: Tables<'professionals'>['profession'],
): Tables<'professional_councils'>['council_type'] {
  return profession === 'CUID' ? 'COREN' : 'CREFITO'
}

export type CredentialingSnapshot = {
  professional: Pick<
    Tables<'professionals'>,
    | 'id'
    | 'full_name'
    | 'cpf_cnpj'
    | 'person_type'
    | 'birth_date'
    | 'email'
    | 'phone'
    | 'address'
    | 'profession'
    | 'specialty'
    | 'technical_categories'
    | 'cardiorrespiratory_habilitation_status'
    | 'cardiorrespiratory_request_basis'
    | 'cardiorrespiratory_experience_description'
    | 'credentialing_status'
    | 'flag_assinado'
    | 'patient_preferences'
    | 'asaas_wallet_id'
  >
  council: Pick<Tables<'professional_councils'>, 'council_type' | 'registration_number'> | null
  bank: Pick<
    Tables<'professional_bank_accounts'>,
    | 'bank_code'
    | 'bank_name'
    | 'agency'
    | 'account_number'
    | 'account_type'
    | 'pix_key'
    | 'holder_name'
    | 'holder_document'
  > | null
  documents: Pick<
    Tables<'professional_documents'>,
    'id' | 'document_type' | 'file_name' | 'storage_path' | 'source_url'
  >[]
  acceptedTermTypes: string[]
  contract: Pick<Tables<'contracts'>, 'id' | 'contract_number' | 'status' | 'signed_at'> | null
}

export type StepCompletion = Record<CredentialingStepId, boolean>

export function isDadosComplete(pro: CredentialingSnapshot['professional']): boolean {
  return Boolean(
    pro.full_name?.trim()
    && pro.cpf_cnpj?.trim()
    && pro.email?.trim()
    && pro.phone?.trim()
    && pro.profession
    && pro.birth_date,
  )
}

export function isTermosComplete(acceptedTermTypes: string[]): boolean {
  const hasUsage = hasAcceptedTermType(acceptedTermTypes, 'TERMO_USO_PP')
    || hasAcceptedTermType(acceptedTermTypes, 'DIRETRIZES_PP')
  return hasUsage && hasAcceptedTermType(acceptedTermTypes, 'LGPD_PP')
}

export function isCategoriasComplete(
  pro: Pick<
    CredentialingSnapshot['professional'],
    | 'technical_categories'
    | 'cardiorrespiratory_request_basis'
    | 'cardiorrespiratory_experience_description'
  >,
  acceptedTermTypes: string[],
): boolean {
  const categories = (pro.technical_categories ?? []) as PpTechnicalCategory[]
  if (categories.length < 1) return false
  if (!hasAcceptedTermType(acceptedTermTypes, PP_CATEGORIAS_TERM)) return false

  if (!ppHasCardiorrespiratoryCategory(categories)) return true

  return Boolean(
    pro.cardiorrespiratory_request_basis
    && pro.cardiorrespiratory_experience_description?.trim(),
  )
}

export function isSigiloComplete(acceptedTermTypes: string[]): boolean {
  return hasAcceptedTermType(acceptedTermTypes, PP_SIGILO_TERM)
}

export function isRegrasComplete(acceptedTermTypes: string[]): boolean {
  return allTermsAccepted(acceptedTermTypes, PP_REGRAS_TYPES)
}

export function isConselhoComplete(council: CredentialingSnapshot['council']): boolean {
  return Boolean(council?.council_type && council.registration_number?.trim())
}

export function isDocumentosComplete(documents: CredentialingSnapshot['documents']): boolean {
  const types = new Set(documents.map((d) => d.document_type))
  return REQUIRED_PP_DOCUMENTS.every((t) => types.has(t))
}

export function isBancoComplete(bank: CredentialingSnapshot['bank']): boolean {
  return Boolean(
    bank?.bank_name?.trim()
    && bank.agency?.trim()
    && bank.account_number?.trim()
    && bank.pix_key?.trim()
    && bank.holder_name?.trim()
    && bank.holder_document?.trim(),
  )
}

export function isContratoComplete(
  acceptedTermTypes: string[],
  contract: CredentialingSnapshot['contract'],
  credentialingStatus?: string,
): boolean {
  if (credentialingStatus === 'ativo' || credentialingStatus === 'aguardando_aprovacao') {
    return true
  }
  const contractOk = contract?.status === 'assinado' || contract?.status === 'aprovado'
  const allTermsOk = allTermsAccepted(acceptedTermTypes, PP_CREDENTIALING_TERM_TYPES)
  return contractOk && allTermsOk
}

export function computeStepCompletion(snapshot: CredentialingSnapshot): StepCompletion {
  const status = snapshot.professional.credentialing_status
  const credentialed = status === 'ativo' || status === 'aguardando_aprovacao'
  const accepted = snapshot.acceptedTermTypes

  return {
    dados: credentialed || isDadosComplete(snapshot.professional),
    conselho: credentialed || isConselhoComplete(snapshot.council),
    documentos: credentialed || isDocumentosComplete(snapshot.documents),
    banco: credentialed || isBancoComplete(snapshot.bank),
    termos: credentialed || isTermosComplete(accepted),
    categorias: credentialed || isCategoriasComplete(snapshot.professional, accepted),
    sigilo: credentialed || isSigiloComplete(accepted),
    contrato: credentialed || (
      (snapshot.contract?.status === 'assinado' || snapshot.contract?.status === 'aprovado')
      && isTermosComplete(accepted)
      && isSigiloComplete(accepted)
      && isRegrasComplete(accepted)
      && isCategoriasComplete(snapshot.professional, accepted)
    ),
    regras: credentialed || isRegrasComplete(accepted),
  }
}

export function resolveCurrentStep(completion: StepCompletion): CredentialingStepId {
  for (const step of CREDENTIALING_STEPS) {
    if (!completion[step.id]) return step.id
  }
  return 'contrato'
}

export const CREDENTIALING_STATUS_FLOW = [
  'rascunho',
  'documentos_pendentes',
  'termos_pendentes',
  'contrato_pendente',
  'aguardando_aprovacao',
  'ativo',
] as const

export function isCredentialingEditable(status: string): boolean {
  return status === 'rascunho'
    || status === 'documentos_pendentes'
    || status === 'termos_pendentes'
    || status === 'contrato_pendente'
}

export function isCredentialingPendingReview(status: string): boolean {
  return status === 'aguardando_aprovacao'
}

export function isCredentialingActive(status: string): boolean {
  return status === 'ativo'
}

export function inferRequestsCardioHabilitation(
  pro: Pick<
    CredentialingSnapshot['professional'],
    'technical_categories' | 'cardiorrespiratory_request_basis'
  >,
): boolean {
  const categories = (pro.technical_categories ?? []) as PpTechnicalCategory[]
  if (!ppHasCardiorrespiratoryCategory(categories)) return false
  return Boolean(pro.cardiorrespiratory_request_basis)
}

export { CARDIORRESPIRATORY_CATEGORY, type CardiorrespiratoryRequestBasis, type PpTechnicalCategory }
