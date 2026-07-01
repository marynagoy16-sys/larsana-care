import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { CrudModal } from '@/components/crud/CrudModal'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  isValidRescheduleJustification,
  requiresRescheduleReason,
  requiresRescheduleWarningAck,
  RESCHEDULE_REASON_OPTIONS,
  type RescheduleReasonCategory,
} from '@/lib/financialClosure'
import { registerReschedule } from '@/services/reschedules'
import { RescheduleWarningModal } from './RescheduleWarningModal'

interface RescheduleSessionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  sessionNumber: number
  nextSequenceNumber: number
  onSuccess?: () => void
}

export function RescheduleSessionModal({
  open,
  onOpenChange,
  sessionId,
  sessionNumber,
  nextSequenceNumber,
  onSuccess,
}: RescheduleSessionModalProps) {
  const [reasonCategory, setReasonCategory] = useState<RescheduleReasonCategory | ''>('')
  const [reasonText, setReasonText] = useState('')
  const [newScheduledAt, setNewScheduledAt] = useState('')
  const [warningOpen, setWarningOpen] = useState(false)
  const [pendingAck, setPendingAck] = useState(false)

  useEffect(() => {
    if (!open) {
      setReasonCategory('')
      setReasonText('')
      setNewScheduledAt('')
      setPendingAck(false)
      setWarningOpen(false)
    }
  }, [open])

  const mutation = useMutation({
    mutationFn: (warningAcknowledged: boolean) =>
      registerReschedule({
        sessionId,
        reasonCategory: reasonCategory || null,
        reasonText: reasonText || null,
        warningAcknowledged,
        newScheduledAt: newScheduledAt || null,
      }),
    onSuccess: () => {
      onOpenChange(false)
      onSuccess?.()
    },
  })

  const needsReason = requiresRescheduleReason(nextSequenceNumber)
  const needsWarning = requiresRescheduleWarningAck(
    nextSequenceNumber,
    reasonCategory || null,
  )

  const submit = (warningAcknowledged: boolean) => {
    if (needsReason && !reasonCategory) return
    mutation.mutate(warningAcknowledged)
  }

  const handleSubmit = () => {
    if (needsReason && !reasonCategory) return

    if (needsWarning && !pendingAck) {
      setWarningOpen(true)
      return
    }

    submit(pendingAck || !needsWarning)
  }

  const handleWarningConfirm = () => {
    setPendingAck(true)
    setWarningOpen(false)
    submit(true)
  }

  return (
    <>
      <CrudModal
        open={open}
        onOpenChange={onOpenChange}
        title={`Remarcar sessão #${sessionNumber}`}
        description={
          nextSequenceNumber === 1
            ? 'Primeira remarcação — sem penalidade automática.'
            : nextSequenceNumber === 2
              ? 'Segunda remarcação — informe o motivo.'
              : 'Terceira remarcação consecutiva.'
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            Remarcação {nextSequenceNumber}ª consecutiva neste ciclo.
            {isValidRescheduleJustification(reasonCategory || null) &&
              ' Motivo de saúde/internação pode levar à análise de pausa justificada.'}
          </div>

          {needsReason && (
            <div className="space-y-2">
              <Label>Motivo *</Label>
              <Select
                value={reasonCategory}
                onValueChange={(v) => setReasonCategory(v as RescheduleReasonCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  {RESCHEDULE_REASON_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="Detalhes adicionais (opcional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Nova data e hora (opcional)</Label>
            <Input
              type="datetime-local"
              value={newScheduledAt}
              onChange={(e) => setNewScheduledAt(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={mutation.isPending || (needsReason && !reasonCategory)}
            >
              <RefreshCw size={14} className="mr-1.5" />
              Confirmar remarcação
            </Button>
          </div>
        </div>
      </CrudModal>

      <RescheduleWarningModal
        open={warningOpen}
        onOpenChange={setWarningOpen}
        onConfirm={handleWarningConfirm}
        onCancel={() => setWarningOpen(false)}
        isSubmitting={mutation.isPending}
      />
    </>
  )
}
