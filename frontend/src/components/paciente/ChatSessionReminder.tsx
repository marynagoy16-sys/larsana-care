import { Button } from '@/components/ui/button'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import {
  LATE_RESCHEDULE_PARTIAL_PERCENT,
  RESCHEDULE_MIN_HOURS_NOTICE,
  RESCHEDULE_MAX_DAYS_AHEAD,
} from '@/lib/sessionReschedule'
import {
  patientChatConfirmPresence,
  patientChatRequestReschedule,
  type SessionReminderState,
} from '@/services/sessionReminderChat'

type ChatSessionReminderProps = {
  sessionId: string
  state: SessionReminderState
  onUpdated?: () => void
}

export function ChatSessionReminder({ sessionId, state, onUpdated }: ChatSessionReminderProps) {
  const confirmMutation = useCrudMutation<void, void>({
    mutationFn: async () => {
      await patientChatConfirmPresence(sessionId)
    },
    queryKey: ['paciente', 'chat'],
    successMessage: 'Presença confirmada!',
    onSuccess: () => onUpdated?.(),
  })

  const rescheduleMutation = useCrudMutation<void, void>({
    mutationFn: async () => {
      await patientChatRequestReschedule(sessionId)
    },
    queryKey: ['paciente', 'chat'],
    successMessage: 'Solicitação enviada ao profissional',
    onSuccess: () => onUpdated?.(),
  })

  const busy = confirmMutation.isPending || rescheduleMutation.isPending

  if (state.presenceConfirmed || state.reschedulePending) {
    return null
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Remarcação: com {RESCHEDULE_MIN_HOURS_NOTICE}h ou mais de antecedência, sem taxa. Com menos de{' '}
        {RESCHEDULE_MIN_HOURS_NOTICE}h, exige atestado e cobrança de {LATE_RESCHEDULE_PARTIAL_PERCENT}% do valor.
        Novo horário em até {RESCHEDULE_MAX_DAYS_AHEAD} dias, com o mesmo profissional.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          className="flex-1"
          disabled={busy}
          onClick={() => confirmMutation.mutate()}
        >
          Confirmar presença
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          disabled={busy}
          onClick={() => rescheduleMutation.mutate()}
        >
          Remarcar
        </Button>
      </div>
    </div>
  )
}
