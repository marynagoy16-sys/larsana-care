export const PP_TECHNICAL_CATEGORY_VALUES = [
  'ortopedico',
  'pos_operatorio',
  'neurologico',
  'idoso_gerontologia',
  'funcional_condicionamento',
  'pediatrico_geral',
  'cardiorrespiratoria',
  'atendimento_unico',
] as const

export type PpTechnicalCategory = (typeof PP_TECHNICAL_CATEGORY_VALUES)[number]

export const CARDIORRESPIRATORY_CATEGORY: PpTechnicalCategory = 'cardiorrespiratoria'

export const GENERAL_PP_TECHNICAL_CATEGORIES = PP_TECHNICAL_CATEGORY_VALUES.filter(
  (c) => c !== CARDIORRESPIRATORY_CATEGORY,
)

export const ppTechnicalCategoryLabels: Record<PpTechnicalCategory, string> = {
  ortopedico: 'Ortopédico',
  pos_operatorio: 'Pós-operatório',
  neurologico: 'Neurológico',
  idoso_gerontologia: 'Idoso / Gerontologia',
  funcional_condicionamento: 'Funcional / Condicionamento',
  pediatrico_geral: 'Pediátrico geral',
  cardiorrespiratoria: 'Cardiorrespiratória',
  atendimento_unico: 'Atendimento único',
}

export const ppTechnicalCategorySelectOptions = PP_TECHNICAL_CATEGORY_VALUES.map((value) => ({
  value,
  label: ppTechnicalCategoryLabels[value],
}))

export const CARDIORRESPIRATORY_HABILITATION_STATUS_VALUES = [
  'nao_solicitado',
  'em_analise',
  'habilitado',
  'nao_habilitado',
  'suspenso',
] as const

export type CardiorrespiratoryHabilitationStatus =
  (typeof CARDIORRESPIRATORY_HABILITATION_STATUS_VALUES)[number]

export const cardiorrespiratoryHabilitationStatusLabels: Record<
  CardiorrespiratoryHabilitationStatus,
  string
> = {
  nao_solicitado: 'Não solicitado',
  em_analise: 'Em análise',
  habilitado: 'Habilitado para Cardiorrespiratória pela Larsana',
  nao_habilitado: 'Não habilitado',
  suspenso: 'Suspenso',
}

export const CARDIORRESPIRATORY_REQUEST_BASIS_VALUES = [
  'certificado',
  'experiencia',
  'certificado_e_experiencia',
  'analise_larsana',
] as const

export type CardiorrespiratoryRequestBasis =
  (typeof CARDIORRESPIRATORY_REQUEST_BASIS_VALUES)[number]

export const cardiorrespiratoryRequestBasisLabels: Record<
  CardiorrespiratoryRequestBasis,
  string
> = {
  certificado: 'Tenho certificado ou curso na área cardiorrespiratória',
  experiencia: 'Tenho experiência clínica na área cardiorrespiratória',
  certificado_e_experiencia: 'Tenho certificado e experiência clínica na área cardiorrespiratória',
  analise_larsana: 'Desejo solicitar análise da Larsana Care',
}

export const CARDIO_HABILITATION_DOCUMENT_TYPES = [
  'CARDIO_CERTIFICATE',
  'CARDIO_EXPERIENCE_PROOF',
  'CARDIO_CV',
  'CARDIO_PROFESSIONAL_DECLARATION',
  'CARDIO_OTHER',
] as const

export type CardioHabilitationDocumentType = (typeof CARDIO_HABILITATION_DOCUMENT_TYPES)[number]

export const cardioHabilitationDocumentTypeLabels: Record<CardioHabilitationDocumentType, string> = {
  CARDIO_CERTIFICATE: 'Certificado ou curso',
  CARDIO_EXPERIENCE_PROOF: 'Comprovante de experiência',
  CARDIO_CV: 'Currículo',
  CARDIO_PROFESSIONAL_DECLARATION: 'Declaração profissional',
  CARDIO_OTHER: 'Outro documento relevante',
}

export function getPpTechnicalCategoryLabel(
  category: string | null | undefined,
): string {
  if (!category) return '—'
  return ppTechnicalCategoryLabels[category as PpTechnicalCategory] ?? category
}

export function isCardiorrespiratoryCategory(
  category: string | null | undefined,
): boolean {
  return category === CARDIORRESPIRATORY_CATEGORY
}

export function ppHasCardiorrespiratoryCategory(
  categories: readonly string[] | null | undefined,
): boolean {
  return (categories ?? []).includes(CARDIORRESPIRATORY_CATEGORY)
}

export function normalizeTechnicalCategoriesForSave(
  categories: PpTechnicalCategory[],
  requestsCardioHabilitation: boolean,
): PpTechnicalCategory[] {
  if (!requestsCardioHabilitation) {
    return categories.filter((c) => c !== CARDIORRESPIRATORY_CATEGORY)
  }
  return categories
}

/** Soft filter: 1=match, 0=sem preferências, -1=fora das preferências */
export function scoreDemandPreferenceMatch(
  demandCategory: string | null | undefined,
  preferences: PpTechnicalCategory[] | null | undefined,
): 1 | 0 | -1 {
  if (!preferences?.length) return 0
  if (!demandCategory) return 0
  return preferences.includes(demandCategory as PpTechnicalCategory) ? 1 : -1
}
