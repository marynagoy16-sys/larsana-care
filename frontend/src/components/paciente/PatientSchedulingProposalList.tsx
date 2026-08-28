import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { SchedulingStructuredMessages } from '@/components/scheduling/SchedulingAvailabilityWizard'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import {
  patientConfirmSlot,
  patientRejectSlot,
  type SchedulingProposal,
} from '@/services/scheduling'

interface PatientSchedulingProposalListProps {
  proposals: SchedulingProposal[]
  onUpdated?: () => void
}

export function PatientSchedulingProposalList({
  proposals,
  onUpdated,
}: PatientSchedulingProposalListProps) {
  const initialProposals = proposals.filter((p) => p.proposal_type !== 'remarcacao')

  const confirmMutation = useCrudMutation({
    mutationFn: ({ proposalId, slotId }: { proposalId: string; slotId: string }) =>
      patientConfirmSlot(proposalId, slotId),
    queryKey: ['paciente', 'scheduling_proposals'],
    successMessage: 'Horário confirmado!',
    onSuccess: () => onUpdated?.(),
  })

  const rejectMutation = useCrudMutation({
    mutationFn: (proposalId: string) => patientRejectSlot(proposalId),
    queryKey: ['paciente', 'scheduling_proposals'],
    successMessage: 'Solicitação enviada ao profissional',
    onSuccess: () => onUpdated?.(),
  })

  if (initialProposals.length === 0) return null

  const busy = confirmMutation.isPending || rejectMutation.isPending

  return (
    <div className="space-y-4">
      {initialProposals.map((proposal) => (
        <div key={proposal.id} className="rounded-xl border border-border bg-card overflow-hidden">
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
                  disabled={busy}
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
              disabled={busy}
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
      ))}
    </div>
  )
}
