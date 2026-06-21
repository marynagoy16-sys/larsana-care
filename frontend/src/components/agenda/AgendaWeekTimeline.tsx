import { useCallback, useMemo, useRef, type RefObject } from 'react'
import {
  AGENDA_DAY_END_HOUR,
  AGENDA_DAY_START_HOUR,
  AGENDA_WEEK_HOUR_HEIGHT_PX,
  buildHourMarkers,
  buildSessionColumnLayout,
  formatHourLabel,
  hourMarkerTopPx,
  resolveTimelineContentHeight,
} from '@/lib/agendaTimeline'
import {
  formatWeekDayHeader,
  getWeekRange,
  groupSessionsByDay,
  isTodayDate,
  toAgendaDayKey,
} from '@/lib/agendaWeek'
import { cn } from '@/lib/utils'
import type { AgendaSessionItem } from '@/services/ppAgenda'
import { AgendaWeekSessionBlock } from './AgendaWeekSessionBlock'

const WEEK_GRID_MIN_WIDTH_PX = 520

interface AgendaWeekTimelineProps {
  anchorDate: Date
  sessions: AgendaSessionItem[]
  onSelectDay?: (day: Date) => void
  scrollContainerRef?: RefObject<HTMLDivElement | null>
  className?: string
}

function WeekDayHeaderRow({
  days,
  onSelectDay,
}: {
  days: Date[]
  onSelectDay?: (day: Date) => void
}) {
  return (
    <div
      className="flex gap-0 border-b border-border bg-background py-1"
      style={{ minWidth: WEEK_GRID_MIN_WIDTH_PX }}
    >
      <div className="flex w-10 shrink-0 flex-col items-center justify-center gap-0.5 px-0.5 sm:w-12">
        <span className="text-[9px] font-medium uppercase leading-none tracking-wide text-muted-foreground">
          Hora
        </span>
        <span className="h-6 w-6 shrink-0" aria-hidden />
      </div>
      {days.map((day) => {
        const { weekday, day: dayLabel } = formatWeekDayHeader(day)
        const today = isTodayDate(day)
        return (
          <div key={toAgendaDayKey(day)} className="min-w-0 flex-1 px-0.5">
            <button
              type="button"
              onClick={() => onSelectDay?.(day)}
              className={cn(
                'mx-auto flex w-full flex-col items-center gap-0.5 rounded-md px-0.5 py-0.5 transition-colors',
                onSelectDay && 'hover:bg-muted/60',
                today && 'border border-primary/30 bg-primary/10',
              )}
              disabled={!onSelectDay}
            >
              <span className="text-center text-[9px] font-medium leading-tight text-muted-foreground sm:text-[10px]">
                {weekday}
              </span>
              <span
                className={cn(
                  'flex min-h-6 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums leading-none sm:text-xs',
                  today ? 'bg-primary text-primary-foreground' : 'text-foreground',
                )}
              >
                {dayLabel}
              </span>
            </button>
          </div>
        )
      })}
    </div>
  )
}

export function AgendaWeekTimeline({
  anchorDate,
  sessions,
  onSelectDay,
  scrollContainerRef,
  className,
}: AgendaWeekTimelineProps) {
  const headerScrollRef = useRef<HTMLDivElement>(null)
  const gridScrollRef = useRef<HTMLDivElement>(null)
  const syncingScroll = useRef(false)

  const setGridScrollRef = useCallback(
    (node: HTMLDivElement | null) => {
      gridScrollRef.current = node
      if (scrollContainerRef) {
        scrollContainerRef.current = node
      }
    },
    [scrollContainerRef],
  )

  const syncHorizontalScroll = useCallback((source: 'header' | 'grid', scrollLeft: number) => {
    if (syncingScroll.current) return
    syncingScroll.current = true
    const target = source === 'header' ? gridScrollRef.current : headerScrollRef.current
    if (target && Math.abs(target.scrollLeft - scrollLeft) > 1) {
      target.scrollLeft = scrollLeft
    }
    syncingScroll.current = false
  }, [])

  const { days } = useMemo(() => getWeekRange(anchorDate), [anchorDate])
  const hours = useMemo(
    () => buildHourMarkers(AGENDA_DAY_START_HOUR, AGENDA_DAY_END_HOUR),
    [],
  )
  const totalHeight = useMemo(
    () => resolveTimelineContentHeight(sessions, AGENDA_WEEK_HOUR_HEIGHT_PX),
    [sessions],
  )
  const sessionsByDay = useMemo(
    () => groupSessionsByDay(sessions, days),
    [sessions, days],
  )
  const columnLayoutsByDay = useMemo(() => {
    const layouts: Record<string, ReturnType<typeof buildSessionColumnLayout>> = {}
    for (const day of days) {
      const dayKey = toAgendaDayKey(day)
      layouts[dayKey] = buildSessionColumnLayout(
        sessionsByDay[dayKey] ?? [],
        AGENDA_DAY_START_HOUR,
      )
    }
    return layouts
  }, [days, sessionsByDay])

  return (
    <div className={cn('flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden', className)}>
      {/* Cabeçalho fixo — scroll horizontal sincronizado com a grade */}
      <div
        ref={headerScrollRef}
        className="shrink-0 overflow-x-auto scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={(e) => syncHorizontalScroll('header', e.currentTarget.scrollLeft)}
      >
        <WeekDayHeaderRow days={days} onSelectDay={onSelectDay} />
      </div>

      {/* Grade — única área com scroll vertical */}
      <div
        ref={setGridScrollRef}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-auto scrollbar-sidebar"
        onScroll={(e) => syncHorizontalScroll('grid', e.currentTarget.scrollLeft)}
      >
        <div className="flex gap-0" style={{ minWidth: WEEK_GRID_MIN_WIDTH_PX, minHeight: totalHeight }}>
          <div className="relative w-10 shrink-0 sm:w-12" style={{ height: totalHeight }}>
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute right-0 w-full -translate-y-1/2 text-right leading-none pr-1"
                style={{
                  top: hourMarkerTopPx(hour, AGENDA_DAY_START_HOUR, AGENDA_WEEK_HOUR_HEIGHT_PX),
                }}
              >
                <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                  {formatHourLabel(hour)}
                </span>
              </div>
            ))}
          </div>

          {days.map((day) => {
            const dayKey = toAgendaDayKey(day)
            const daySessions = sessionsByDay[dayKey] ?? []
            const today = isTodayDate(day)

            return (
              <div
                key={dayKey}
                className={cn(
                  'relative min-w-0 flex-1 border-l border-border/70',
                  today && 'bg-primary/[0.03]',
                )}
                style={{ height: totalHeight }}
              >
                {hours
                  .filter((hour) => hour > AGENDA_DAY_START_HOUR)
                  .map((hour) => (
                  <div
                    key={hour}
                    className="pointer-events-none absolute left-0 right-0 z-0 border-t border-border/50"
                    style={{
                      top: hourMarkerTopPx(hour, AGENDA_DAY_START_HOUR, AGENDA_WEEK_HOUR_HEIGHT_PX),
                    }}
                  />
                ))}

                {daySessions.map((session) => {
                  const columnLayout = columnLayoutsByDay[dayKey]?.get(session.id)
                  return (
                    <AgendaWeekSessionBlock
                      key={session.id}
                      session={session}
                      columnIndex={columnLayout?.columnIndex}
                      columnCount={columnLayout?.columnCount}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>

        {sessions.length === 0 && (
          <div className="mx-auto mt-6 flex max-w-md flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
            <p className="text-sm font-medium text-foreground">Nenhuma sessão nesta semana</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Navegue entre semanas ou mude para a visualização diária.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
