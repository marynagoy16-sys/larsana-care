import { differenceInYears, parseISO, isValid } from 'date-fns'
import { patientSexLabels } from '@/constants/labels'

export function formatPatientAbbreviation(fullName: string | null | undefined): string {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '—'
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`
}

export function formatPatientAge(birthDate: string | null | undefined): string {
  if (!birthDate) return '—'
  const date = birthDate.includes('T') ? parseISO(birthDate) : parseISO(`${birthDate}T12:00:00`)
  if (!isValid(date)) return '—'
  const age = differenceInYears(new Date(), date)
  return age >= 0 ? String(age) : '—'
}

export function formatPatientSex(sex: string | null | undefined): string {
  if (!sex) return '—'
  return patientSexLabels[sex] ?? sex
}

export function resolveDiagnosticHypothesis(
  diagnosticHypothesis: string | null | undefined,
  clinicalSummary: string | null | undefined,
): string {
  const hypothesis = diagnosticHypothesis?.trim()
  if (hypothesis) return hypothesis
  const summary = clinicalSummary?.trim()
  if (!summary) return '—'
  const firstLine = summary.split('\n').find((line) => line.trim())?.trim() ?? summary
  return firstLine.length > 80 ? `${firstLine.slice(0, 77)}…` : firstLine
}

export function resolveAttendancePeriod(
  attendancePeriod: string | null | undefined,
  suggestedWeeklyFrequency: number | null | undefined,
): string {
  const period = attendancePeriod?.trim()
  if (period) return period
  if (suggestedWeeklyFrequency != null && suggestedWeeklyFrequency > 0) {
    const sessions = Number.isInteger(suggestedWeeklyFrequency)
      ? String(suggestedWeeklyFrequency)
      : suggestedWeeklyFrequency.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
    return `${sessions}x/semana`
  }
  return '—'
}

export function resolveLatestAssessmentStatus(
  assessments: Array<{ status: string; created_at: string }> | null | undefined,
): string | null {
  if (!assessments?.length) return null
  return [...assessments].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )[0]?.status ?? null
}
