import {
  patientLevelLabels,
  proposedSessionCountLabels,
} from '@/constants/labels'
import { businessDaysRemainingUntil, resolveFamilyResponseDeadline } from '@/lib/businessDays'
import { formatDate } from '@/lib/formatters'

export type AssessmentListDisplayInput = {
  status: string
  proposed_session_count?: number | null
  proposed_patient_level?: string | null
  proposed_weekly_frequency?: number | null
  proposal_sent_at?: string | null
  response_deadline_at?: string | null
  family_response?: string | null
}

function compactSessionCount(count: number): string {
  const label = proposedSessionCountLabels[count]
  if (label) return label.replace(' sessões', ' sess')
  return `${count} sess`
}

function compactPatientLevel(level: string): string {
  if (level === 'N1' || level === 'N2' || level === 'N3') return level
  if (level === 'VALOR_SOCIAL') return 'VS'
  const full = patientLevelLabels[level]
  if (full?.startsWith('Nível ')) return `N${full.slice(6)}`
  return level
}

export function formatAssessmentProposalSummary(row: AssessmentListDisplayInput): string {
  const parts: string[] = []
  if (row.proposed_session_count != null) {
    parts.push(compactSessionCount(row.proposed_session_count))
  }
  if (row.proposed_patient_level) {
    parts.push(compactPatientLevel(row.proposed_patient_level))
  }
  if (row.proposed_weekly_frequency != null) {
    parts.push(`${row.proposed_weekly_frequency}x/sem`)
  }
  return parts.length > 0 ? parts.join(' · ') : '—'
}

export function formatFamilyDeadline(row: AssessmentListDisplayInput): string {
  if (row.status === 'avaliacao_feita') return '—'

  if (!row.response_deadline_at && !row.proposal_sent_at) {
    return 'Após envio'
  }

  const deadline = resolveFamilyResponseDeadline({
    responseDeadlineAt: row.response_deadline_at,
    proposalSentAt: row.proposal_sent_at,
  })
  if (!deadline) return 'Após envio'

  const isPending = row.status === 'proposta_enviada' || row.status === 'em_analise'
  if (isPending) {
    const remaining = businessDaysRemainingUntil(deadline)
    if (remaining <= 0) return formatDate(deadline.toISOString())
    const dayWord = remaining === 1 ? 'dia útil' : 'dias úteis'
    return `${remaining} ${dayWord}`
  }

  return formatDate(deadline.toISOString())
}

export function formatFamilyResponse(response: string | null | undefined): string {
  if (!response) return '—'
  if (response === 'NAO') return 'NÃO'
  return response
}

export function buildAssessmentWorkflowStats(rows: AssessmentListDisplayInput[]) {
  const awaitingSend = rows.filter((r) => r.status === 'avaliacao_feita').length
  const inReview = rows.filter(
    (r) => r.status === 'em_analise' || r.status === 'proposta_enviada',
  ).length
  const answered = rows.filter(
    (r) => r.status === 'respondida_sim' || r.status === 'respondida_nao',
  ).length
  const expired = rows.filter((r) => r.status === 'vencida').length

  return { total: rows.length, awaitingSend, inReview, answered, expired }
}
