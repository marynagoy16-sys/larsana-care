import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { SchedulingAvailabilityWizard } from '@/components/scheduling/SchedulingAvailabilityWizard'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import { formatDateTime } from '@/lib/formatters'
import { ppSubmitRescheduleAvailability } from '@/services/sessionReminderChat'

type PpRescheduleSlotsCardProps = {
  requestId: string
  originalScheduledAt: string
  onSubmitted?: () => void
}

export function PpRescheduleSlotsCard({
  requestId,
  originalScheduledAt,
  onSubmitted,
}: PpRescheduleSlotsCardProps) {
  const getSelectedSlotsRef = useRef<(() => { starts_at: string; ends_at?: string }[]) | null>(null)
  const [selectionCount, setSelectionCount] = useState(0)

  const submitMutation = useCrudMutation<void, void>({
    mutationFn: async () => {
      const slots = getSelectedSlotsRef.current?.() ?? []
      if (slots.length === 0) throw new Error('Selecione ao menos um horário')
      await ppSubmitRescheduleAvailability(requestId, slots)
    },
    queryKey: ['pp', 'reschedule-requests'],
    successMessage: 'Horários enviados ao paciente',
    onSuccess: () => onSubmitted?.(),
  })

  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/40 p-4 space-y-4">
      <div>
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
          Paciente solicitou remarcação
        </p>
        <p className="text-xs text-amber-900/80 dark:text-amber-100/80 mt-1">
          Terapia original: {formatDateTime(originalScheduledAt)}. Envie opções de horário — o paciente
          escolhe no chat com a Sara.
        </p>
      </div>

      <SchedulingAvailabilityWizard
        demandType="continuidade"
        onSelectionChange={setSelectionCount}
        getSelectedSlotsRef={getSelectedSlotsRef}
      />

      <Button
        className="w-full"
        disabled={selectionCount === 0 || submitMutation.isPending}
        onClick={() => submitMutation.mutate()}
      >
        {submitMutation.isPending ? 'Enviando…' : 'Enviar horários ao paciente'}
      </Button>
    </div>
  )
}
