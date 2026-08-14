import { addMinutes, differenceInMinutes, format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function firstNameFromPatientName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName
}

/** Altura em px de cada hora na grade da agenda. */
export const AGENDA_HOUR_HEIGHT_PX = 72

/** Início e fim visíveis do dia (horário local). */
export const AGENDA_DAY_START_HOUR = 5
export const AGENDA_DAY_END_HOUR = 22

/** Espaço no topo da grade para labels de hora não serem cortados. */
export const AGENDA_TIMELINE_TOP_INSET_PX = 10

/** Inset no topo da grade semanal — espaço para o rótulo 07:00 não ser cortado. */
export const AGENDA_WEEK_TIMELINE_TOP_INSET_PX = 12

/** Altura em px de cada hora na grade semanal mobile (mais compacta, estilo Google Agenda). */
export const AGENDA_WEEK_MOBILE_HOUR_HEIGHT_PX = 48

/** Altura em px de cada hora na grade semanal (mais compacta). */
export const AGENDA_WEEK_HOUR_HEIGHT_PX = 56

function resolveTopInsetPx(hourHeightPx: number): number {
  return hourHeightPx === AGENDA_WEEK_HOUR_HEIGHT_PX
    ? AGENDA_WEEK_TIMELINE_TOP_INSET_PX
    : AGENDA_TIMELINE_TOP_INSET_PX
}

export function hourMarkerTopPx(
  hour: number,
  dayStartHour: number,
  hourHeightPx = AGENDA_HOUR_HEIGHT_PX,
): number {
  return resolveTopInsetPx(hourHeightPx) + (hour - dayStartHour) * hourHeightPx
}

/** Duração padrão de sessão domiciliar (minutos). */
export const DEFAULT_SESSION_DURATION_MIN = 50

export function agendaDayBounds(date: Date) {
  const start = new Date(date)
  start.setHours(AGENDA_DAY_START_HOUR, 0, 0, 0)
  const end = new Date(date)
  end.setHours(AGENDA_DAY_END_HOUR, 0, 0, 0)
  return { start, end }
}

export function buildHourMarkers(startHour: number, endHour: number): number[] {
  const hours: number[] = []
  for (let h = startHour; h <= endHour; h += 1) hours.push(h)
  return hours
}

export function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`
}

export function resolveSessionTimes(
  scheduledAt: string | null,
  checkInAt: string | null,
  checkOutAt: string | null,
): { start: Date; end: Date } | null {
  const ref = scheduledAt ?? checkInAt
  if (!ref) return null

  const start = parseISO(ref)
  if (checkInAt && checkOutAt) {
    return { start: parseISO(checkInAt), end: parseISO(checkOutAt) }
  }
  if (checkOutAt) {
    return { start, end: parseISO(checkOutAt) }
  }
  return { start, end: addMinutes(start, DEFAULT_SESSION_DURATION_MIN) }
}

export function sessionBlockLayout(
  start: Date,
  end: Date,
  dayStartHour: number,
  hourHeightPx = AGENDA_HOUR_HEIGHT_PX,
): { topPx: number; heightPx: number } {
  const dayAnchor = new Date(start)
  dayAnchor.setHours(dayStartHour, 0, 0, 0)

  const topMinutes = Math.max(0, differenceInMinutes(start, dayAnchor))
  const durationMinutes = Math.max(30, differenceInMinutes(end, start))

  return {
    topPx: resolveTopInsetPx(hourHeightPx) + (topMinutes / 60) * hourHeightPx,
    heightPx: (durationMinutes / 60) * hourHeightPx,
  }
}

/** Hora da grade em que a sessão é exibida (célula horária). */
export function sessionHourSlot(start: Date, dayStartHour: number): number {
  const startHourFrac = start.getHours() + start.getMinutes() / 60
  return Math.max(Math.floor(startHourFrac), dayStartHour)
}

/** Grade da agenda: uma célula horária por sessão (hora do agendamento). */
export function sessionHourCellLayout(
  start: Date,
  dayStartHour: number,
  hourHeightPx = AGENDA_HOUR_HEIGHT_PX,
): { topPx: number; heightPx: number } {
  const snappedStartHour = sessionHourSlot(start, dayStartHour)

  return {
    topPx: hourMarkerTopPx(snappedStartHour, dayStartHour, hourHeightPx),
    heightPx: hourHeightPx,
  }
}

export type SessionColumnLayout = {
  columnIndex: number
  columnCount: number
}

/** Divide sessões no mesmo slot horário em colunas lado a lado. */
export function buildSessionColumnLayout<T extends { id: string; start: Date; scheduledAt?: string | null }>(
  sessions: T[],
  dayStartHour: number,
): Map<string, SessionColumnLayout> {
  const groups = new Map<number, T[]>()

  for (const session of sessions) {
    const start = session.scheduledAt ? parseISO(session.scheduledAt) : session.start
    const slot = sessionHourSlot(start, dayStartHour)
    const group = groups.get(slot)
    if (group) group.push(session)
    else groups.set(slot, [session])
  }

  const layout = new Map<string, SessionColumnLayout>()
  for (const group of groups.values()) {
    group.sort((a, b) => {
      const aStart = a.scheduledAt ? parseISO(a.scheduledAt) : a.start
      const bStart = b.scheduledAt ? parseISO(b.scheduledAt) : b.start
      return aStart.getTime() - bStart.getTime()
    })

    const columnCount = group.length
    group.forEach((session, columnIndex) => {
      layout.set(session.id, { columnIndex, columnCount })
    })
  }

  return layout
}

export function sessionColumnPositionStyle(
  columnIndex: number,
  columnCount: number,
): { left: number | string; right?: number | string; width?: string } {
  if (columnCount <= 1) return { left: 0, right: 0 }

  const widthPct = 100 / columnCount
  return {
    left: `${columnIndex * widthPct}%`,
    width: `${widthPct}%`,
    right: 'auto',
  }
}

export function formatSessionTimeRange(start: Date, end: Date): string {
  return `${format(start, 'HH:mm', { locale: ptBR })} – ${format(end, 'HH:mm', { locale: ptBR })}`
}

export function timelineTotalHeightPx(
  hourHeightPx = AGENDA_HOUR_HEIGHT_PX,
): number {
  return resolveTopInsetPx(hourHeightPx) + (AGENDA_DAY_END_HOUR - AGENDA_DAY_START_HOUR) * hourHeightPx
}

/** Garante altura suficiente para sessões que terminam após o fim da grade. */
export function resolveTimelineContentHeight(
  sessions: Array<{ start: Date; end: Date; scheduledAt?: string | null }>,
  hourHeightPx = AGENDA_HOUR_HEIGHT_PX,
): number {
  const base = timelineTotalHeightPx(hourHeightPx)
  let maxBottom = base

  for (const session of sessions) {
    const { topPx, heightPx } =
      session.scheduledAt != null
        ? sessionHourCellLayout(parseISO(session.scheduledAt), AGENDA_DAY_START_HOUR, hourHeightPx)
        : sessionBlockLayout(session.start, session.end, AGENDA_DAY_START_HOUR, hourHeightPx)
    maxBottom = Math.max(maxBottom, topPx + heightPx + 12)
  }

  return maxBottom
}

export function nowIndicatorTopPx(
  now: Date,
  dayStartHour: number,
  dayEndHour: number,
  hourHeightPx = AGENDA_HOUR_HEIGHT_PX,
): number | null {
  const hour = now.getHours() + now.getMinutes() / 60
  if (hour < dayStartHour || hour > dayEndHour) return null
  return resolveTopInsetPx(hourHeightPx) + (hour - dayStartHour) * hourHeightPx
}
