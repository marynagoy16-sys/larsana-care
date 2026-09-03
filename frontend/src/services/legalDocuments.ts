import { supabase } from '@/lib/supabase'
import { mapSupabaseError } from '@/lib/supabase-errors'
import type { LegalTermProfile, LegalTermType } from '@/constants/legalTerms'

export type LegalTermRow = {
  id: string
  term_type: string
  title: string
  version: string
  content: string | null
  acceptance_mode?: string | null
  profile?: string | null
  storage_path?: string | null
}

export type RequiredLegalTerm = {
  term_type: string
  term_id: string
  title: string
  version: string
  acceptance_mode: string
  requires_acceptance: boolean
  accepted: boolean
  accepted_at: string | null
  context_label: string | null
}

export type LegalDocumentHubItem = {
  term_id: string
  term_type: string
  title: string
  version: string
  profile: string | null
  acceptance_mode: string | null
  storage_path: string | null
  accepted_at: string | null
  accepted_version: string | null
  requires_reaccept: boolean
}

export async function loadCurrentLegalTerms(termTypes: readonly string[]): Promise<LegalTermRow[]> {
  const { data, error } = await supabase
    .from('legal_terms')
    .select('id, term_type, title, version, content, acceptance_mode, profile, storage_path')
    .in('term_type', [...termTypes] as never)
    .eq('is_current', true)
    .order('term_type')

  if (error) throw error
  return (data ?? []) as LegalTermRow[]
}

export async function recordLegalAcceptance(
  termType: LegalTermType,
  options?: {
    contextType?: 'registration' | 'onboarding' | 'credentialing' | 'cycle' | 'demand' | 'session' | 'reaccept'
    contextId?: string
    patientId?: string
    professionalId?: string
    cycleSnapshot?: Record<string, unknown>
  },
): Promise<string | null> {
  const { data, error } = await supabase.rpc('record_legal_acceptance' as never, {
    p_term_type: termType,
    p_context_type: options?.contextType ?? null,
    p_context_id: options?.contextId ?? null,
    p_patient_id: options?.patientId ?? null,
    p_professional_id: options?.professionalId ?? null,
    p_ip_address: null,
    p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    p_cycle_snapshot: options?.cycleSnapshot ?? null,
  } as never)

  if (error) throw new Error(mapSupabaseError(error))
  return data as string | null
}

export async function recordLegalAcceptances(
  termTypes: readonly LegalTermType[],
  contextType?: 'registration' | 'onboarding' | 'credentialing' | 'cycle' | 'demand' | 'session' | 'reaccept',
  contextId?: string,
): Promise<void> {
  for (const termType of termTypes) {
    await recordLegalAcceptance(termType, { contextType, contextId })
  }
}

export async function getRequiredLegalTerms(
  profile: LegalTermProfile,
  flow?: string,
): Promise<RequiredLegalTerm[]> {
  const { data, error } = await supabase.rpc('get_required_legal_terms' as never, {
    p_profile: profile,
    p_flow: flow ?? null,
  } as never)
  if (error) throw error
  return (data ?? []) as RequiredLegalTerm[]
}

export async function getLegalDocumentsHub(profile: LegalTermProfile): Promise<LegalDocumentHubItem[]> {
  const { data, error } = await supabase.rpc('get_legal_documents_hub' as never, {
    p_profile: profile,
  } as never)
  if (error) throw error
  return (data ?? []) as LegalDocumentHubItem[]
}

export async function hasPendingReaccept(profile?: LegalTermProfile): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_pending_reaccept' as never, {
    p_profile: profile ?? null,
  } as never)
  if (error) throw error
  return Boolean(data)
}

export async function recordCycleLegalAcceptances(
  cycleId: string,
  acceptAnexoI = true,
  acceptAnexoII = true,
): Promise<void> {
  const { error } = await supabase.rpc('record_cycle_legal_acceptances' as never, {
    p_cycle_id: cycleId,
    p_accept_anexo_i: acceptAnexoI,
    p_accept_anexo_ii: acceptAnexoII,
  } as never)
  if (error) throw new Error(mapSupabaseError(error))
}

export async function recordDemandCommercialSnapshot(
  demandId: string,
  snapshot?: { patente?: string; repassePct?: number; baseAmountCents?: number },
): Promise<void> {
  const { error } = await supabase.rpc('record_demand_commercial_snapshot' as never, {
    p_demand_id: demandId,
    p_patente: snapshot?.patente ?? null,
    p_repasse_pct: snapshot?.repassePct ?? null,
    p_base_amount_cents: snapshot?.baseAmountCents ?? null,
  } as never)
  if (error) throw new Error(mapSupabaseError(error))
}

export async function recordPatientRepresentation(
  kind: 'account_holder' | 'family_contact' | 'legal_representative',
  termType: LegalTermType,
  scopeDescription?: string,
): Promise<void> {
  const { error } = await supabase.rpc('record_patient_representation' as never, {
    p_kind: kind,
    p_term_type: termType,
    p_scope_description: scopeDescription ?? null,
    p_patient_id: null,
  } as never)
  if (error) throw new Error(mapSupabaseError(error))
}

export const legalDocumentsQueryKeys = {
  hub: (profile: LegalTermProfile) => ['legal-documents', 'hub', profile] as const,
  required: (profile: LegalTermProfile, flow?: string) =>
    ['legal-documents', 'required', profile, flow ?? 'all'] as const,
  terms: (types: readonly string[]) => ['legal-documents', 'terms', ...types] as const,
  pendingReaccept: (profile?: LegalTermProfile) =>
    ['legal-documents', 'pending-reaccept', profile ?? 'any'] as const,
}
