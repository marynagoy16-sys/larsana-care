import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { PauseCircle } from 'lucide-react'
import { CrudModal } from '@/components/crud/CrudModal'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PauseType } from '@/lib/financialClosure'
import { initiatePause } from '@/services/financialClosure'
import { pauseTypeLabels } from '@/constants/labels'

const PAUSE_OPTIONS: PauseType[] = [
  'justified',
  'unjustified',
  'professional_or_operation_issue',
]

interface InitiatePauseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cycleId: string
  onSuccess?: () => void
}

export function InitiatePauseModal({
  open,
  onOpenChange,
  cycleId,
  onSuccess,
}: InitiatePauseModalProps) {
  const [pauseType, setPauseType] = useState<PauseType>('justified')
  const [justification, setJustification] = useState('')

  const mutation = useMutation({
    mutationFn: () => initiatePause(cycleId, pauseType, justification || undefined),
    onSuccess: () => {
      setJustification('')
      onOpenChange(false)
      onSuccess?.()
    },
  })

  return (
    <CrudModal open={open} onOpenChange={onOpenChange} title="Registrar pausa do ciclo">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Tipo de pausa</Label>
          <Select value={pauseType} onValueChange={(v) => setPauseType(v as PauseType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAUSE_OPTIONS.map((value) => (
                <SelectItem key={value} value={value}>
                  {pauseTypeLabels[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Justificativa</Label>
          <Textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Descreva o motivo da pausa..."
            rows={4}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            <PauseCircle size={14} className="mr-1.5" />
            Registrar pausa
          </Button>
        </div>

        {mutation.isError && (
          <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
        )}
      </div>
    </CrudModal>
  )
}
