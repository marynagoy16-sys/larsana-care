import { useMemo, useState } from 'react'
import { addDays } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import { RESCHEDULE_MAX_DAYS_AHEAD } from '@/lib/sessionReschedule'
import { ppRescheduleSession } from '@/services/scheduling'

function toLocalInputValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

type PpInitiateRescheduleDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  onSubmitted?: () => void
}

export function PpInitiateRescheduleDialog({
  open,
  onOpenChange,
  sessionId,
  onSubmitted,
}: PpInitiateRescheduleDialogProps) {
  const [scheduledAt, setScheduledAt] = useState('')

  const limits = useMemo(() => {
    const now = new Date()
    return {
      min: toLocalInputValue(now),
      max: toLocalInputValue(addDays(now, RESCHEDULE_MAX_DAYS_AHEAD)),
    }
  }, [open])

  const submitMutation = useCrudMutation({
    mutationFn: async () => {
      if (!scheduledAt) throw new Error('Escolha o novo horário')
      return ppRescheduleSession(sessionId, new Date(scheduledAt).toISOString())
    },
    queryKey: ['pp', 'agenda'],
    successMessage: 'Solicitação enviada ao paciente',
    onSuccess: () => {
      setScheduledAt('')
      onOpenChange(false)
      onSubmitted?.()
    },
  })

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setScheduledAt('')
        onOpenChange(next)
      }}
    >
      <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md px-4 py-5 sm:w-full sm:px-6">
        <AlertDialogHeader>
          <AlertDialogTitle>Reagendar atendimento</AlertDialogTitle>
          <AlertDialogDescription>
            O paciente recebe o novo horário e confirma antes da troca na agenda. O prazo é de até {RESCHEDULE_MAX_DAYS_AHEAD} dias.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="pp-initiate-reschedule-at">Novo dia e horário</Label>
          <Input
            id="pp-initiate-reschedule-at"
            type="datetime-local"
            min={limits.min}
            max={limits.max}
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitMutation.isPending}>Cancelar</AlertDialogCancel>
          <Button
            type="button"
            disabled={!scheduledAt || submitMutation.isPending}
            onClick={() => submitMutation.mutate()}
          >
            {submitMutation.isPending ? 'Enviando…' : 'Enviar solicitação'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
