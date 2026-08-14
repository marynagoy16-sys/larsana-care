import { format, parseISO } from 'date-fns'
import { MoreHorizontal } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AGENDA_DAY_START_HOUR,
  AGENDA_HOUR_HEIGHT_PX,
  firstNameFromPatientName,
  sessionColumnPositionStyle,
  sessionHourCellLayout,
} from '@/lib/agendaTimeline'
import { getAgendaStatusConfig } from '@/lib/sessionStatus'
import { cn } from '@/lib/utils'
import type { AgendaSessionItem } from '@/services/ppAgenda'

interface AgendaSessionBlockProps {
  session: AgendaSessionItem
  onNavigate?: () => void
  columnIndex?: number
  columnCount?: number
}

export function AgendaSessionBlock({
  session,
  onNavigate,
  columnIndex = 0,
  columnCount = 1,
}: AgendaSessionBlockProps) {
  const navigate = useNavigate()
  const cfg = getAgendaStatusConfig(session.displayStatus)
  const scheduledStart = session.scheduledAt ? parseISO(session.scheduledAt) : session.start
  const { topPx, heightPx } = sessionHourCellLayout(
    scheduledStart,
    AGENDA_DAY_START_HOUR,
    AGENDA_HOUR_HEIGHT_PX,
  )
  const top = Math.round(topPx)
  const height = Math.max(Math.round(heightPx), 1)
  const timeLabel = format(scheduledStart, 'HH:mm')
  const firstName = firstNameFromPatientName(session.patientName)
  const stacked = columnCount > 1
  const compact = height < 56 || stacked

  const openDetail = () => {
    onNavigate?.()
    navigate(`/profissional/agenda/${session.id}`)
  }

  return (
    <article
      className={cn('absolute z-[1]', stacked && columnIndex > 0 && 'border-l border-border/40')}
      style={{ top, height, ...sessionColumnPositionStyle(columnIndex, columnCount) }}
    >
      <div className="group relative h-full w-full">
        <button
          type="button"
          className={cn(
            'absolute inset-0 block box-border overflow-hidden border-0 bg-transparent p-0 m-0',
            'text-left appearance-none transition-colors',
            'hover:[&_.agenda-session-fill]:opacity-80',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
          )}
          onClick={openDetail}
          title={`${session.patientName} · ${timeLabel} · Ciclo ${session.cycleNumber} · Sessão #${session.sessionNumber}`}
        >
          <div
            className={cn('agenda-session-fill absolute inset-0 transition-opacity', cfg.agendaFill)}
            aria-hidden
          />
          <div className={cn('absolute inset-y-0 left-0 w-1', cfg.agendaBar)} aria-hidden />

          <div className="relative flex h-full min-h-0 flex-col justify-center gap-0.5 py-1 pl-2.5 pr-9 sm:pl-3 sm:pr-10">
            <p className="text-[10px] font-medium tabular-nums leading-none text-muted-foreground sm:text-[11px]">
              {timeLabel}
            </p>
            <p
              className={cn(
                'text-sm font-semibold leading-tight text-foreground sm:text-base',
                stacked ? 'line-clamp-1' : 'line-clamp-2',
              )}
            >
              {firstName}
            </p>
            {!compact && (
              <p className="text-[10px] leading-none text-muted-foreground truncate sm:text-xs">
                Ciclo {session.cycleNumber} · Sessão #{session.sessionNumber}
              </p>
            )}
          </div>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 z-[2] h-7 w-7 shrink-0 opacity-70 group-hover:opacity-100 sm:right-1.5 sm:top-1.5 sm:h-8 sm:w-8"
              onClick={(e) => e.stopPropagation()}
              aria-label="Ações da sessão"
            >
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={openDetail}>Ver sessão</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/profissional/pacientes/${session.patientId}`)}>
              Ver paciente
            </DropdownMenuItem>
            {session.displayStatus === 'evolucao_pendente' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate(`/profissional/evolucao/nova?session=${session.id}`)}
                >
                  Evoluir terapia
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  )
}
