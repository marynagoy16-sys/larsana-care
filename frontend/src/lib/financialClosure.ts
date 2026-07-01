export type PauseType =
  | 'none'
  | 'justified'
  | 'unjustified'
  | 'professional_or_operation_issue'

export interface FinancialClosureInput {
  sessionsContracted: number
  sessionsCompleted: number
  sessionUnitPriceCents: number
  ppPercentage: number
  larsanaPercentage: number
  pauseType: PauseType
}

export interface FinancialClosureResult {
  grossCycleAmountCents: number
  completedAmountCents: number
  remainingAmountCents: number
  ppReleaseAmountCents: number
  larsanaCommissionAmountCents: number
  operationalFeeCents: number
  familyRefundAmountCents: number
  larsanaTotalCents: number
}

export function calculateFinancialClosure(input: FinancialClosureInput): FinancialClosureResult {
  const grossCycleAmountCents = input.sessionsContracted * input.sessionUnitPriceCents
  const completedAmountCents = input.sessionsCompleted * input.sessionUnitPriceCents
  const remainingAmountCents = grossCycleAmountCents - completedAmountCents

  let ppReleaseAmountCents: number
  let larsanaCommissionAmountCents: number
  let operationalFeeCents = 0
  let familyRefundAmountCents = 0

  if (input.pauseType === 'none') {
    ppReleaseAmountCents = Math.round(grossCycleAmountCents * input.ppPercentage / 100)
    larsanaCommissionAmountCents = grossCycleAmountCents - ppReleaseAmountCents
  } else {
    ppReleaseAmountCents = Math.round(completedAmountCents * input.ppPercentage / 100)
    larsanaCommissionAmountCents = Math.round(completedAmountCents * input.larsanaPercentage / 100)

    if (input.pauseType === 'justified' || input.pauseType === 'professional_or_operation_issue') {
      familyRefundAmountCents = remainingAmountCents
    } else if (input.pauseType === 'unjustified') {
      operationalFeeCents = Math.round(remainingAmountCents * 0.2)
      familyRefundAmountCents = remainingAmountCents - operationalFeeCents
    }
  }

  return {
    grossCycleAmountCents,
    completedAmountCents,
    remainingAmountCents,
    ppReleaseAmountCents,
    larsanaCommissionAmountCents,
    operationalFeeCents,
    familyRefundAmountCents,
    larsanaTotalCents: larsanaCommissionAmountCents + operationalFeeCents,
  }
}

export const RESCHEDULE_REASON_OPTIONS = [
  { value: 'saude', label: 'Saúde / intercorrência clínica' },
  { value: 'internacao', label: 'Internação' },
  { value: 'problema_fisio', label: 'Problema com o profissional' },
  { value: 'horario', label: 'Dificuldade de horário' },
  { value: 'familiar', label: 'Indisponibilidade familiar' },
  { value: 'outro', label: 'Outro' },
] as const

export type RescheduleReasonCategory = (typeof RESCHEDULE_REASON_OPTIONS)[number]['value']

export function isValidRescheduleJustification(category: RescheduleReasonCategory | null | undefined): boolean {
  return category === 'saude' || category === 'internacao'
}

export function requiresRescheduleReason(sequenceNumber: number): boolean {
  return sequenceNumber >= 2
}

export function requiresRescheduleWarningAck(sequenceNumber: number, category: RescheduleReasonCategory | null | undefined): boolean {
  return sequenceNumber >= 3 && !isValidRescheduleJustification(category)
}

export const RESCHEDULE_WARNING_MESSAGE =
  'Esta é a terceira solicitação consecutiva de remarcação. Caso não haja justificativa validada, o tratamento poderá ser pausado administrativamente. Os atendimentos já realizados serão fechados financeiramente, e o saldo dos atendimentos não realizados poderá ter retenção operacional de 20%, com reembolso de 80% do saldo remanescente. Você tem certeza que deseja prosseguir?'
