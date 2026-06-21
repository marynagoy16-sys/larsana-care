import { format, parseISO } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { getAgendaStatusConfig } from '@/lib/sessionStatus'
import { cn } from '@/lib/utils'
import type { AgendaSessionItem } from '@/services/ppAgenda'

interface HomeSessionCardProps {
  session: AgendaSessionItem
  className?: string
}

export function HomeSessionCard({ session, className }: HomeSessionCardProps) {
  const navigate = useNavigate()
  const cfg = getAgendaStatusConfig(session.displayStatus)
  const scheduledStart = session.scheduledAt ? parseISO(session.scheduledAt) : session.start
  const timeLabel = format(scheduledStart, 'HH:mm')

  return (
    <button
      type="button"
      onClick={() => navigate(`/profissional/agenda/${session.id}`)}
      className={cn(
        'relative w-full overflow-hidden rounded-xl border border-border bg-card text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <div className={cn('absolute inset-y-0 left-0 w-1', cfg.agendaBar)} aria-hidden />
      <div className="flex items-center gap-3 px-4 py-3 pl-5">
        <time className="shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
          {timeLabel}
        </time>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{session.patientName}</p>
          <p className="text-xs text-muted-foreground">
            Ciclo {session.cycleNumber} · Sessão #{session.sessionNumber}
          </p>
        </div>
        <Badge className={cn('shrink-0 border-0', cfg.badge)}>{cfg.label}</Badge>
      </div>
    </button>
  )
}
