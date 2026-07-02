import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { patientLevelLabels } from '@/constants/labels'
import { reviewAssessmentLevelChange } from '@/services/assessmentLevelReview'

type Props = {
  assessmentId: string
  suggestedLevel: string
  requestedLevel?: string | null
  reason?: string | null
  queryKeys?: unknown[][]
}

export function AssessmentLevelReviewCard({
  assessmentId,
  suggestedLevel,
  requestedLevel,
  reason,
  queryKeys = [],
}: Props) {
  const queryClient = useQueryClient()
  const [notes, setNotes] = useState('')

  const mutation = useMutation({
    mutationFn: (decision: 'aprovado' | 'rejeitado') =>
      reviewAssessmentLevelChange(assessmentId, decision, notes || undefined),
    onSuccess: () => {
      for (const key of queryKeys) {
        queryClient.invalidateQueries({ queryKey: key })
      }
    },
  })

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/20 overflow-hidden">
      <div className="px-5 py-4 border-b border-amber-200/60 dark:border-amber-900/40 flex items-start gap-3">
        <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-sm text-amber-950 dark:text-amber-100">Revisão de nível pendente</h3>
          <p className="text-sm text-amber-900/90 dark:text-amber-200/90 mt-1">
            O profissional não confirmou o {patientLevelLabels[suggestedLevel] ?? suggestedLevel}.
            {requestedLevel && requestedLevel !== suggestedLevel && (
              <> Nível solicitado na justificativa: {patientLevelLabels[requestedLevel] ?? requestedLevel}.</>
            )}
          </p>
          {reason && (
            <p className="text-sm mt-2 whitespace-pre-wrap rounded-md bg-background/60 p-3 border border-border">
              {reason}
            </p>
          )}
        </div>
      </div>
      <div className="px-5 py-4 space-y-3">
        <Textarea
          rows={2}
          placeholder="Observações internas (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate('aprovado')}
          >
            Aprovar alteração de nível
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate('rejeitado')}
          >
            Manter nível sugerido
          </Button>
        </div>
      </div>
    </div>
  )
}
