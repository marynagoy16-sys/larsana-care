export const LEGAL_TERM_TYPES = [
  'TERMO_ADESAO',
  'LGPD',
  'CONTRATO_INTERMEDIACAO',
  'TERMO_CONSENTIMENTO',
  'DIRETRIZES',
  'DIRETRIZES_PP',
  'LGPD_PP',
  'TERMO_USO_PP',
  'ANEXO_I_COMERCIAL_PP',
  'ANEXO_II_OPERACIONAL_PP',
  'ANEXO_III_CATEGORIAS_PP',
  'ANEXO_IV_SIGILO_PP',
  'CONTRATO_PARCERIA_PP',
  'ANEXO_I_COMERCIAL_PACIENTE',
  'ANEXO_II_CANCELAMENTO_PACIENTE',
  'ANEXO_III_ESCOPO_PACIENTE',
  'TCLE_FISIO',
  'AUTORIZACAO_FAMILIAR',
  'REPRESENTACAO_LEGAL',
  'AVISO_DADOS_SAUDE',
  'POLITICA_COOKIES',
] as const

export type LegalTermType = (typeof LEGAL_TERM_TYPES)[number]

export type LegalTermProfile = 'pp' | 'paciente' | 'publico'
export type LegalAcceptanceMode = 'express' | 'awareness' | 'contextual'

export const LEGAL_TERM_LABELS: Record<LegalTermType, string> = {
  TERMO_ADESAO: 'Termos de Uso',
  LGPD: 'Políticas de Privacidade',
  CONTRATO_INTERMEDIACAO: 'Contrato de Intermediação',
  TERMO_CONSENTIMENTO: 'Termo de Consentimento',
  DIRETRIZES: 'Diretrizes de uso',
  DIRETRIZES_PP: 'Diretrizes — Profissionais',
  LGPD_PP: 'Políticas de Privacidade — Profissionais',
  TERMO_USO_PP: 'Termos de Uso — Profissionais Parceiros',
  ANEXO_I_COMERCIAL_PP: 'Anexo I — Regras Comerciais PP',
  ANEXO_II_OPERACIONAL_PP: 'Anexo II — Regras Operacionais PP',
  ANEXO_III_CATEGORIAS_PP: 'Anexo III — Categorias Técnicas',
  ANEXO_IV_SIGILO_PP: 'Anexo IV — Sigilo e Dados Assistenciais',
  CONTRATO_PARCERIA_PP: 'Contrato de Parceria PP',
  ANEXO_I_COMERCIAL_PACIENTE: 'Anexo I — Condições Comerciais',
  ANEXO_II_CANCELAMENTO_PACIENTE: 'Anexo II — Cancelamento e Reagendamento',
  ANEXO_III_ESCOPO_PACIENTE: 'Anexo III — Escopo dos Profissionais',
  TCLE_FISIO: 'TCLE — Fisioterapia Domiciliar',
  AUTORIZACAO_FAMILIAR: 'Autorização Familiar',
  REPRESENTACAO_LEGAL: 'Representação Legal',
  AVISO_DADOS_SAUDE: 'Aviso — Dados de Saúde',
  POLITICA_COOKIES: 'Política de Cookies',
}

export const LEGAL_TERM_PUBLIC_PATHS: Partial<Record<LegalTermType, string>> = {
  TERMO_ADESAO: '/termos-de-uso',
  LGPD: '/politica-de-privacidade',
  TERMO_USO_PP: '/termos-profissionais',
  LGPD_PP: '/privacidade-profissionais',
  POLITICA_COOKIES: '/politica-de-cookies',
  ANEXO_II_CANCELAMENTO_PACIENTE: '/regras-cancelamento',
}

export type LegalTermMeta = {
  profile: LegalTermProfile
  flow?: string
  requiresAcceptance: boolean
}

export const LEGAL_TERM_META: Partial<Record<LegalTermType, LegalTermMeta>> = {
  TERMO_USO_PP: { profile: 'pp', flow: 'credentialing', requiresAcceptance: true },
  DIRETRIZES_PP: { profile: 'pp', flow: 'credentialing', requiresAcceptance: true },
  LGPD_PP: { profile: 'pp', flow: 'credentialing', requiresAcceptance: true },
  ANEXO_III_CATEGORIAS_PP: { profile: 'pp', flow: 'credentialing', requiresAcceptance: true },
  ANEXO_IV_SIGILO_PP: { profile: 'pp', flow: 'credentialing', requiresAcceptance: true },
  ANEXO_I_COMERCIAL_PP: { profile: 'pp', flow: 'credentialing', requiresAcceptance: true },
  ANEXO_II_OPERACIONAL_PP: { profile: 'pp', flow: 'credentialing', requiresAcceptance: true },
  TERMO_ADESAO: { profile: 'paciente', flow: 'onboarding', requiresAcceptance: true },
  LGPD: { profile: 'paciente', flow: 'onboarding', requiresAcceptance: true },
  AVISO_DADOS_SAUDE: { profile: 'paciente', flow: 'onboarding', requiresAcceptance: true },
  ANEXO_I_COMERCIAL_PACIENTE: { profile: 'paciente', flow: 'cycle', requiresAcceptance: true },
  ANEXO_II_CANCELAMENTO_PACIENTE: { profile: 'paciente', flow: 'cycle', requiresAcceptance: true },
  TCLE_FISIO: { profile: 'paciente', flow: 'tcle', requiresAcceptance: true },
  AUTORIZACAO_FAMILIAR: { profile: 'paciente', flow: 'family', requiresAcceptance: true },
  REPRESENTACAO_LEGAL: { profile: 'paciente', flow: 'representation', requiresAcceptance: true },
  POLITICA_COOKIES: { profile: 'publico', requiresAcceptance: false },
}

export const PP_CREDENTIALING_TERM_TYPES = [
  'TERMO_USO_PP',
  'DIRETRIZES_PP',
  'LGPD_PP',
  'ANEXO_III_CATEGORIAS_PP',
  'ANEXO_IV_SIGILO_PP',
  'ANEXO_I_COMERCIAL_PP',
  'ANEXO_II_OPERACIONAL_PP',
] as const satisfies readonly LegalTermType[]

export const PATIENT_ONBOARDING_TERM_TYPES = [
  'TERMO_ADESAO',
  'LGPD',
  'AVISO_DADOS_SAUDE',
] as const satisfies readonly LegalTermType[]

export const PATIENT_CYCLE_TERM_TYPES = [
  'ANEXO_I_COMERCIAL_PACIENTE',
  'ANEXO_II_CANCELAMENTO_PACIENTE',
] as const satisfies readonly LegalTermType[]

export const ANEXO_II_CANCELAMENTO_SUMMARY =
  'Cancelamentos com menos de 2 horas de antecedência podem gerar cobrança parcial conforme Anexo II. Reagendamentos devem ser solicitados pelo app ou chat Sara.'

export function legalTermLabel(termType: string, fallbackTitle?: string | null): string {
  return LEGAL_TERM_LABELS[termType as LegalTermType] ?? fallbackTitle ?? termType
}

export function hasAcceptedTermType(acceptedTypes: string[], termType: LegalTermType): boolean {
  if (acceptedTypes.includes(termType)) return true
  if (termType === 'TERMO_USO_PP' && acceptedTypes.includes('DIRETRIZES_PP')) return true
  if (termType === 'DIRETRIZES_PP' && acceptedTypes.includes('TERMO_USO_PP')) return true
  if (termType === 'TCLE_FISIO' && acceptedTypes.includes('TERMO_CONSENTIMENTO')) return true
  return false
}

export function allTermsAccepted(acceptedTypes: string[], required: readonly LegalTermType[]): boolean {
  return required.every((t) => hasAcceptedTermType(acceptedTypes, t))
}
