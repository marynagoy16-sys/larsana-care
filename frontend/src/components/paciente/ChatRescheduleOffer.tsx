import { Button } from '@/components/ui/button'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import {
  formatAvailabilitySlotLabel,
  type SchedulingProposal,
} from '@/services/scheduling'
import { patientRespondRescheduleProposal } from '@/services/sessionReschedule'

type ChatRescheduleOfferProps = {
  proposal: SchedulingProposal
  highlighted?: boolean
  onUpdated?: () => void
}

export function ChatRescheduleOffer({
  proposal,
  highlighted = false,
  onUpdated,
}: ChatRescheduleOfferProps) {
  const confirmMutation = useCrudMutation({
    mutationFn: ({ slotId, choiceLabel }: { slotId: string; choiceLabel: string }) =>
      patientRespondRescheduleProposal(proposal.id, true, slotId, { choiceLabel }),
    queryKey: ['paciente', 'scheduling_proposals'],
    successMessage: 'Remarcação confirmada!',
    onSuccess: () => onUpdated?.(),
  })

  const rejectMutation = useCrudMutation({
    mutationFn: () => patientRespondRescheduleProposal(proposal.id, false),
    queryKey: ['paciente', 'scheduling_proposals'],
    successMessage: 'Solicitação enviada',
    onSuccess: () => onUpdated?.(),
  })

  const busy = confirmMutation.isPending || rejectMutation.isPending
  const slots = [...(proposal.scheduling_proposal_slots ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  )

  return (
    <div
      className={
        highlighted
          ? 'rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3'
          : 'rounded-2xl border border-border bg-card p-4 space-y-3'
      }
    >
      <div>
        <p className="text-sm font-semibold text-foreground">Confirmar remarcação</p>
        <p className="text-xs text-muted-foreground mt-1">
          Escolha o novo horário proposto pelo profissional parceiro.
        </p>
      </div>

      <div className="space-y-2">
        {slots.map((slot) => (
          <Button
            key={slot.id}
            variant="outline"
            className="w-full justify-start h-auto py-3 bg-background"
            disabled={busy}
            onClick={() =>
              confirmMutation.mutate({
                slotId: slot.id,
                choiceLabel: formatAvailabilitySlotLabel(slot.starts_at),
              })
            }
          >
            {formatAvailabilitySlotLabel(slot.starts_at)}
          </Button>
        ))}
      </div>

      <Button
        variant="ghost"
        className="w-full text-muted-foreground"
        disabled={busy}
        onClick={() => rejectMutation.mutate()}
      >
        Não posso neste horário — ver opção de substituto
      </Button>
    </div>
  )
}
