import { format, parseISO } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import {
  AGENDA_DAY_START_HOUR,
  AGENDA_WEEK_HOUR_HEIGHT_PX,
  firstNameFromPatientName,
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
  draggable?: boolean
  onDragStart?: (sessionId: string) => void
}

export function AgendaWeekSessionBlock({
  session,
  columnIndex = 0,
  columnCount = 1,
  hourHeightPx = AGENDA_WEEK_HOUR_HEIGHT_PX,
  draggable = false,
  onDragStart,
}: AgendaWeekSessionBlockProps) {
  const navigate = useNavigate()
  const cfg = getAgendaStatusConfig(session.displayStatus)
  const scheduledStart = session.scheduledAt ? parseISO(session.scheduledAt) : session.start
  const { topPx, heightPx } = sessionHourCellLayout(
    scheduledStart,
    AGENDA_DAY_START_HOUR,
    hourHeightPx,
  )
  const top = topPx
  const height = Math.max(heightPx, 1)
  const timeLabel = format(scheduledStart, 'HH:mm')
  const firstName = firstNameFromPatientName(session.patientName)
  const label = `${firstName}, ${timeLabel}`
  const showLabel = height >= 28
  const wrapName = height >= 36

  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/session-id', session.id)
        e.dataTransfer.effectAllowed = 'move'
        onDragStart?.(session.id)
      }}
      className={cn(
        'absolute z-[2] block box-border overflow-hidden border-0 p-0 m-0',
        'appearance-none transition-opacity hover:opacity-80',
        showLabel && cfg.agendaFill,
        draggable && 'cursor-grab active:cursor-grabbing',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
      )}
      style={{ top, height, ...sessionColumnPositionStyle(columnIndex, columnCount) }}
      onClick={() => navigate(`/profissional/agenda/${session.id}`)}
      title={`${session.patientName} · ${timeLabel} · Ciclo ${session.cycleNumber} · Sessão #${session.sessionNumber}`}
      aria-label={label}
    >
      {showLabel ? (
        <span
          className={cn(
            'relative z-[1] block h-full whitespace-normal break-words px-1.5 pt-1 text-sm font-semibold leading-tight text-foreground sm:text-base',
            wrapName ? 'line-clamp-2' : 'line-clamp-1',
          )}
        >
          {firstName}
        </span>
      ) : (
        <span
          className={cn(
            'absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full',
            cfg.agendaBar,
          )}
          aria-hidden
        />
      )}
    </button>
  )
}
