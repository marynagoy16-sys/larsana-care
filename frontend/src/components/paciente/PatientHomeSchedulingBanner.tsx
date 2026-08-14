import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarClock, ChevronRight } from 'lucide-react'
import { listPendingSchedulingProposalsForPatient } from '@/services/scheduling'

export function PatientHomeSchedulingBanner() {
  const { data: proposals = [] } = useQuery({
    queryKey: ['paciente', 'scheduling_proposals'],
    queryFn: listPendingSchedulingProposalsForPatient,
  })

  if (proposals.length === 0) return null

  return (
    <Link
      to="/paciente/agendamento"
      className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3.5 transition-colors hover:bg-primary/10"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CalendarClock className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Confirmar horário de atendimento</p>
        <p className="text-xs text-muted-foreground">
          {proposals.length} proposta(s) aguardando sua escolha
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}
