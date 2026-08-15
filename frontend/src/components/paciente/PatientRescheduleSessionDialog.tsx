import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
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
  isLateRescheduleWindow,
  isWithinRescheduleDays,
  LATE_RESCHEDULE_PARTIAL_PERCENT,
  maxRescheduleDate,
  RESCHEDULE_MAX_DAYS_AHEAD,
} from '@/lib/sessionReschedule'
import {
  patientRequestReschedule,
  uploadRescheduleCertificate,
} from '@/services/sessionReschedule'

interface PatientRescheduleSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  patientId: string
  scheduledAt: string
  onSuccess: () => void
}

export function PatientRescheduleSessionDialog({
  open,
  onOpenChange,
  sessionId,
  patientId,
  scheduledAt,
  onSuccess,
}: PatientRescheduleSessionDialogProps) {
  const [newDateTime, setNewDateTime] = useState('')
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scheduledDate = useMemo(() => new Date(scheduledAt), [scheduledAt])
  const late = isLateRescheduleWindow(scheduledDate)
  const maxDate = maxRescheduleDate()
  const maxLabel = format(maxDate, "dd/MM/yyyy", { locale: ptBR })

  const handleSubmit = async () => {
    setError(null)
    if (!newDateTime) {
      setError('Escolha a nova data e horário.')
      return
    }

    const parsed = new Date(newDateTime)
    if (!isWithinRescheduleDays(parsed)) {
      setError(`A reposição deve ocorrer em até ${RESCHEDULE_MAX_DAYS_AHEAD} dias.`)
      return
    }

    if (late && !certificateFile) {
      setError('Envie o atestado médico para remarcação com menos de 12 horas de antecedência.')
      return
    }

    setSubmitting(true)
    try {
      let certificatePath: string | null = null
      if (late && certificateFile) {
        certificatePath = await uploadRescheduleCertificate(patientId, certificateFile)
      }

      await patientRequestReschedule(sessionId, parsed.toISOString(), certificatePath)
      onSuccess()
      onOpenChange(false)
      setNewDateTime('')
      setCertificateFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível remarcar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remarcar terapia</DialogTitle>
          <DialogDescription>
            Escolha um novo horário em até {RESCHEDULE_MAX_DAYS_AHEAD} dias (até {maxLabel}) com o mesmo
            profissional.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="reschedule-datetime">Nova data e horário</Label>
            <Input
              id="reschedule-datetime"
              type="datetime-local"
              value={newDateTime}
              onChange={(e) => setNewDateTime(e.target.value)}
            />
          </div>

          {late && (
            <div className="space-y-3 rounded-lg border border-amber-200/80 bg-amber-50/80 p-3 dark:border-amber-900/40 dark:bg-amber-950/25">
              <p className="text-sm text-amber-900 dark:text-amber-200">
                Com menos de 12 horas de antecedência, é necessário atestado médico e cobrança de{' '}
                {LATE_RESCHEDULE_PARTIAL_PERCENT}% do valor da terapia.
              </p>
              <div className="space-y-2">
                <Label htmlFor="reschedule-certificate">Atestado médico</Label>
                <Input
                  id="reschedule-certificate"
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  onChange={(e) => setCertificateFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Salvando…' : 'Confirmar remarcação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
