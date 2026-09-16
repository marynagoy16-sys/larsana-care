/** Normalização de planilhas legadas (Excel/CSV) antes do bulk import. */

export type ImportKind = 'patients' | 'professionals'

const SCIENTIFIC_RE = /^[\d,.]+[eE][+-]?\d+$/

export function normalizeDigits(value: unknown, maxLength?: number): string {
  if (value === null || value === undefined) return ''
  let raw = String(value).trim()
  if (!raw) return ''

  if (SCIENTIFIC_RE.test(raw)) {
    const num = Number(raw)
    if (!Number.isFinite(num)) return ''
    raw = String(Math.trunc(num))
  }

  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  return maxLength ? digits.slice(0, maxLength) : digits
}

export function normalizeCpf(value: unknown): string {
  return normalizeDigits(value, 11)
}

export function normalizePhone(value: unknown): string {
  return normalizeDigits(value, 11)
}

export function normalizeCnpjOrCpf(value: unknown): string {
  const digits = normalizeDigits(value)
  if (digits.length <= 11) return digits.slice(0, 11)
  return digits.slice(0, 14)
}

export function excelSerialToIsoDate(serial: number): string | null {
  if (!Number.isFinite(serial) || serial <= 0) return null
  const utcDays = Math.floor(serial - 25569)
  const ms = utcDays * 86400 * 1000
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

export function normalizeBirthDate(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return excelSerialToIsoDate(value) ?? ''
  }

  const raw = String(value).trim()
  if (!raw) return ''

  if (/^\d+(\.\d+)?$/.test(raw)) {
    const asNum = Number(raw)
    if (asNum > 1000) {
      const iso = excelSerialToIsoDate(asNum)
      if (iso) return iso
    }
  }

  const brMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (brMatch) {
    const [, d, m, y] = brMatch
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10)
  return raw
}

export function normalizePatientLevel(value: unknown): string {
  const raw = String(value ?? '').trim()
  if (!raw) return 'N1'
  const upper = raw.toUpperCase()
  if (/^N[123]$/.test(upper)) return upper
  const match = upper.match(/N[ÍI]VEL\s*(\d)/)
  if (match) return `N${match[1]}`
  if (upper === '1') return 'N1'
  if (upper === '2') return 'N2'
  if (upper === '3') return 'N3'
  return raw
}

export function normalizeRegionCode(value: unknown): string {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  const upper = raw.toUpperCase()
  const regionMatch = upper.match(/REGI[ÃA]O\s*([ABC])/i)
  if (regionMatch) return regionMatch[1]
  if (/^[ABC]$/.test(upper)) return upper
  return raw
}

export function normalizePatente(value: unknown): string {
  const raw = String(value ?? '').trim()
  if (!raw) return 'BRONZE'
  return raw.toUpperCase()
}

export function normalizeBoolean(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  const raw = String(value).trim().toLowerCase()
  if (['1', 'true', 'sim', 's', 'yes', 'y'].includes(raw)) return 'true'
  if (['0', 'false', 'não', 'nao', 'n', 'no'].includes(raw)) return 'false'
  return raw
}

export function fixPatientColumnHeuristic(row: Record<string, string>): Record<string, string> {
  const next = { ...row }
  const asaas = next.asaas_customer_id?.trim() ?? ''
  const clinical = next.clinical_summary?.trim() ?? ''

  if (asaas.length > 50 && !clinical) {
    next.clinical_summary = asaas
    next.asaas_customer_id = ''
  }

  if (asaas && !/^cus_/.test(asaas) && asaas.length > 20 && !clinical) {
    next.clinical_summary = asaas
    next.asaas_customer_id = ''
  }

  return next
}

export function normalizePatientRow(row: Record<string, unknown>): Record<string, string> {
  let normalized: Record<string, string> = {}
  for (const [key, value] of Object.entries(row)) {
    normalized[key.trim()] = value === null || value === undefined ? '' : String(value).trim()
  }

  normalized = fixPatientColumnHeuristic(normalized)

  normalized.cpf = normalizeCpf(normalized.cpf)
  normalized.birth_date = normalizeBirthDate(normalized.birth_date)
  normalized.patient_level = normalizePatientLevel(normalized.patient_level)
  normalized.region_code = normalizeRegionCode(normalized.region_code)

  return normalized
}

export function normalizeProfessionalRow(row: Record<string, unknown>): Record<string, string> {
  const normalized: Record<string, string> = {}
  for (const [key, value] of Object.entries(row)) {
    normalized[key.trim()] = value === null || value === undefined ? '' : String(value).trim()
  }

  normalized.cpf_cnpj = normalizeCnpjOrCpf(normalized.cpf_cnpj)
  normalized.phone = normalizePhone(normalized.phone)
  normalized.patente = normalizePatente(normalized.patente)
  normalized.email = normalized.email.toLowerCase()

  if (normalized.is_active !== undefined && normalized.is_active !== '') {
    normalized.is_active = normalizeBoolean(normalized.is_active)
  }
  if (normalized.points_grandfathered !== undefined && normalized.points_grandfathered !== '') {
    normalized.points_grandfathered = normalizeBoolean(normalized.points_grandfathered)
  }

  return normalized
}

export function normalizeImportRows(
  kind: ImportKind,
  rows: Record<string, unknown>[],
): Record<string, string>[] {
  const normalizer = kind === 'patients' ? normalizePatientRow : normalizeProfessionalRow
  return rows.map(normalizer)
}

export function previewImportRows(rows: Record<string, string>[], limit = 5): Record<string, string>[] {
  return rows.slice(0, limit)
}
