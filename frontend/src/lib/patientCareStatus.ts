export const PATIENT_CARE_STATUS_VALUES = [
  'ATIVO',
  'PAUSA_JUSTIFICADA',
  'PAUSA_SOLICITADA_PACIENTE',
  'ALTA',
  'OBITO',
  'CANCELADO',
  'PAUSA',
] as const

export type PatientCareStatus = (typeof PATIENT_CARE_STATUS_VALUES)[number]

export const PAUSE_CARE_STATUSES: PatientCareStatus[] = [
  'PAUSA',
  'PAUSA_JUSTIFICADA',
  'PAUSA_SOLICITADA_PACIENTE',
]

export const careStatusLabels: Record<string, string> = {
  ATIVO: 'Ativo',
  PAUSA: 'Em pausa',
  PAUSA_JUSTIFICADA: 'Em pausa · Justificada (doenças)',
  PAUSA_SOLICITADA_PACIENTE: 'Em pausa · Solicitada pelo paciente',
  ALTA: 'Alta',
  OBITO: 'Óbito',
  CANCELADO: 'Cancelado',
}

export const patientCareStatusSelectOptions = [
  { value: 'ATIVO', label: 'Ativo', group: 'Tratamento' },
  { value: 'PAUSA_JUSTIFICADA', label: 'Justificada (doenças)', group: 'Em pausa' },
  {
    value: 'PAUSA_SOLICITADA_PACIENTE',
    label: 'Solicitada pelo paciente (questões financeiras etc.)',
    group: 'Em pausa',
  },
  { value: 'ALTA', label: 'Alta', group: 'Encerramento' },
  { value: 'OBITO', label: 'Óbito', group: 'Encerramento' },
  { value: 'CANCELADO', label: 'Cancelado', group: 'Encerramento' },
] as const

export function isPatientOnPause(status: string | null | undefined): boolean {
  return PAUSE_CARE_STATUSES.includes(status as PatientCareStatus)
}

export function isPatientInActiveTreatment(status: string | null | undefined): boolean {
  return status === 'ATIVO'
}

export function getCareStatusLabel(status: string | null | undefined): string {
  if (!status) return '—'
  return careStatusLabels[status] ?? status
}
