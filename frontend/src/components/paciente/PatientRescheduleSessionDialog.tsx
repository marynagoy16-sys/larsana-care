import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { uploadRescheduleCertificate } from '@/services/sessionReschedule'

const REASONS = [
  { value: 'atestado', label: 'Atestado' },
  { value: 'consulta', label: 'Consulta' },
  { value: 'obito', label: 'Óbito' },
  { value: 'outro', label: 'Outro' },
] as const

interface PatientRescheduleSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  patientId: string
  scheduledAt?: string
  onSuccess: () => void
}

export function PatientRescheduleSessionDialog({
  open,
  onOpenChange,
  sessionId,
  patientId,
  onSuccess,
}: PatientRescheduleSessionDialogProps) {
  const [reason, setReason] = useState<string>('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setError(null)
    setSubmitting(true)
    try {
      let path: string | null = null
      if (attachment) {
        path = await uploadRescheduleCertificate(patientId, attachment)
      }
      const { error: rpcError } = await supabase.rpc('patient_request_reschedule_to_pp' as never, {
        p_session_id: sessionId,
        p_reason: reason || null,
        p_attachment: path,
      } as never)
      if (rpcError) throw rpcError
      onSuccess()
      onOpenChange(false)
      setReason('')
      setAttachment(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível solicitar a remarcação.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Solicitar remarcação</DialogTitle>
          <DialogDescription>
            O pedido vai para o profissional responsável. Você não escolhe o novo horário nesta etapa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Motivo (opcional)</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reschedule-attachment">Anexo (opcional)</Label>
            <Input
              id="reschedule-attachment"
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Voltar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Enviando…' : 'Enviar pedido'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
