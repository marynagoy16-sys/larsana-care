export const LEGAL_TERM_TYPES = [
  'TERMO_ADESAO',
  'LGPD',
  'CONTRATO_INTERMEDIACAO',
  'TERMO_CONSENTIMENTO',
  'DIRETRIZES',
  'DIRETRIZES_PP',
  'LGPD_PP',
] as const

export type LegalTermType = (typeof LEGAL_TERM_TYPES)[number]

export const LEGAL_TERM_LABELS: Record<LegalTermType, string> = {
  TERMO_ADESAO: 'Termos de Uso',
  LGPD: 'Políticas de Privacidade',
  CONTRATO_INTERMEDIACAO: 'Contrato de Intermediação',
  TERMO_CONSENTIMENTO: 'Termo de Consentimento',
  DIRETRIZES: 'Diretrizes de uso',
  DIRETRIZES_PP: 'Diretrizes — Profissionais',
  LGPD_PP: 'Políticas de Privacidade — Profissionais',
}

export const LEGAL_TERM_PUBLIC_PATHS: Partial<Record<LegalTermType, string>> = {
  TERMO_ADESAO: '/termos-de-uso',
  LGPD: '/politica-de-privacidade',
}

export function legalTermLabel(termType: string, fallbackTitle?: string | null): string {
  return LEGAL_TERM_LABELS[termType as LegalTermType] ?? fallbackTitle ?? termType
}
