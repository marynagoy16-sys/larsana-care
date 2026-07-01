import { REQUIRED_PP_DOCUMENTS } from '@/lib/credentialingModel'
import type { CredentialingListItem } from '@/services/adminCredentialing'

export interface CredentialingListFilters {
  status?: string
  pending_review_only?: boolean
  cardio_review_only?: boolean
  hide_active?: boolean
  profession?: string
  pp_class?: string
  council_type?: string
  documents_complete?: boolean
  contract_signed?: boolean
  updated_from?: string
  updated_to?: string
}

export const emptyCredentialingFilters: CredentialingListFilters = {}

export function countActiveCredentialingFilters(filters: CredentialingListFilters): number {
  let n = 0
  if (filters.status) n++
  if (filters.pending_review_only) n++
  if (filters.cardio_review_only) n++
  if (filters.hide_active) n++
  if (filters.profession) n++
  if (filters.pp_class) n++
  if (filters.council_type) n++
  if (filters.documents_complete != null) n++
  if (filters.contract_signed != null) n++
  if (filters.updated_from) n++
  if (filters.updated_to) n++
  return n
}

export function matchesCredentialingFilters(
  row: CredentialingListItem,
  filters: CredentialingListFilters,
): boolean {
  if (filters.pending_review_only && row.credentialing_status !== 'aguardando_aprovacao') {
    return false
  }
  if (filters.cardio_review_only && row.cardiorrespiratory_habilitation_status !== 'em_analise') {
    return false
  }
  if (filters.hide_active && row.credentialing_status === 'ativo') return false
  if (filters.status && row.credentialing_status !== filters.status) return false
  if (filters.profession && row.profession !== filters.profession) return false
  if (filters.pp_class && row.pp_class !== filters.pp_class) return false
  if (filters.council_type && row.council_type !== filters.council_type) return false
  if (filters.documents_complete != null && row.has_complete_documents !== filters.documents_complete) {
    return false
  }
  if (filters.contract_signed != null && row.flag_assinado !== filters.contract_signed) {
    return false
  }
  if (filters.updated_from) {
    const updated = new Date(row.updated_at)
    const from = new Date(`${filters.updated_from}T00:00:00`)
    if (updated < from) return false
  }
  if (filters.updated_to) {
    const updated = new Date(row.updated_at)
    const to = new Date(`${filters.updated_to}T23:59:59.999`)
    if (updated > to) return false
  }
  return true
}

export function hasCompleteRequiredDocuments(documentTypes: string[]): boolean {
  const types = new Set(documentTypes)
  return REQUIRED_PP_DOCUMENTS.every((t) => types.has(t))
}
