import { useMutation } from '@tanstack/react-query'
import { Ban } from 'lucide-react'
import { CrudModal } from '@/components/crud/CrudModal'
import { Button } from '@/components/ui/button'
import { ANEXO_II_CANCELAMENTO_SUMMARY } from '@/constants/legalTerms'
import { cancelSessionWithoutJustification } from '@/services/sessionCancellation'

interface CancelSessionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  sessionNumber: number
  scheduledAt?: string | null
  onSuccess?: () => void
}

export function CancelSessionModal({
  open,
  onOpenChange,
  sessionId,
  sessionNumber,
  scheduledAt,
  onSuccess,
}: CancelSessionModalProps) {
  const mutation = useMutation({
    mutationFn: () => cancelSessionWithoutJustification(sessionId),
    onSuccess: () => {
      onOpenChange(false)
      onSuccess?.()
    },
  })

  return (
    <CrudModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Cancelar terapia #${sessionNumber} sem justificativa`}
      description="Use quando a família desmarcar com menos de 12 horas de antecedência. Aplica regra de 50% do valor da terapia conforme Anexo II."
    >
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground rounded-lg bg-muted/40 px-3 py-2">{ANEXO_II_CANCELAMENTO_SUMMARY}</p>
        {scheduledAt && (
          <p className="text-sm text-muted-foreground">
            Agendada para: {new Date(scheduledAt).toLocaleString('pt-BR')}
          </p>
        )}
        <p className="text-sm">
          Esta ação registra o cancelamento parcial no fechamento financeiro do ciclo. Confirme apenas se o paciente
          desmarcou sem justificativa válida.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Voltar
          </Button>
          <Button
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            <Ban className="size-4 mr-1" />
            {mutation.isPending ? 'Registrando…' : 'Confirmar cancelamento'}
          </Button>
        </div>
        {mutation.isError && (
          <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
        )}
      </div>
    </CrudModal>
  )
}
