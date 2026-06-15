import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
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
import { formatAssessmentProposalSummary } from '@/lib/assessmentListDisplay'
import { formatCurrency } from '@/lib/formatters'
import { mapSupabaseError } from '@/lib/supabase-errors'
import { sendAssessmentProposal } from '@/services/assessmentProposal'

type SendProposalInput = {
  id: string
  patient_id: string
  status: string
  proposed_session_count: number
  proposed_patient_level: string
  proposed_weekly_frequency: number
}

type AssessmentSendProposalCardProps = {
  assessment: SendProposalInput
  patientName: string
  totalAmountCents?: number | null
  queryKeys: readonly (readonly unknown[])[]
}

export function AssessmentSendProposalCard({
  assessment,
  patientName,
  totalAmountCents,
  queryKeys,
}: AssessmentSendProposalCardProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const sendMutation = useMutation({
    mutationFn: () => sendAssessmentProposal(assessment.id),
    onSuccess: () => {
      for (const key of queryKeys) {
        queryClient.invalidateQueries({ queryKey: key })
      }
      toast.success('Proposta enviada à família')
      setOpen(false)
    },
    onError: (error) => toast.error(mapSupabaseError(error)),
  })

  if (assessment.status !== 'avaliacao_feita') return null

  const proposalSummary = formatAssessmentProposalSummary(assessment)
  const totalLabel = totalAmountCents != null ? formatCurrency(totalAmountCents) : null

  return (
    <>
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/20 px-5 py-4">
        <p className="font-medium text-amber-900 dark:text-amber-200">Proposta aguardando envio</p>
        <p className="text-sm text-amber-800/90 dark:text-amber-300/90 mt-1">
          O profissional já registrou a avaliação. Envie a proposta para{' '}
          <span className="font-medium">{patientName}</span> responder SIM ou NÃO em até 5 dias úteis.
        </p>
        <Button size="sm" className="mt-3 gap-2" onClick={() => setOpen(true)}>
          <Send size={16} />
          Enviar proposta à família
        </Button>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar proposta à família?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left text-sm text-muted-foreground">
                <p>
                  A família de <span className="font-medium text-foreground">{patientName}</span> será
                  notificada e terá <span className="font-medium text-foreground">5 dias úteis</span> para
                  responder.
                </p>
                <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-foreground">
                  <p className="font-medium">{proposalSummary}</p>
                  {totalLabel && <p className="text-muted-foreground mt-0.5">Valor total: {totalLabel}</p>}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sendMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={sendMutation.isPending}
              onClick={(event) => {
                event.preventDefault()
                sendMutation.mutate()
              }}
            >
              {sendMutation.isPending ? 'Enviando…' : 'Confirmar envio'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
