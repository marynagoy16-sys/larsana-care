import { format, parseISO } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import {
  AGENDA_DAY_START_HOUR,
  AGENDA_WEEK_HOUR_HEIGHT_PX,
  sessionColumnPositionStyle,
  sessionHourCellLayout,
} from '@/lib/agendaTimeline'
import { getAgendaStatusConfig } from '@/lib/sessionStatus'
import { cn } from '@/lib/utils'
import type { AgendaSessionItem } from '@/services/ppAgenda'

interface AgendaWeekSessionBlockProps {
  session: AgendaSessionItem
  columnIndex?: number
  columnCount?: number
}

export function AgendaWeekSessionBlock({
  session,
  columnIndex = 0,
  columnCount = 1,
}: AgendaWeekSessionBlockProps) {
  const navigate = useNavigate()
  const cfg = getAgendaStatusConfig(session.displayStatus)
  const scheduledStart = session.scheduledAt ? parseISO(session.scheduledAt) : session.start
  const { topPx, heightPx } = sessionHourCellLayout(
    scheduledStart,
    AGENDA_DAY_START_HOUR,
    AGENDA_WEEK_HOUR_HEIGHT_PX,
  )
  const top = Math.round(topPx)
  const height = Math.max(Math.round(heightPx), 1)
  const timeLabel = format(scheduledStart, 'HH:mm')
  const stacked = columnCount > 1
  const compact = height < 44 || stacked

  return (
    <button
      type="button"
      className={cn(
        'absolute z-[1] block box-border overflow-hidden border-0 bg-transparent p-0 m-0',
        'text-left appearance-none transition-colors',
        'hover:[&_.week-session-fill]:opacity-90',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
        stacked && columnIndex > 0 && 'border-l border-border/40',
      )}
      style={{ top, height, ...sessionColumnPositionStyle(columnIndex, columnCount) }}
      onClick={() => navigate(`/profissional/agenda/${session.id}`)}
      title={`${session.patientName} · ${timeLabel} · Ciclo ${session.cycleNumber} · Sessão #${session.sessionNumber}`}
    >
      <div
        className={cn('week-session-fill absolute inset-0 transition-opacity', cfg.agendaFill)}
        aria-hidden
      />
      <div className={cn('absolute inset-y-0 left-0 w-1', cfg.agendaBar)} aria-hidden />

      <div className="relative flex h-full min-h-0 w-full flex-col justify-start gap-0.5 py-1 pl-2 pr-1.5">
        <p className="text-[10px] font-medium tabular-nums leading-none text-muted-foreground">
          {timeLabel}
        </p>
        <p
          className={cn(
            'text-[11px] font-semibold leading-tight text-foreground',
            stacked ? 'line-clamp-1' : 'line-clamp-2',
          )}
        >
          {session.patientName}
        </p>
        {!compact && (
          <p className="text-[10px] leading-none text-muted-foreground truncate">
            Ciclo {session.cycleNumber} · Sessão #{session.sessionNumber}
          </p>
        )}
      </div>
    </button>
  )
}
