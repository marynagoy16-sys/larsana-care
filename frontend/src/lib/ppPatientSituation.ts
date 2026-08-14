import { isPatientInActiveTreatment, isPatientOnPause } from '@/lib/patientCareStatus'

export type PPPatientSituation =
  | 'evaluation_pending'
  | 'awaiting_proposal'
  | 'proposal_review'
  | 'awaiting_payment'
  | 'proposal_declined'
  | 'proposal_expired'
  | 'evolution_pending'
  | 'on_pause'
  | 'in_treatment'
  | 'none'

export type PPPatientSituationInput = {
  evaluation_pending: boolean
  latest_assessment_status: string | null
  latest_cycle_status: string | null
  latest_cycle_payment_status: string | null
  pending_evolution_count: number
  care_status: string
}

const FAMILY_REVIEW_STATUSES = new Set(['proposta_enviada', 'em_analise'])

export function resolvePPPatientSituation(input: PPPatientSituationInput): PPPatientSituation {
  if (input.evaluation_pending) return 'evaluation_pending'

  if (input.pending_evolution_count > 0) return 'evolution_pending'

  const assessmentStatus = input.latest_assessment_status
  if (assessmentStatus && FAMILY_REVIEW_STATUSES.has(assessmentStatus)) {
    return 'proposal_review'
  }

  if (assessmentStatus === 'avaliacao_feita') return 'awaiting_proposal'
  if (assessmentStatus === 'respondida_nao') return 'proposal_declined'
  if (assessmentStatus === 'vencida') return 'proposal_expired'

  if (
    assessmentStatus === 'respondida_sim'
    && input.latest_cycle_status === 'aguardando_pagamento'
  ) {
    return 'awaiting_payment'
  }

  if (isPatientOnPause(input.care_status)) return 'on_pause'

  if (
    isPatientInActiveTreatment(input.care_status)
    && (input.latest_cycle_status === 'ativo' || input.latest_cycle_payment_status === 'pago')
  ) {
    return 'in_treatment'
  }

  if (
    isPatientInActiveTreatment(input.care_status)
    && assessmentStatus === 'respondida_sim'
    && input.latest_cycle_status != null
  ) {
    return 'in_treatment'
  }

  return 'none'
}

export const ppPatientSituationLabels: Record<PPPatientSituation, string> = {
  evaluation_pending: 'Avaliação pendente',
  awaiting_proposal: 'Aguardando proposta',
  proposal_review: 'Em análise',
  awaiting_payment: 'Aguardando pagamento',
  proposal_declined: 'Proposta recusada',
  proposal_expired: 'Prazo vencido',
  evolution_pending: 'Evolução pendente',
  on_pause: 'Em pausa',
  in_treatment: 'Em tratamento',
  none: '—',
}

export const ppPatientSituationBadgeClass: Record<PPPatientSituation, string> = {
  evaluation_pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  awaiting_proposal: 'bg-sky-100 text-sky-900 dark:bg-sky-950/40 dark:text-sky-300',
  proposal_review: 'bg-blue-100 text-blue-900 dark:bg-blue-950/40 dark:text-blue-300',
  awaiting_payment: 'bg-violet-100 text-violet-900 dark:bg-violet-950/40 dark:text-violet-300',
  proposal_declined: 'bg-rose-100 text-rose-900 dark:bg-rose-950/40 dark:text-rose-300',
  proposal_expired: 'bg-rose-100 text-rose-900 dark:bg-rose-950/40 dark:text-rose-300',
  evolution_pending: 'bg-orange-100 text-orange-900 dark:bg-orange-950/40 dark:text-orange-300',
  on_pause: 'bg-muted text-muted-foreground',
  in_treatment: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
  none: '',
}

export function isPPPatientAwaitingFamilyProposal(situation: PPPatientSituation): boolean {
  return situation === 'proposal_review' || situation === 'awaiting_proposal' || situation === 'awaiting_payment'
}

export function matchesPPPatientSituationFilter(
  situation: PPPatientSituation,
  filter: 'all' | 'evaluation' | 'proposal' | 'evolution' | 'active',
): boolean {
  if (filter === 'all') return true
  if (filter === 'evaluation') return situation === 'evaluation_pending'
  if (filter === 'proposal') {
    return (
      situation === 'awaiting_proposal'
      || situation === 'proposal_review'
      || situation === 'awaiting_payment'
    )
  }
  if (filter === 'evolution') return situation === 'evolution_pending'
  return situation === 'in_treatment'
}
