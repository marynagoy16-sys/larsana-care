import { Button } from '@/components/ui/button'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import { formatDateTime } from '@/lib/formatters'
import {
  patientRespondSubOffer,
  type SessionRescheduleRequest,
} from '@/services/sessionReschedule'

type ChatSubOfferProps = {
  offer: SessionRescheduleRequest
  highlighted?: boolean
  onUpdated?: () => void
}

export function ChatSubOffer({ offer, highlighted = false, onUpdated }: ChatSubOfferProps) {
  const acceptMutation = useCrudMutation<void, void>({
    mutationFn: async () => {
      await patientRespondSubOffer(offer.id, true)
    },
    queryKey: ['paciente', 'sub_offers'],
    successMessage: 'Substituto confirmado!',
    onSuccess: () => onUpdated?.(),
  })

  const rejectMutation = useCrudMutation<void, void>({
    mutationFn: async () => {
      await patientRespondSubOffer(offer.id, false)
    },
    queryKey: ['paciente', 'sub_offers'],
    successMessage: 'Solicitação enviada',
    onSuccess: () => onUpdated?.(),
  })

  const busy = acceptMutation.isPending || rejectMutation.isPending

  return (
    <div
      className={
        highlighted
          ? 'rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3'
          : 'rounded-2xl border border-border bg-card p-4 space-y-3'
      }
    >
      <div>
        <p className="text-sm font-semibold text-foreground">Substituto no horário original</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDateTime(offer.original_scheduled_at)}
        </p>
      </div>

      <div className="space-y-2">
        <Button
          className="w-full"
          disabled={busy}
          onClick={() => acceptMutation.mutate()}
        >
          Aceitar fisioterapeuta substituto
        </Button>
        <Button
          variant="outline"
          className="w-full"
          disabled={busy}
          onClick={() => rejectMutation.mutate()}
        >
          Prefiro remarcar com meu profissional
        </Button>
      </div>
    </div>
  )
}
