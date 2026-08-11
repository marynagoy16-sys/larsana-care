import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import {
  AGENDA_DAY_END_HOUR,
  AGENDA_DAY_START_HOUR,
  AGENDA_WEEK_HOUR_HEIGHT_PX,
  AGENDA_WEEK_MOBILE_HOUR_HEIGHT_PX,
  buildHourMarkers,
  buildSessionColumnLayout,
  formatHourLabel,
  hourMarkerTopPx,
  nowIndicatorTopPx,
  resolveTimelineContentHeight,
} from '@/lib/agendaTimeline'
import {
  formatMobileDayStripLabel,
  getWeekRange,
  groupSessionsByDay,
  isTodayDate,
  toAgendaDayKey,
} from '@/lib/agendaWeek'
import { cn } from '@/lib/utils'
import type { AgendaSessionItem } from '@/services/ppAgenda'
import { AgendaWeekSessionBlock } from './AgendaWeekSessionBlock'

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
    <div className="flex w-full min-w-0 border-b border-border/50 bg-background">
      <div className="w-9 shrink-0 sm:w-11" aria-hidden />
      {days.map((day) => {
        const { weekdayLetter, day: dayNumber } = formatMobileDayStripLabel(day)
        const today = isTodayDate(day)
        return (
          <div key={toAgendaDayKey(day)} className="min-w-0 flex-1 px-0.5">
            <button
              type="button"
              onClick={() => onSelectDay?.(day)}
              className={cn(
                'mx-auto flex w-full flex-col items-center gap-0.5 py-1.5 transition-colors',
                onSelectDay && 'hover:bg-muted/40 rounded-md',
              )}
              disabled={!onSelectDay}
            >
              <span className="text-[10px] font-medium uppercase leading-none text-muted-foreground">
                {weekdayLetter}
              </span>
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums leading-none',
                  today
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground',
                )}
              >
                {dayNumber}
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
  const gridScrollRef = useRef<HTMLDivElement | null>(null)
  const [nowTopMobile, setNowTopMobile] = useState<number | null>(null)
  const [nowTopDesktop, setNowTopDesktop] = useState<number | null>(null)

  const setGridScrollRef = useCallback(
    (node: HTMLDivElement | null) => {
      gridScrollRef.current = node
      if (scrollContainerRef) {
        scrollContainerRef.current = node
      }
    },
    [scrollContainerRef],
  )

  const { days } = useMemo(() => getWeekRange(anchorDate), [anchorDate])
  const hours = useMemo(
    () => buildHourMarkers(AGENDA_DAY_START_HOUR, AGENDA_DAY_END_HOUR),
    [],
  )
  const halfHours = useMemo(() => {
    const markers: number[] = []
    for (let h = AGENDA_DAY_START_HOUR; h < AGENDA_DAY_END_HOUR; h += 1) {
      markers.push(h + 0.5)
    }
    return markers
  }, [])

  const totalHeightMobile = useMemo(
    () => resolveTimelineContentHeight(sessions, AGENDA_WEEK_MOBILE_HOUR_HEIGHT_PX),
    [sessions],
  )
  const totalHeightDesktop = useMemo(
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

  const todayInWeek = useMemo(() => days.some(isTodayDate), [days])

  useEffect(() => {
    if (!todayInWeek) {
      setNowTopMobile(null)
      setNowTopDesktop(null)
      return
    }
    const tick = () => {
      const now = new Date()
      setNowTopMobile(
        nowIndicatorTopPx(now, AGENDA_DAY_START_HOUR, AGENDA_DAY_END_HOUR, AGENDA_WEEK_MOBILE_HOUR_HEIGHT_PX),
      )
      setNowTopDesktop(
        nowIndicatorTopPx(now, AGENDA_DAY_START_HOUR, AGENDA_DAY_END_HOUR, AGENDA_WEEK_HOUR_HEIGHT_PX),
      )
    }
    tick()
    const id = window.setInterval(tick, 60_000)
    return () => window.clearInterval(id)
  }, [todayInWeek, anchorDate])

  const renderWeekGrid = (
    hourHeightPx: number,
    totalHeight: number,
    nowTop: number | null,
  ) => (
    <div className="flex w-full min-w-0" style={{ minHeight: totalHeight }}>
      <div className="relative w-9 shrink-0 sm:w-11" style={{ height: totalHeight }}>
        {hours.map((hour) => (
          <div
            key={hour}
            className="absolute right-0 w-full -translate-y-1/2 pr-1 text-right leading-none"
            style={{
              top: hourMarkerTopPx(hour, AGENDA_DAY_START_HOUR, hourHeightPx),
            }}
          >
            <span className="text-[10px] font-normal tabular-nums text-muted-foreground/80">
              {formatHourLabel(hour)}
            </span>
          </div>
        ))}

        {todayInWeek && nowTop !== null && (
          <div
            className="pointer-events-none absolute right-0 z-[4] flex translate-y-[-50%] items-center justify-end pr-0.5"
            style={{ top: nowTop }}
            aria-hidden
          >
            <span className="h-2 w-2 rounded-full bg-destructive shadow-sm" />
          </div>
        )}
      </div>

      {days.map((day) => {
        const dayKey = toAgendaDayKey(day)
        const daySessions = sessionsByDay[dayKey] ?? []
        const today = isTodayDate(day)

        return (
          <div
            key={dayKey}
            className={cn(
              'relative min-w-0 flex-1 border-l border-border/40',
              today && 'bg-primary/[0.04]',
            )}
            style={{ height: totalHeight }}
          >
            {hours
              .filter((hour) => hour > AGENDA_DAY_START_HOUR)
              .map((hour) => (
                <div
                  key={hour}
                  className="pointer-events-none absolute left-0 right-0 z-0 border-t border-border/35"
                  style={{
                    top: hourMarkerTopPx(hour, AGENDA_DAY_START_HOUR, hourHeightPx),
                  }}
                />
              ))}

            {halfHours.map((hour) => (
              <div
                key={hour}
                className="pointer-events-none absolute left-0 right-0 z-0 border-t border-dashed border-border/20"
                style={{
                  top: hourMarkerTopPx(hour, AGENDA_DAY_START_HOUR, hourHeightPx),
                }}
              />
            ))}

            {today && nowTop !== null && (
              <div
                className="pointer-events-none absolute left-0 right-0 z-[3] h-px bg-destructive"
                style={{ top: nowTop }}
                aria-hidden
              />
            )}

            {daySessions.map((session) => {
              const columnLayout = columnLayoutsByDay[dayKey]?.get(session.id)
              return (
                <AgendaWeekSessionBlock
                  key={session.id}
                  session={session}
                  columnIndex={columnLayout?.columnIndex}
                  columnCount={columnLayout?.columnCount}
                  hourHeightPx={hourHeightPx}
                />
              )
            })}
          </div>
        )
      })}
    </div>
  )

  return (
    <div className={cn('flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden', className)}>
      <div className="sticky top-0 z-10 shrink-0 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <WeekDayHeaderRow days={days} onSelectDay={onSelectDay} />
      </div>

      <div
        ref={setGridScrollRef}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-sidebar"
      >
        <div className="sm:hidden">
          {renderWeekGrid(
            AGENDA_WEEK_MOBILE_HOUR_HEIGHT_PX,
            totalHeightMobile,
            nowTopMobile,
          )}
        </div>
        <div className="hidden sm:block">
          {renderWeekGrid(
            AGENDA_WEEK_HOUR_HEIGHT_PX,
            totalHeightDesktop,
            nowTopDesktop,
          )}
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
