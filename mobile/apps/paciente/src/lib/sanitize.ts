export function trimText(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

export function sanitizeCpf(value: string): string {
  return digitsOnly(value).slice(0, 11)
}
