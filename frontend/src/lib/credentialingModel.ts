import type { Tables } from '@/types/database'

/** Etapas do wizard self-service do PP (UI). */
export const CREDENTIALING_STEPS = [
  { id: 'dados', label: 'Dados' },
  { id: 'conselho', label: 'Conselho' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'banco', label: 'Banco' },
  { id: 'contrato', label: 'Contrato' },
] as const

export type CredentialingStepId = (typeof CREDENTIALING_STEPS)[number]['id']

/** Documentos obrigatórios antes de enviar para aprovação. */
export const REQUIRED_PP_DOCUMENTS = [
  'RG_CNH',
  'COUNCIL_CARD',
  'CRIMINAL_BACKGROUND',
] as const satisfies readonly Tables<'professional_documents'>['document_type'][]

export const OPTIONAL_PP_DOCUMENTS = [
  'CERTIFICATE',
] as const satisfies readonly Tables<'professional_documents'>['document_type'][]

/** Termos legais aceitos na etapa Contrato. */
export const PP_LEGAL_TERM_TYPES = ['DIRETRIZES_PP', 'LGPD_PP'] as const

/** Conselho padrão por profissão. */
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
    | 'credentialing_status'
    | 'flag_assinado'
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
  if (
    credentialingStatus === 'ativo'
    || credentialingStatus === 'aguardando_aprovacao'
  ) {
    return true
  }
  const termsOk = PP_LEGAL_TERM_TYPES.every((t) => acceptedTermTypes.includes(t))
  const contractOk = contract?.status === 'assinado' || contract?.status === 'aprovado'
  return termsOk && contractOk
}

export function computeStepCompletion(snapshot: CredentialingSnapshot): StepCompletion {
  const status = snapshot.professional.credentialing_status
  const credentialed = status === 'ativo' || status === 'aguardando_aprovacao'

  return {
    dados: credentialed || isDadosComplete(snapshot.professional),
    conselho: credentialed || isConselhoComplete(snapshot.council),
    documentos: credentialed || isDocumentosComplete(snapshot.documents),
    banco: credentialed || isBancoComplete(snapshot.bank),
    contrato: isContratoComplete(snapshot.acceptedTermTypes, snapshot.contract, status),
  }
}

/** Primeira etapa incompleta; se todas ok, retorna contrato. */
export function resolveCurrentStep(completion: StepCompletion): CredentialingStepId {
  for (const step of CREDENTIALING_STEPS) {
    if (!completion[step.id]) return step.id
  }
  return 'contrato'
}

/**
 * Estados operacionais do backend (credentialing_status) vs etapas do wizard.
 * O PP preenche as 5 etapas; ao concluir Contrato → aguardando_aprovacao.
 * Gestão aprova → ativo.
 */
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
