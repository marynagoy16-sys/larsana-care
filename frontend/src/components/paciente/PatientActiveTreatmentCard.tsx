import { Link } from 'react-router-dom'
import { Calendar, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CycleSessionsProgress } from '@/components/cycles/CycleSessionsProgress'
import { formatDateTime } from '@/lib/formatters'
import type { ActiveCycleSummary } from '@/services/patientPortal'

type PatientActiveTreatmentCardProps = {
  cycle: ActiveCycleSummary
}

export function PatientActiveTreatmentCard({ cycle }: PatientActiveTreatmentCardProps) {
  return (
    <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-sm">Tratamento ativo</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Ciclo #{cycle.cycle_number}</p>
        </div>
        <CycleSessionsProgress done={cycle.completedSessions} total={cycle.session_count} />
      </div>
      <div className="p-5 space-y-3 text-sm">
        {cycle.professionalName && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <UserRound size={16} className="shrink-0" />
            <span>
              Profissional: <span className="font-medium text-foreground">{cycle.professionalName}</span>
            </span>
          </div>
        )}
        {cycle.nextSessionAt ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar size={16} className="shrink-0" />
            <span>
              Próxima sessão:{' '}
              <span className="font-medium text-foreground">{formatDateTime(cycle.nextSessionAt)}</span>
            </span>
          </div>
        ) : (
          <p className="text-muted-foreground">Nenhuma sessão prevista no momento.</p>
        )}
        <Button asChild variant="outline" size="sm" className="mt-1">
          <Link to={`/paciente/tratamento/ciclo/${cycle.id}`}>Ver detalhes do ciclo</Link>
        </Button>
      </div>
    </section>
  )
}
