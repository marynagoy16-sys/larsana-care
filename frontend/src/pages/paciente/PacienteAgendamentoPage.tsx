import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import { CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { SchedulingStructuredMessages } from '@/components/scheduling/SchedulingAvailabilityWizard'
import {
  listPendingSchedulingProposalsForPatient,
  patientConfirmSlot,
  patientRejectSlot,
} from '@/services/scheduling'
import { useCrudMutation } from '@/hooks/useCrudMutation'

export function PacienteAgendamentoPage() {
  const { data: proposals = [], isLoading, refetch } = useQuery({
    queryKey: ['paciente', 'scheduling_proposals'],
    queryFn: listPendingSchedulingProposalsForPatient,
  })

  const confirmMutation = useCrudMutation({
    mutationFn: ({ proposalId, slotId }: { proposalId: string; slotId: string }) =>
      patientConfirmSlot(proposalId, slotId),
    queryKey: ['paciente', 'scheduling_proposals'],
    successMessage: 'Horário confirmado!',
    onSuccess: () => refetch(),
  })

  const rejectMutation = useCrudMutation({
    mutationFn: (proposalId: string) => patientRejectSlot(proposalId),
    queryKey: ['paciente', 'scheduling_proposals'],
    successMessage: 'Solicitação enviada ao profissional',
    onSuccess: () => refetch(),
  })

  return (
    <>
      <PageHeader>
        <div className="flex items-center gap-3">
          <CalendarClock className="size-5 text-primary" />
          <h1 className="font-display font-bold text-xl">Confirmar horário</h1>
        </div>
      </PageHeader>

      <CrudScrollPageLayout>
        <CascadeReveal className="space-y-5 pb-8">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando propostas...</p>
          ) : proposals.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">Nenhum horário pendente de confirmação.</p>
              <Button asChild variant="outline" size="sm">
                <Link to="/paciente">Voltar ao início</Link>
              </Button>
            </div>
          ) : (
            proposals.map((proposal) => (
              <CascadeItem key={proposal.id}>
                <div className="rounded-xl border border-border bg-card overflow-hidden space-y-0">
                  <div className="px-5 py-4 border-b border-border">
                    <h2 className="font-semibold text-sm">
                      {proposal.proposal_type === 'avaliacao' ? 'Avaliação inicial' : 'Continuidade de tratamento'}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Escolha um horário proposto pelo profissional parceiro.
                    </p>
                  </div>

                  <div className="p-5 space-y-3">
                    {(proposal.scheduling_proposal_slots ?? [])
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((slot) => (
                        <Button
                          key={slot.id}
                          variant="outline"
                          className="w-full justify-start h-auto py-3"
                          disabled={confirmMutation.isPending || rejectMutation.isPending}
                          onClick={() =>
                            confirmMutation.mutate({ proposalId: proposal.id, slotId: slot.id })
                          }
                        >
                          {format(new Date(slot.starts_at), "EEEE, d 'de' MMMM · HH:mm", { locale: ptBR })}
                        </Button>
                      ))}

                    <Button
                      variant="ghost"
                      className="w-full text-muted-foreground"
                      disabled={confirmMutation.isPending || rejectMutation.isPending}
                      onClick={() => rejectMutation.mutate(proposal.id)}
                    >
                      Nenhum horário funciona — pedir novas opções
                    </Button>
                  </div>

                  {proposal.scheduling_messages && proposal.scheduling_messages.length > 0 && (
                    <div className="border-t border-border">
                      <SchedulingStructuredMessages messages={proposal.scheduling_messages} />
                    </div>
                  )}
                </div>
              </CascadeItem>
            ))
          )}
        </CascadeReveal>
      </CrudScrollPageLayout>
    </>
  )
}
