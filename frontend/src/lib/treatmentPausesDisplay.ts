export interface TreatmentPauseListRow {
  id: string
  patient_id: string
  paused_at: string
  resumed_at?: string | null
  reason?: string | null
  created_at: string
  created_by?: string | null
  patients?: { full_name?: string; care_status?: string } | null
  creator?: { full_name?: string } | null
}

export function isTreatmentPauseActive(row: Pick<TreatmentPauseListRow, 'resumed_at'>): boolean {
  return row.resumed_at == null
}

export function getTreatmentPauseStatusLabel(row: Pick<TreatmentPauseListRow, 'resumed_at'>): string {
  return isTreatmentPauseActive(row) ? 'Em pausa' : 'Retomado'
}

export function formatPauseDuration(pausedAt: string, resumedAt?: string | null): string {
  const start = new Date(pausedAt)
  const end = resumedAt ? new Date(resumedAt) : new Date()
  const ms = end.getTime() - start.getTime()
  if (Number.isNaN(ms) || ms < 0) return '—'

  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  if (days >= 1) return `${days} dia${days === 1 ? '' : 's'}`

  const hours = Math.floor(ms / (1000 * 60 * 60))
  if (hours >= 1) return `${hours} h`

  return 'Menos de 1 h'
}

export function getTreatmentPauseSearchText(row: TreatmentPauseListRow): string {
  return [
    row.patients?.full_name,
    row.reason,
    row.creator?.full_name,
    getTreatmentPauseStatusLabel(row),
  ]
    .filter(Boolean)
    .join(' ')
}
