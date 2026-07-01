import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function toAgendaDayKey(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function formatAgendaDayTitle(date: Date): string {
  const label = format(date, "EEEE, d 'de' MMMM", { locale: ptBR })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function formatAgendaDayTitleShort(date: Date): string {
  const label = format(date, "EEE, d 'de' MMM", { locale: ptBR })
  return label.charAt(0).toUpperCase() + label.slice(1)
}
