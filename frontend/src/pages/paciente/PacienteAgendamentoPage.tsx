import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { SchedulingStructuredMessages } from '@/components/scheduling/SchedulingAvailabilityWizard'
import { formatDateTime } from '@/lib/formatters'
import { formatAvailabilitySlotLabel, listPendingSchedulingProposalsForPatient } from '@/services/scheduling'
import {
  listPendingSubOffersForPatient,
  patientRespondRescheduleProposal,
  patientRespondSubOffer,
} from '@/services/sessionReschedule'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import { patientPortalQueryKeys } from '@/services/patientPortal'

export function PacienteAgendamentoPage() {
  const queryClient = useQueryClient()
  const { data: proposals = [], isLoading, refetch } = useQuery({
    queryKey: ['paciente', 'scheduling_proposals'],
    queryFn: () => listPendingSchedulingProposalsForPatient(),
  })

  const { data: subOffers = [], refetch: refetchSub } = useQuery({
    queryKey: ['paciente', 'sub_offers'],
    queryFn: listPendingSubOffersForPatient,
  })

  const initialProposals = proposals.filter((p) => p.proposal_type !== 'remarcacao')
  const rescheduleProposals = proposals.filter((p) => p.proposal_type === 'remarcacao')

  const confirmMutation = useCrudMutation({
    mutationFn: ({
      proposalId,
      slotId,
      choiceLabel,
    }: {
      proposalId: string
      slotId: string
      choiceLabel: string
    }) => patientRespondRescheduleProposal(proposalId, true, slotId, { choiceLabel }),
    queryKey: ['paciente', 'scheduling_proposals'],
    successMessage: 'Remarcação confirmada!',
    onSuccess: () => refetch(),
  })

  const rejectRescheduleMutation = useCrudMutation({
    mutationFn: (proposalId: string) => patientRespondRescheduleProposal(proposalId, false),
    queryKey: ['paciente', 'scheduling_proposals'],
    successMessage: 'Vamos buscar um substituto para você',
    onSuccess: () => {
      refetch()
      refetchSub()
    },
  })

  const acceptSubMutation = useCrudMutation({
    mutationFn: (requestId: string) => patientRespondSubOffer(requestId, true),
    queryKey: ['paciente', 'sub_offers'],
    successMessage: 'Substituto confirmado!',
    onSuccess: () => refetchSub(),
  })

  const rejectSubMutation = useCrudMutation({
    mutationFn: (requestId: string) => patientRespondSubOffer(requestId, false),
    queryKey: ['paciente', 'sub_offers'],
    successMessage: 'Seu profissional poderá remarcar em até 14 dias',
    onSuccess: () => refetchSub(),
  })

  const confirmInitialMutation = useCrudMutation({
    mutationFn: async ({
      proposalId,
      slotId,
      choiceLabel,
    }: {
      proposalId: string
      slotId: string
      choiceLabel: string
    }) => {
      const { patientConfirmSlot } = await import('@/services/scheduling')
      return patientConfirmSlot(proposalId, slotId, { choiceLabel })
    },
    queryKey: ['paciente', 'scheduling_proposals'],
    successMessage: 'Horário confirmado!',
    onSuccess: () => {
      void refetch()
      void queryClient.invalidateQueries({ queryKey: patientPortalQueryKeys.home })
    },
  })

  const rejectInitialMutation = useCrudMutation({
    mutationFn: async (proposalId: string) => {
      const { patientRejectSlot } = await import('@/services/scheduling')
      return patientRejectSlot(proposalId)
    },
    queryKey: ['paciente', 'scheduling_proposals'],
    successMessage: 'Solicitação enviada ao profissional',
    onSuccess: () => refetch(),
  })

  const hasPending =
    initialProposals.length > 0 || rescheduleProposals.length > 0 || subOffers.length > 0

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
          ) : !hasPending ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">Nenhum horário pendente de confirmação.</p>
              <Button asChild variant="outline" size="sm">
                <Link to="/paciente">Voltar ao início</Link>
              </Button>
            </div>
          ) : (
            <>
              {subOffers.map((offer) => (
                <CascadeItem key={offer.id}>
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border space-y-1">
                      <h2 className="font-semibold text-sm">Substituto no horário original</h2>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(offer.original_scheduled_at)}
                      </p>
                    </div>
                    <div className="p-5 space-y-2">
                      <Button
                        className="w-full"
                        disabled={acceptSubMutation.isPending || rejectSubMutation.isPending}
                        onClick={() => acceptSubMutation.mutate(offer.id)}
                      >
                        Aceitar fisioterapeuta substituto
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={acceptSubMutation.isPending || rejectSubMutation.isPending}
                        onClick={() => rejectSubMutation.mutate(offer.id)}
                      >
                        Prefiro remarcar com meu profissional
                      </Button>
                    </div>
                  </div>
                </CascadeItem>
              ))}

              {rescheduleProposals.map((proposal) => (
                <CascadeItem key={proposal.id}>
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border">
                      <h2 className="font-semibold text-sm">Confirmar remarcação</h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        Seu profissional propôs um novo horário para o atendimento.
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
                            disabled={confirmMutation.isPending || rejectRescheduleMutation.isPending}
                            onClick={() =>
                              confirmMutation.mutate({
                                proposalId: proposal.id,
                                slotId: slot.id,
                                choiceLabel: formatAvailabilitySlotLabel(slot.starts_at),
                              })
                            }
                          >
                            {formatAvailabilitySlotLabel(slot.starts_at)}
                          </Button>
                        ))}
                      <Button
                        variant="ghost"
                        className="w-full text-muted-foreground"
                        disabled={confirmMutation.isPending || rejectRescheduleMutation.isPending}
                        onClick={() => rejectRescheduleMutation.mutate(proposal.id)}
                      >
                        Não posso neste horário — ver opção de substituto
                      </Button>
                    </div>
                  </div>
                </CascadeItem>
              ))}

              {initialProposals.map((proposal) => (
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
                            disabled={confirmInitialMutation.isPending || rejectInitialMutation.isPending}
                            onClick={() =>
                              confirmInitialMutation.mutate({
                                proposalId: proposal.id,
                                slotId: slot.id,
                                choiceLabel: formatAvailabilitySlotLabel(slot.starts_at),
                              })
                            }
                          >
                            {formatAvailabilitySlotLabel(slot.starts_at)}
                          </Button>
                        ))}

                      <Button
                        variant="ghost"
                        className="w-full text-muted-foreground"
                        disabled={confirmInitialMutation.isPending || rejectInitialMutation.isPending}
                        onClick={() => rejectInitialMutation.mutate(proposal.id)}
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
              ))}
            </>
          )}
        </CascadeReveal>
      </CrudScrollPageLayout>
    </>
  )
}
