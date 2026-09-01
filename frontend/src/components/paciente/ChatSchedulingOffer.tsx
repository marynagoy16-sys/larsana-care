import { Button } from '@/components/ui/button'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import {
  formatAvailabilitySlotLabel,
  patientConfirmSlot,
  patientRejectSlot,
  type SchedulingProposal,
} from '@/services/scheduling'

type ChatSchedulingOfferProps = {
  proposal: SchedulingProposal
  highlighted?: boolean
  onUpdated?: () => void
}

export function ChatSchedulingOffer({
  proposal,
  highlighted = false,
  onUpdated,
}: ChatSchedulingOfferProps) {
  const confirmMutation = useCrudMutation({
    mutationFn: ({ slotId, choiceLabel }: { slotId: string; choiceLabel: string }) =>
      patientConfirmSlot(proposal.id, slotId, { choiceLabel }),
    queryKey: ['paciente', 'scheduling_proposals'],
    successMessage: 'Horário confirmado!',
    onSuccess: () => onUpdated?.(),
  })

  const rejectMutation = useCrudMutation({
    mutationFn: () => patientRejectSlot(proposal.id),
    queryKey: ['paciente', 'scheduling_proposals'],
    successMessage: 'Solicitação enviada ao profissional',
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
        <p className="text-sm font-semibold text-foreground">
          {proposal.proposal_type === 'avaliacao'
            ? 'Avaliação inicial'
            : 'Primeira terapia do ciclo'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {proposal.proposal_type === 'continuidade'
            ? 'Escolha o dia e horário da primeira sessão. As demais serão no mesmo dia e horário.'
            : 'Escolha um horário proposto pelo profissional parceiro.'}
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
        Nenhum horário funciona — pedir novas opções
      </Button>
    </div>
  )
}
