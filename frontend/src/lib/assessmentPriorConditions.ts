export type PriorConditionDetail = {
  present: boolean
  details: string | null
}

export type AssessmentPriorConditions = {
  hypertension: boolean
  diabetes: boolean
  high_cholesterol: boolean
  cardiac_alteration: PriorConditionDetail
  neurological_alteration: PriorConditionDetail
  pulmonary_alteration: PriorConditionDetail
}

export type AssessmentSurgery = {
  name: string
  year: number
}

export function defaultPriorConditions(): AssessmentPriorConditions {
  return {
    hypertension: false,
    diabetes: false,
    high_cholesterol: false,
    cardiac_alteration: { present: false, details: null },
    neurological_alteration: { present: false, details: null },
    pulmonary_alteration: { present: false, details: null },
  }
}

export function parsePriorConditions(raw: unknown): AssessmentPriorConditions {
  const base = defaultPriorConditions()
  if (!raw || typeof raw !== 'object') return base
  const o = raw as Record<string, unknown>
  const parseDetail = (key: keyof AssessmentPriorConditions): PriorConditionDetail => {
    const v = o[key]
    if (v && typeof v === 'object' && 'present' in (v as object)) {
      const d = v as PriorConditionDetail
      return { present: Boolean(d.present), details: d.details?.trim() || null }
    }
    return { present: false, details: null }
  }
  return {
    hypertension: Boolean(o.hypertension),
    diabetes: Boolean(o.diabetes),
    high_cholesterol: Boolean(o.high_cholesterol),
    cardiac_alteration: parseDetail('cardiac_alteration'),
    neurological_alteration: parseDetail('neurological_alteration'),
    pulmonary_alteration: parseDetail('pulmonary_alteration'),
  }
}

export function parseSurgeries(raw: unknown): AssessmentSurgery[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((item): item is { name: string; year: number } =>
      item != null && typeof item === 'object' && typeof (item as { name?: string }).name === 'string',
    )
    .map((item) => ({
      name: item.name.trim(),
      year: Number(item.year) || new Date().getFullYear(),
    }))
    .filter((s) => s.name.length > 0)
}

export function formatPriorConditionsSummary(conditions: AssessmentPriorConditions): string {
  const lines: string[] = []
  if (conditions.hypertension) lines.push('Hipertensão')
  if (conditions.diabetes) lines.push('Diabetes')
  if (conditions.high_cholesterol) lines.push('Colesterol alto')
  if (conditions.cardiac_alteration.present) {
    lines.push(`Alteração cardíaca: ${conditions.cardiac_alteration.details ?? 'sim'}`)
  }
  if (conditions.neurological_alteration.present) {
    lines.push(`Alteração neurológica: ${conditions.neurological_alteration.details ?? 'sim'}`)
  }
  if (conditions.pulmonary_alteration.present) {
    lines.push(`Alteração pulmonar: ${conditions.pulmonary_alteration.details ?? 'sim'}`)
  }
  return lines.length > 0 ? lines.join('\n') : '—'
}
