import { useMutation } from '@tanstack/react-query'
import { Ban } from 'lucide-react'
import { CrudModal } from '@/components/crud/CrudModal'
import { Button } from '@/components/ui/button'
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
      title={`Cancelar sessão #${sessionNumber}`}
      description="Desmarque sem justificativa com menos de 2h de antecedência. Aplica regra de 50%: metade reembolsada à família e metade repassada ao profissional (split proporcional)."
    >
      <div className="space-y-4">
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
            {mutation.isPending ? 'Registrando…' : 'Confirmar cancelamento 50%'}
          </Button>
        </div>
        {mutation.isError && (
          <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
        )}
      </div>
    </CrudModal>
  )
}
