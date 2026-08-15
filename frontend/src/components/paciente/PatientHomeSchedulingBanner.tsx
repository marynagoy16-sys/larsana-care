import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarClock, ChevronRight } from 'lucide-react'
import { listPendingSchedulingProposalsForPatient } from '@/services/scheduling'
import { listPendingSubOffersForPatient } from '@/services/sessionReschedule'

export function PatientHomeSchedulingBanner() {
  const { data: proposals = [] } = useQuery({
    queryKey: ['paciente', 'scheduling_proposals'],
    queryFn: listPendingSchedulingProposalsForPatient,
  })

  const { data: subOffers = [] } = useQuery({
    queryKey: ['paciente', 'sub_offers'],
    queryFn: listPendingSubOffersForPatient,
  })

  const pendingCount = proposals.length + subOffers.length
  if (pendingCount === 0) return null

  const hasSub = subOffers.length > 0
  const hasReschedule = proposals.some((p) => p.proposal_type === 'remarcacao')

  const title = hasSub
    ? 'Substituto ou remarcação pendente'
    : hasReschedule
      ? 'Confirmar remarcação'
      : 'Confirmar horário de atendimento'

  const subtitle = hasSub
    ? `${subOffers.length} oferta(s) de substituto aguardando resposta`
    : `${pendingCount} pendência(s) aguardando sua escolha`

  return (
    <Link
      to="/paciente/agendamento"
      className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3.5 transition-colors hover:bg-primary/10"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CalendarClock className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}
