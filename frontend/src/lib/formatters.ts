import { format, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { digitsOnly } from '@/lib/sanitize'

export function formatCpf(value: string | null | undefined): string {
  const d = digitsOnly(value ?? '')
  if (d.length !== 11) return value ?? ''
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatCnpj(value: string | null | undefined): string {
  const d = digitsOnly(value ?? '')
  if (d.length !== 14) return value ?? ''
  return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

export function formatCpfCnpj(value: string | null | undefined): string {
  const d = digitsOnly(value ?? '')
  if (d.length === 11) return formatCpf(d)
  if (d.length === 14) return formatCnpj(d)
  return value ?? ''
}

export function formatPhone(value: string | null | undefined): string {
  const d = digitsOnly(value ?? '')
  if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  return value ?? ''
}

export function formatCep(value: string | null | undefined): string {
  const d = digitsOnly(value ?? '')
  if (d.length !== 8) return value ?? ''
  return d.replace(/(\d{5})(\d{3})/, '$1-$2')
}

export function formatCurrency(cents: number | null | undefined): string {
  const amount = (cents ?? 0) / 100
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = value.includes('T') ? parseISO(value) : parseISO(`${value}T12:00:00`)
  if (!isValid(date)) return value
  return format(date, 'dd/MM/yyyy', { locale: ptBR })
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = parseISO(value)
  if (!isValid(date)) return value
  return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR })
}

export function maskCpfInput(value: string): string {
  const d = digitsOnly(value).slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function maskCpfCnpjInput(value: string): string {
  const d = digitsOnly(value).slice(0, 14)
  if (d.length <= 11) return maskCpfInput(d)
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

export function maskPhoneInput(value: string): string {
  const d = digitsOnly(value).slice(0, 11)
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  }
  return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

export function maskCepInput(value: string): string {
  const d = digitsOnly(value).slice(0, 8)
  return d.replace(/(\d{5})(\d)/, '$1-$2')
}
