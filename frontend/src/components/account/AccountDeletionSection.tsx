import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertTriangle, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/formatters'
import {
  cancelAccountDeletion,
  getAccountDeletionStatus,
  requestAccountDeletion,
} from '@/services/accountDeletion'

const ACCOUNT_DELETION_STATUS_KEY = ['account-deletion-status'] as const

const WARNING_TEXT =
  'A exclusão da sua conta será programada para 30 dias após a solicitação. Durante esse período, você poderá cancelar a exclusão. Caso faça login novamente, a solicitação também será automaticamente cancelada.'

export function AccountDeletionSection() {
  const queryClient = useQueryClient()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const statusQuery = useQuery({
    queryKey: ACCOUNT_DELETION_STATUS_KEY,
    queryFn: getAccountDeletionStatus,
    staleTime: 30_000,
  })

  const requestMutation = useMutation({
    mutationFn: requestAccountDeletion,
    onSuccess: () => {
      setConfirmOpen(false)
      toast.success('Exclusão solicitada', {
        description: 'Você poderá cancelar a qualquer momento nos próximos 30 dias.',
      })
      queryClient.invalidateQueries({ queryKey: ACCOUNT_DELETION_STATUS_KEY })
    },
    onError: (error) => {
      toast.error('Não foi possível solicitar a exclusão', {
        description: error instanceof Error ? error.message : undefined,
      })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: cancelAccountDeletion,
    onSuccess: () => {
      toast.success('Exclusão cancelada', {
        description:
          'Sua conta foi mantida. Se quiser excluir depois, será necessária uma nova solicitação, reiniciando o prazo de 30 dias.',
      })
      queryClient.invalidateQueries({ queryKey: ACCOUNT_DELETION_STATUS_KEY })
    },
    onError: (error) => {
      toast.error('Não foi possível cancelar', {
        description: error instanceof Error ? error.message : undefined,
      })
    },
  })

  const pending = statusQuery.data?.pending === true
  const scheduledAt = statusQuery.data?.scheduled_deletion_at

  if (statusQuery.isLoading) return null

  if (pending) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="size-5 shrink-0 text-destructive" />
          <div className="space-y-1">
            <p className="font-medium text-foreground">
              Exclusão da conta programada para {formatDate(scheduledAt)}.
            </p>
            <p className="text-xs text-muted-foreground">
              Você pode cancelar a exclusão até essa data. Fazer login novamente também cancela
              automaticamente a solicitação.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full h-11 lg:h-10"
          disabled={cancelMutation.isPending}
          onClick={() => cancelMutation.mutate()}
        >
          {cancelMutation.isPending ? 'Cancelando…' : 'Cancelar exclusão'}
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="space-y-1">
        <p className="font-medium text-foreground">Excluir conta</p>
        <p className="text-xs text-muted-foreground">
          Solicite a exclusão da sua conta. A remoção é agendada para 30 dias depois e pode ser
          cancelada nesse período.
        </p>
      </div>
      <Button
        variant="outline"
        className="w-full h-11 lg:h-10 text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2 className="size-4" />
        Solicitar exclusão da conta
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Solicitar exclusão da conta</AlertDialogTitle>
            <AlertDialogDescription>{WARNING_TEXT}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={requestMutation.isPending}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                requestMutation.mutate()
              }}
              disabled={requestMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {requestMutation.isPending ? 'Enviando…' : 'Confirmar exclusão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
