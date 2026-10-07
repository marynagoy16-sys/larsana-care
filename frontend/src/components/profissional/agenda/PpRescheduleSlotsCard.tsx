import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import { formatDateTime } from '@/lib/formatters'
import { supabase } from '@/lib/supabase'

type PpRescheduleSlotsCardProps = {
  requestId: string
  originalScheduledAt: string
  deadline?: string | null
  onSubmitted?: () => void
}

export function PpRescheduleSlotsCard({
  requestId,
  originalScheduledAt,
  deadline,
  onSubmitted,
}: PpRescheduleSlotsCardProps) {
  const [scheduledAt, setScheduledAt] = useState('')

  const submitMutation = useCrudMutation<void, void>({
    mutationFn: async () => {
      if (!scheduledAt) throw new Error('Escolha o novo horário')
      const { error } = await supabase.rpc('pp_place_patient_reschedule' as never, {
        p_request_id: requestId,
        p_scheduled_at: new Date(scheduledAt).toISOString(),
      } as never)
      if (error) throw error
    },
    queryKey: ['pp', 'reschedule-requests'],
    successMessage: 'Terapia recolocada na agenda',
    onSuccess: () => onSubmitted?.(),
  })

  const deadlineLabel = deadline
    ? format(new Date(deadline), "dd/MM/yyyy", { locale: ptBR })
    : null

  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/40 p-4 space-y-4">
      <div>
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
          Paciente solicitou remarcação
        </p>
        <p className="text-xs text-amber-900/80 dark:text-amber-100/80 mt-1">
          Terapia original: {formatDateTime(originalScheduledAt)}. Recoloque o atendimento
          {deadlineLabel ? ` até ${deadlineLabel} (14 dias)` : ' em até 14 dias'}.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pp-reschedule-at">Novo dia e horário</Label>
        <Input
          id="pp-reschedule-at"
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
        />
      </div>

      <Button
        className="w-full"
        disabled={!scheduledAt || submitMutation.isPending}
        onClick={() => submitMutation.mutate()}
      >
        {submitMutation.isPending ? 'Salvando…' : 'Recolocar na agenda'}
      </Button>
    </div>
  )
}
