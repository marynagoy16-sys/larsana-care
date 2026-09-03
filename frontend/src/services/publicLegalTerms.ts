import { supabase } from '@/lib/supabase'
import { LEGAL_TERM_LABELS, LEGAL_TERM_PUBLIC_PATHS, type LegalTermType } from '@/constants/legalTerms'

export type PublicLegalTermSlug =
  | 'termos-de-uso'
  | 'politica-de-privacidade'
  | 'termos-profissionais'
  | 'privacidade-profissionais'
  | 'politica-de-cookies'
  | 'regras-cancelamento'

export type PublicLegalTerm = {
  id: string
  term_type: string
  title: string
  version: string
  content: string | null
}

const SLUG_TO_TERM_TYPE: Record<PublicLegalTermSlug, LegalTermType> = {
  'termos-de-uso': 'TERMO_ADESAO',
  'politica-de-privacidade': 'LGPD',
  'termos-profissionais': 'TERMO_USO_PP',
  'privacidade-profissionais': 'LGPD_PP',
  'politica-de-cookies': 'POLITICA_COOKIES',
  'regras-cancelamento': 'ANEXO_II_CANCELAMENTO_PACIENTE',
}

export const PUBLIC_LEGAL_TERM_LABELS: Record<PublicLegalTermSlug, string> = {
  'termos-de-uso': LEGAL_TERM_LABELS.TERMO_ADESAO,
  'politica-de-privacidade': LEGAL_TERM_LABELS.LGPD,
  'termos-profissionais': LEGAL_TERM_LABELS.TERMO_USO_PP,
  'privacidade-profissionais': LEGAL_TERM_LABELS.LGPD_PP,
  'politica-de-cookies': LEGAL_TERM_LABELS.POLITICA_COOKIES,
  'regras-cancelamento': LEGAL_TERM_LABELS.ANEXO_II_CANCELAMENTO_PACIENTE,
}

export const PUBLIC_SLUGS = Object.keys(SLUG_TO_TERM_TYPE) as PublicLegalTermSlug[]

export function slugFromTermType(termType: LegalTermType): PublicLegalTermSlug | null {
  const entry = Object.entries(SLUG_TO_TERM_TYPE).find(([, type]) => type === termType)
  return (entry?.[0] as PublicLegalTermSlug | undefined) ?? null
}

export function isPublicLegalTermSlug(value: string): value is PublicLegalTermSlug {
  return value in SLUG_TO_TERM_TYPE
}

export function publicPathForTermType(termType: LegalTermType): string | null {
  return LEGAL_TERM_PUBLIC_PATHS[termType] ?? null
}

export async function getPublicLegalTerm(slug: PublicLegalTermSlug): Promise<PublicLegalTerm | null> {
  const { data, error } = await supabase.rpc('get_public_legal_term' as never, {
    p_term_type: SLUG_TO_TERM_TYPE[slug],
  } as never)
  if (error) throw error
  if (!data) return null
  return data as PublicLegalTerm
}

export async function getPublicLegalTermByType(termType: LegalTermType): Promise<PublicLegalTerm | null> {
  const { data, error } = await supabase.rpc('get_public_legal_term' as never, {
    p_term_type: termType,
  } as never)
  if (error) throw error
  if (!data) return null
  return data as PublicLegalTerm
}
