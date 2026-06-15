import type { CommissionRule, PricingEntry, RetentionRule } from '@/services/pricing'

export const ASSESSMENT_APPROVED_PAYOUT_CENTS = 10000
export const ASSESSMENT_DECLINED_PAYOUT_CENTS = 5000

export const FREQUENCY_OPTIONS = [
  { weeklyFrequency: 1, sessionsPerCycle: 4, label: '1x por semana (4 atendimentos/ciclo)' },
  { weeklyFrequency: 2, sessionsPerCycle: 8, label: '2x por semana (8 atendimentos/ciclo)' },
  { weeklyFrequency: 3, sessionsPerCycle: 12, label: '3x por semana (12 atendimentos/ciclo)' },
] as const

export interface DemandRepasseRules {
  cycle1Percent: number
  cycle2Percent: number
  cycle1RepassePerSessionCents: number
  cycle2RepassePerSessionCents: number
}

export interface FrequencySimulationRow {
  weeklyFrequency: number
  sessionsPerCycle: number
  label: string
  cycle1RepassePerSessionCents: number
  cycle2RepassePerSessionCents: number
  cycle1TotalCents: number
  cycle2TotalCents: number
}

export interface AvaliacaoSimulation {
  rules: DemandRepasseRules
  rows: FrequencySimulationRow[]
}

export interface ContinuidadeSimulation {
  rules: DemandRepasseRules
  row: FrequencySimulationRow
}

const DEFAULT_CYCLE2_PERCENT = 70

export function findSessionPriceCents(
  entries: PricingEntry[],
  regionId: string | null | undefined,
  patientLevel: string | null | undefined,
): number | null {
  if (!regionId || !patientLevel || patientLevel === 'VALOR_SOCIAL') return null
  const entry = entries.find(
    (item) => item.region_id === regionId && item.patient_level === patientLevel,
  )
  return entry?.session_price_cents ?? null
}

export function resolveCyclePercents(params: {
  commissions: CommissionRule[]
  retention: RetentionRule | null
  ppClass?: string | null
}): { cycle1Percent: number; cycle2Percent: number } {
  const larsanaRetention = params.retention ? Number(params.retention.larsana_percent) : 40
  const cycle1Percent = 100 - larsanaRetention

  const ppClass = params.ppClass ?? 'BRONZE'
  const commission = params.commissions.find((item) => item.pp_class === ppClass)
  const cycle2Percent = commission ? Number(commission.pp_percent) : DEFAULT_CYCLE2_PERCENT

  return { cycle1Percent, cycle2Percent }
}

function repassePerSession(sessionPriceCents: number, percent: number): number {
  return Math.round(sessionPriceCents * percent / 100)
}

function buildFrequencyRow(
  option: (typeof FREQUENCY_OPTIONS)[number],
  sessionPriceCents: number,
  cycle1Percent: number,
  cycle2Percent: number,
): FrequencySimulationRow {
  const cycle1RepassePerSessionCents = repassePerSession(sessionPriceCents, cycle1Percent)
  const cycle2RepassePerSessionCents = repassePerSession(sessionPriceCents, cycle2Percent)

  return {
    weeklyFrequency: option.weeklyFrequency,
    sessionsPerCycle: option.sessionsPerCycle,
    label: option.label,
    cycle1RepassePerSessionCents,
    cycle2RepassePerSessionCents,
    cycle1TotalCents: cycle1RepassePerSessionCents * option.sessionsPerCycle,
    cycle2TotalCents: cycle2RepassePerSessionCents * option.sessionsPerCycle,
  }
}

export function buildAvaliacaoSimulation(params: {
  sessionPriceCents: number | null
  commissions: CommissionRule[]
  retention: RetentionRule | null
  ppClass?: string | null
}): AvaliacaoSimulation | null {
  if (params.sessionPriceCents == null) return null

  const { cycle1Percent, cycle2Percent } = resolveCyclePercents(params)
  const session = params.sessionPriceCents

  return {
    rules: {
      cycle1Percent,
      cycle2Percent,
      cycle1RepassePerSessionCents: repassePerSession(session, cycle1Percent),
      cycle2RepassePerSessionCents: repassePerSession(session, cycle2Percent),
    },
    rows: FREQUENCY_OPTIONS.map((option) =>
      buildFrequencyRow(option, session, cycle1Percent, cycle2Percent),
    ),
  }
}

export function buildContinuidadeSimulation(params: {
  sessionPriceCents: number | null
  commissions: CommissionRule[]
  retention: RetentionRule | null
  weeklyFrequency?: number | null
  ppClass?: string | null
}): ContinuidadeSimulation | null {
  if (params.sessionPriceCents == null) return null

  const { cycle2Percent } = resolveCyclePercents(params)
  const session = params.sessionPriceCents
  const weeklyFrequency = params.weeklyFrequency && params.weeklyFrequency > 0
    ? params.weeklyFrequency
    : 1
  const sessionsPerCycle = weeklyFrequency * 4
  const option = FREQUENCY_OPTIONS.find((item) => item.weeklyFrequency === weeklyFrequency)
    ?? { weeklyFrequency, sessionsPerCycle, label: `${weeklyFrequency}x por semana (${sessionsPerCycle} atendimentos/ciclo)` }

  const cycle2RepassePerSessionCents = repassePerSession(session, cycle2Percent)

  return {
    rules: {
      cycle1Percent: cycle2Percent,
      cycle2Percent,
      cycle1RepassePerSessionCents: cycle2RepassePerSessionCents,
      cycle2RepassePerSessionCents: cycle2RepassePerSessionCents,
    },
    row: {
      weeklyFrequency: option.weeklyFrequency,
      sessionsPerCycle: option.sessionsPerCycle,
      label: option.label,
      cycle1RepassePerSessionCents: cycle2RepassePerSessionCents,
      cycle2RepassePerSessionCents: cycle2RepassePerSessionCents,
      cycle1TotalCents: cycle2RepassePerSessionCents * option.sessionsPerCycle,
      cycle2TotalCents: cycle2RepassePerSessionCents * option.sessionsPerCycle,
    },
  }
}
