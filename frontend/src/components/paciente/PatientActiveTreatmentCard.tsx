import { Link } from 'react-router-dom'
import { Calendar, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CycleSessionsProgress } from '@/components/cycles/CycleSessionsProgress'
import { formatDateTime } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { ActiveCycleSummary } from '@/services/patientPortal'

type PatientActiveTreatmentCardProps = {
  cycle: ActiveCycleSummary
  professionalNameFallback?: string | null
  featured?: boolean
}

export function PatientActiveTreatmentCard({
  cycle,
  professionalNameFallback,
  featured = false,
}: PatientActiveTreatmentCardProps) {
  const professionalName = cycle.professionalName ?? professionalNameFallback ?? null

  return (
    <section
      className={cn(
        'rounded-xl overflow-hidden',
        featured ? 'border border-border/40 bg-card' : 'border border-border bg-card shadow-sm',
      )}
    >
      <div
        className={cn(
          'px-5 py-4 border-b space-y-3',
          featured ? 'border-border/40' : 'border-border',
        )}
      >
        <div>
          <h2 className={cn('font-semibold text-foreground', featured ? 'text-base' : 'text-sm')}>
            Tratamento ativo
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Ciclo #{cycle.cycle_number}</p>
        </div>
        <CycleSessionsProgress done={cycle.completedSessions} total={cycle.session_count} fullWidth />
      </div>
      <div className="p-5 space-y-4 text-sm">
        {professionalName ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <UserRound size={16} className="shrink-0" />
            <span>
              Profissional: <span className="font-medium text-foreground">{professionalName}</span>
            </span>
          </div>
        ) : null}
        {cycle.nextSessionAt ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar size={16} className="shrink-0" />
            <span>
              Próxima terapia:{' '}
              <span className="font-medium text-foreground">{formatDateTime(cycle.nextSessionAt)}</span>
            </span>
          </div>
        ) : (
          <p className="text-muted-foreground">Nenhuma terapia prevista no momento.</p>
        )}
        {!featured ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button asChild size="sm">
              <Link to={`/paciente/tratamento/ciclo/${cycle.id}`}>Ver detalhes do ciclo</Link>
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
