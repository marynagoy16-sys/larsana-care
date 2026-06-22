export function trimText(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

export function sanitizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function sanitizeCpf(value: string): string {
  return digitsOnly(value).slice(0, 11)
}

export function sanitizeCnpj(value: string): string {
  return digitsOnly(value).slice(0, 14)
}

export function sanitizePhone(value: string): string {
  return digitsOnly(value).slice(0, 13)
}

export function sanitizeCep(value: string): string {
  return digitsOnly(value).slice(0, 8)
}

/** Nome seguro para chaves do Supabase Storage (ASCII, sem espaços/acentos). */
export function sanitizeStorageFileName(fileName: string): string {
  const trimmed = fileName.trim()
  const lastDot = trimmed.lastIndexOf('.')
  const base = lastDot > 0 ? trimmed.slice(0, lastDot) : trimmed
  const ext = lastDot > 0 ? trimmed.slice(lastDot).toLowerCase() : ''

  const normalized = base
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 180)

  const safeExt = ext.replace(/[^a-z0-9.]/g, '')
  const safeBase = normalized || 'arquivo'

  return `${safeBase}${safeExt}`
}

import DOMPurify from 'dompurify'

const RICH_TEXT_TAGS = ['p', 'ul', 'ol', 'li', 'strong', 'em', 'br']

export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: RICH_TEXT_TAGS })
}
