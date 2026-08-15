import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDateTime } from '@/lib/formatters'
import type { SessionRescheduleRequest } from '@/services/sessionReschedule'
import { ppRescheduleAfterSubRejection } from '@/services/sessionReschedule'

interface PpRescheduleWindowCardProps {
  request: SessionRescheduleRequest
  onCompleted: () => void
}

export function PpRescheduleWindowCard({ request, onCompleted }: PpRescheduleWindowCardProps) {
  const [newDateTime, setNewDateTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!newDateTime) {
      setError('Informe o novo horário.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await ppRescheduleAfterSubRejection(request.id, new Date(newDateTime).toISOString())
      onCompleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível remarcar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-4 dark:border-amber-900/40 dark:bg-amber-950/20 space-y-3">
      <div>
        <p className="text-sm font-semibold">Reposição após recusa de substituto</p>
        <p className="text-xs text-muted-foreground mt-1">
          Horário original: {formatDateTime(request.original_scheduled_at)} · Prazo até{' '}
          {format(new Date(request.reschedule_deadline), "dd/MM/yyyy", { locale: ptBR })}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`pp-reschedule-${request.id}`}>Novo horário</Label>
        <Input
          id={`pp-reschedule-${request.id}`}
          type="datetime-local"
          value={newDateTime}
          onChange={(e) => setNewDateTime(e.target.value)}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button size="sm" onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Salvando…' : 'Confirmar remarcação'}
      </Button>
    </div>
  )
}
