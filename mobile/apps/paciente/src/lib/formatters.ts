export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

export function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(iso))
}

export function daysUntil(dateIso: string): number {
  const target = new Date(dateIso)
  const now = new Date()
  target.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function compactSessionCount(count: number): string {
  const labels: Record<number, string> = {
    4: '4 sessões',
    8: '8 sessões',
    12: '12 sessões',
    16: '16 sessões',
    20: '20 sessões',
    24: '24 sessões',
  }
  const label = labels[count]
  if (label) return label.replace(' sessões', ' sess')
  return `${count} sess`
}

function compactPatientLevel(level: string): string {
  if (level === 'N1' || level === 'N2' || level === 'N3') return level
  if (level === 'VALOR_SOCIAL') return 'VS'
  const fullLabels: Record<string, string> = {
    N1: 'Nível 1',
    N2: 'Nível 2',
    N3: 'Nível 3',
    VALOR_SOCIAL: 'Valor social',
  }
  const full = fullLabels[level]
  if (full?.startsWith('Nível ')) return `N${full.slice(6)}`
  return level
}

export function formatAssessmentProposalSummary(row: {
  proposed_session_count?: number | null
  proposed_patient_level?: string | null
  proposed_weekly_frequency?: number | null
}): string {
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

export function formatFamilyDeadline(row: {
  status: string
  response_deadline_at?: string | null
  proposal_sent_at?: string | null
}): string {
  if (row.status === 'avaliacao_feita') return '—'

  if (!row.response_deadline_at && !row.proposal_sent_at) {
    return 'Após envio'
  }

  const deadline = row.response_deadline_at
    ? new Date(row.response_deadline_at)
    : row.proposal_sent_at
      ? new Date(new Date(row.proposal_sent_at).getTime() + 5 * 24 * 60 * 60 * 1000)
      : null

  if (!deadline) return 'Após envio'

  const isPending = row.status === 'proposta_enviada' || row.status === 'em_analise'
  if (isPending) {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    deadline.setHours(0, 0, 0, 0)
    const diff = deadline.getTime() - now.getTime()
    const remaining = Math.ceil(diff / (1000 * 60 * 60 * 24))
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

export function buildAssessmentWorkflowStats(
  rows: { status: string }[]
): { total: number; awaitingSend: number; inReview: number; answered: number } {
  const awaitingSend = rows.filter((r) => r.status === 'avaliacao_feita').length
  const inReview = rows.filter(
    (r) => r.status === 'em_analise' || r.status === 'proposta_enviada'
  ).length
  const answered = rows.filter(
    (r) => r.status === 'respondida_sim' || r.status === 'respondida_nao'
  ).length
  return { total: rows.length, awaitingSend, inReview, answered }
}
