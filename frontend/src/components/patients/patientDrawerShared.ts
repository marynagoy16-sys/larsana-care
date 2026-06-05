export const JOURNEY_STAGES = [
  { id: 'cadastro', label: 'Cadastro' },
  { id: 'avaliacao', label: 'Avaliação' },
  { id: 'ciclo', label: 'Ciclo' },
  { id: 'tratamento', label: 'Tratamento' },
] as const

export const CREATE_FORM_STEPS = [
  { id: 'patient', label: 'Dados do paciente' },
  { id: 'responsible', label: 'Responsável' },
  { id: 'address', label: 'Endereço' },
  { id: 'documents', label: 'Documentos' },
] as const

export type CreateFormStepId = (typeof CREATE_FORM_STEPS)[number]['id']

export const PATIENT_DRAWER_SHEET_CLASS =
  'w-full sm:max-w-xl lg:max-w-2xl p-0 gap-0 overflow-hidden [&>button]:hidden'

export function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}
