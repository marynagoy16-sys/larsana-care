import {
  addDays,
  format,
  isSameDay,
  isWithinInterval,
  startOfDay,
  startOfWeek,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { AgendaSessionItem } from '@/services/ppAgenda'

/** Semana começa na segunda-feira (padrão BR). */
export const AGENDA_WEEK_STARTS_ON = 1 as const

export type AgendaViewMode = 'day' | 'week'

/** Dias úteis exibidos na grade semanal (seg–sex). */
export const AGENDA_WEEK_WORK_DAYS = 5

export function getWeekRange(anchor: Date): { start: Date; end: Date; days: Date[] } {
  const start = startOfWeek(anchor, { locale: ptBR, weekStartsOn: AGENDA_WEEK_STARTS_ON })
  const days = Array.from({ length: AGENDA_WEEK_WORK_DAYS }, (_, i) => addDays(start, i))
  const end = days[days.length - 1]!
  return { start, end, days }
}

export function formatAgendaWeekTitle(weekStart: Date, weekEnd: Date): string {
  const sameMonth =
    weekStart.getMonth() === weekEnd.getMonth() &&
    weekStart.getFullYear() === weekEnd.getFullYear()

  const label = sameMonth
    ? `${format(weekStart, 'd', { locale: ptBR })} – ${format(weekEnd, "d 'de' MMMM", { locale: ptBR })}`
    : `${format(weekStart, "d 'de' MMM", { locale: ptBR })} – ${format(weekEnd, "d 'de' MMM", { locale: ptBR })}`

  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function formatAgendaWeekTitleShort(weekStart: Date, weekEnd: Date): string {
  const sameMonth =
    weekStart.getMonth() === weekEnd.getMonth() &&
    weekStart.getFullYear() === weekEnd.getFullYear()

  if (sameMonth) {
    return `${format(weekStart, 'd', { locale: ptBR })}–${format(weekEnd, 'd MMM', { locale: ptBR })}`
  }
  return `${format(weekStart, 'd/M', { locale: ptBR })}–${format(weekEnd, 'd/M', { locale: ptBR })}`
}

export function formatWeekDayHeader(date: Date): { weekday: string; day: string } {
  const weekday = format(date, 'EEEE', { locale: ptBR })
  return {
    weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
    day: format(date, 'dd/MM', { locale: ptBR }),
  }
}

/** Rótulo compacto para o seletor mobile (letra do dia + número). */
export function formatMobileDayStripLabel(date: Date): { weekdayLetter: string; day: string } {
  return {
    weekdayLetter: format(date, 'EEEEE', { locale: ptBR }).replace('.', '').toUpperCase(),
    day: format(date, 'd', { locale: ptBR }),
  }
}

export function formatAgendaMobileMonthTitle(date: Date): string {
  const label = format(date, 'MMMM yyyy', { locale: ptBR })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** Faixa horizontal mobile: semanas completas (seg–dom) para scroll. */
export function getMobileDayStripRange(
  anchor: Date,
  weeksBefore = 4,
  weeksAfter = 4,
): { start: Date; end: Date; days: Date[] } {
  const anchorWeekStart = startOfWeek(anchor, { locale: ptBR, weekStartsOn: AGENDA_WEEK_STARTS_ON })
  const start = addDays(anchorWeekStart, -weeksBefore * 7)
  const totalDays = (weeksBefore + weeksAfter + 1) * 7
  const days = Array.from({ length: totalDays }, (_, i) => addDays(start, i))
  const end = days[days.length - 1]!
  return { start, end, days }
}

export function toAgendaDayKey(date: Date): string {
  return format(startOfDay(date), 'yyyy-MM-dd')
}

export function groupSessionsByDay(
  sessions: AgendaSessionItem[],
  days: Date[],
): Record<string, AgendaSessionItem[]> {
  const grouped: Record<string, AgendaSessionItem[]> = {}
  for (const day of days) {
    grouped[toAgendaDayKey(day)] = []
  }
  for (const session of sessions) {
    const key = toAgendaDayKey(session.start)
    if (grouped[key]) grouped[key].push(session)
  }
  return grouped
}

export function isDateInWeek(date: Date, weekStart: Date, weekEnd: Date): boolean {
  return isWithinInterval(startOfDay(date), {
    start: startOfDay(weekStart),
    end: startOfDay(weekEnd),
  })
}

export function isCurrentWeek(weekStart: Date, weekEnd: Date): boolean {
  return isDateInWeek(new Date(), weekStart, weekEnd)
}

export function isTodayDate(date: Date): boolean {
  return isSameDay(date, new Date())
}
