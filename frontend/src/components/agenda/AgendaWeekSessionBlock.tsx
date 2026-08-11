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
  hourHeightPx?: number
  compact?: boolean
}

export function AgendaWeekSessionBlock({
  session,
  columnIndex = 0,
  columnCount = 1,
  hourHeightPx = AGENDA_WEEK_HOUR_HEIGHT_PX,
  compact = false,
}: AgendaWeekSessionBlockProps) {
  const navigate = useNavigate()
  const cfg = getAgendaStatusConfig(session.displayStatus)
  const scheduledStart = session.scheduledAt ? parseISO(session.scheduledAt) : session.start
  const { topPx, heightPx } = sessionHourCellLayout(
    scheduledStart,
    AGENDA_DAY_START_HOUR,
    hourHeightPx,
  )
  const top = Math.round(topPx)
  const height = Math.max(Math.round(heightPx), 1)
  const timeLabel = format(scheduledStart, 'HH:mm')
  const label = `${session.patientName}, ${timeLabel}`
  const useDot = height < 24

  return (
    <button
      type="button"
      className={cn(
        'absolute z-[2] block box-border overflow-hidden border-0 bg-transparent p-0 m-0',
        'appearance-none transition-opacity hover:opacity-80',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
      )}
      style={{ top, height, ...sessionColumnPositionStyle(columnIndex, columnCount) }}
      onClick={() => navigate(`/profissional/agenda/${session.id}`)}
      title={`${session.patientName} · ${timeLabel} · Ciclo ${session.cycleNumber} · Sessão #${session.sessionNumber}`}
      aria-label={label}
    >
      {useDot ? (
        <span
          className={cn(
            'absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full',
            cfg.agendaBar,
          )}
          aria-hidden
        />
      ) : (
        <span
          className={cn(
            'absolute inset-x-0.5 inset-y-1 block rounded-[3px]',
            cfg.agendaFill,
            'ring-1 ring-inset ring-black/[0.05] dark:ring-white/[0.08]',
          )}
          aria-hidden
        >
          <span className={cn('absolute inset-y-0 left-0 w-[3px] rounded-l-[3px]', cfg.agendaBar)} />
        </span>
      )}
    </button>
  )
}
