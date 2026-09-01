import { supabase } from '@/lib/supabase'
import { LEGAL_TERM_LABELS } from '@/constants/legalTerms'

export type PublicLegalTermSlug = 'termos-de-uso' | 'politica-de-privacidade'

export type PublicLegalTerm = {
  id: string
  term_type: string
  title: string
  version: string
  content: string | null
}

const SLUG_TO_TERM_TYPE: Record<PublicLegalTermSlug, string> = {
  'termos-de-uso': 'TERMO_ADESAO',
  'politica-de-privacidade': 'LGPD',
}

export const PUBLIC_LEGAL_TERM_LABELS: Record<PublicLegalTermSlug, string> = {
  'termos-de-uso': LEGAL_TERM_LABELS.TERMO_ADESAO,
  'politica-de-privacidade': LEGAL_TERM_LABELS.LGPD,
}

export function isPublicLegalTermSlug(value: string): value is PublicLegalTermSlug {
  return value === 'termos-de-uso' || value === 'politica-de-privacidade'
}

export async function getPublicLegalTerm(slug: PublicLegalTermSlug): Promise<PublicLegalTerm | null> {
  const { data, error } = await supabase.rpc('get_public_legal_term' as never, {
    p_term_type: SLUG_TO_TERM_TYPE[slug],
  } as never)
  if (error) throw error
  if (!data) return null
  return data as PublicLegalTerm
}
