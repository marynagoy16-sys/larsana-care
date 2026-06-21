import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import {
  AGENDA_DAY_END_HOUR,
  AGENDA_DAY_START_HOUR,
  buildHourMarkers,
  buildSessionColumnLayout,
  formatHourLabel,
  hourMarkerTopPx,
  nowIndicatorTopPx,
  resolveTimelineContentHeight,
} from '@/lib/agendaTimeline'
import { cn } from '@/lib/utils'
import type { AgendaSessionItem } from '@/services/ppAgenda'
import { AgendaSessionBlock } from './AgendaSessionBlock'

interface AgendaDayTimelineProps {
  date: Date
  sessions: AgendaSessionItem[]
  scrollContainerRef?: RefObject<HTMLDivElement | null>
  className?: string
}

export function AgendaDayTimeline({
  date,
  sessions,
  scrollContainerRef,
  className,
}: AgendaDayTimelineProps) {
  const hours = useMemo(
    () => buildHourMarkers(AGENDA_DAY_START_HOUR, AGENDA_DAY_END_HOUR),
    [],
  )
  const totalHeight = useMemo(
    () => resolveTimelineContentHeight(sessions),
    [sessions],
  )
  const columnLayout = useMemo(
    () => buildSessionColumnLayout(sessions, AGENDA_DAY_START_HOUR),
    [sessions],
  )

  const [nowTop, setNowTop] = useState<number | null>(null)
  const didAutoScroll = useRef(false)
  const isToday = date.toDateString() === new Date().toDateString()

  useEffect(() => {
    if (!isToday) {
      setNowTop(null)
      didAutoScroll.current = false
      return
    }
    const tick = () => {
      setNowTop(nowIndicatorTopPx(new Date(), AGENDA_DAY_START_HOUR, AGENDA_DAY_END_HOUR))
    }
    tick()
    const id = window.setInterval(tick, 60_000)
    return () => window.clearInterval(id)
  }, [isToday, date])

  useEffect(() => {
    if (!isToday || didAutoScroll.current || nowTop === null || !scrollContainerRef?.current) return
    const container = scrollContainerRef.current
    const target = Math.max(0, nowTop - container.clientHeight * 0.35)
    container.scrollTo({ top: target, behavior: 'smooth' })
    didAutoScroll.current = true
  }, [isToday, nowTop, scrollContainerRef])

  useEffect(() => {
    didAutoScroll.current = false
  }, [date])

  return (
    <div className={cn('relative min-w-0 pb-2', className)}>
      <div className="flex gap-2 sm:gap-4" style={{ minHeight: totalHeight }}>
        <div className="relative w-10 shrink-0 sm:w-14" style={{ height: totalHeight }}>
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute right-0 w-full -translate-y-1/2 text-right leading-none pr-0.5 sm:pr-2"
              style={{ top: hourMarkerTopPx(hour, AGENDA_DAY_START_HOUR) }}
            >
              <span className="text-[10px] font-medium tabular-nums text-muted-foreground sm:text-[11px]">
                {formatHourLabel(hour)}
              </span>
            </div>
          ))}
        </div>

        <div className="relative min-w-0 flex-1" style={{ height: totalHeight }}>
          {hours
            .filter((hour) => hour > AGENDA_DAY_START_HOUR)
            .map((hour) => (
            <div
              key={hour}
              className="pointer-events-none absolute left-0 right-0 z-0 border-t border-border/70"
              style={{ top: hourMarkerTopPx(hour, AGENDA_DAY_START_HOUR) }}
            />
          ))}

          {isToday && nowTop !== null && (
            <div
              className="pointer-events-none absolute left-0 right-0 z-[2] flex items-center gap-2"
              style={{ top: nowTop }}
              aria-hidden
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
              <span className="h-px flex-1 bg-primary/80" />
            </div>
          )}

          {sessions.map((session) => {
            const layout = columnLayout.get(session.id)
            return (
              <AgendaSessionBlock
                key={session.id}
                session={session}
                columnIndex={layout?.columnIndex}
                columnCount={layout?.columnCount}
              />
            )
          })}

          {sessions.length === 0 && (
            <div className="absolute inset-x-0 top-1/3 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center sm:px-6 sm:py-10">
              <p className="text-sm font-medium text-foreground">Nenhuma sessão neste dia</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Use as setas acima para navegar entre os dias ou confira demandas abertas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
