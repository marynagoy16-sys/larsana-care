import { useMemo, useState } from 'react'
import { addDays, format, setHours, setMinutes, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AvailabilitySlotInput } from '@/services/scheduling'

const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const HOUR_OPTIONS = [6, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 20]

type CellKey = `${number}-${number}`

function buildCellKey(dayOffset: number, hour: number): CellKey {
  return `${dayOffset}-${hour}`
}

export function SchedulingAvailabilityWizard({
  demandType,
  onSubmit,
  isSubmitting,
}: {
  demandType: 'avaliacao' | 'continuidade'
  onSubmit: (slots: AvailabilitySlotInput[]) => void | Promise<void>
  isSubmitting?: boolean
}) {
  const weekStart = useMemo(
    () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    [],
  )
  const [selected, setSelected] = useState<Set<CellKey>>(new Set())

  const toggle = (key: CellKey) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleSubmit = () => {
    const slots: AvailabilitySlotInput[] = [...selected]
      .map((key) => {
        const [dayOffset, hour] = key.split('-').map(Number)
        const startsAt = setMinutes(setHours(addDays(weekStart, dayOffset), hour), 0)
        return {
          starts_at: startsAt.toISOString(),
          ends_at: setMinutes(setHours(addDays(weekStart, dayOffset), hour + 1), 0).toISOString(),
        }
      })
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at))

    onSubmit(slots)
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border space-y-1">
        <h3 className="font-semibold text-sm">Disponibilidade para agendamento</h3>
        <p className="text-xs text-muted-foreground">
          {demandType === 'avaliacao'
            ? 'Selecione horários nos próximos 7 dias. A família escolherá uma opção.'
            : 'Selecione horários compatíveis com sua agenda. O paciente confirmará o melhor horário.'}
        </p>
      </div>

      <div className="p-4 overflow-x-auto">
        <div className="min-w-[520px]">
          <div className="grid grid-cols-[3.5rem_repeat(6,1fr)] gap-1 mb-1">
            <div />
            {WEEKDAY_LABELS.map((label, index) => (
              <div key={label} className="text-center text-[10px] font-semibold uppercase text-muted-foreground">
                {label}
                <div className="text-[11px] font-normal normal-case text-foreground">
                  {format(addDays(weekStart, index), 'd/M', { locale: ptBR })}
                </div>
              </div>
            ))}
          </div>

          {HOUR_OPTIONS.map((hour) => (
            <div key={hour} className="grid grid-cols-[3.5rem_repeat(6,1fr)] gap-1 mb-1">
              <div className="text-[10px] text-muted-foreground pt-2 text-right pr-1 tabular-nums">
                {String(hour).padStart(2, '0')}:00
              </div>
              {WEEKDAY_LABELS.map((_, dayOffset) => {
                const key = buildCellKey(dayOffset, hour)
                const checked = selected.has(key)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggle(key)}
                    className={cn(
                      'h-9 rounded-md border text-[10px] transition-colors',
                      checked
                        ? 'border-primary bg-primary/15 text-primary font-medium'
                        : 'border-border bg-muted/20 hover:bg-muted/40',
                    )}
                  >
                    {checked ? '✓' : ''}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 py-4 border-t border-border flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground">{selected.size} horário(s) selecionado(s)</p>
        <Button
          type="button"
          disabled={selected.size === 0 || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? 'Enviando...' : 'Enviar opções ao paciente'}
        </Button>
      </div>
    </div>
  )
}

export function SchedulingStructuredMessages({
  messages,
}: {
  messages: Array<{ sender_role: string; body: string; created_at: string }>
}) {
  if (messages.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-sm">Mensagens de agendamento</h3>
      </div>
      <ul className="divide-y divide-border max-h-64 overflow-y-auto">
        {messages.map((msg) => (
          <li key={msg.created_at + msg.body} className="px-5 py-3 text-sm">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
              {msg.sender_role === 'sistema' ? 'Larsana Care' : msg.sender_role === 'pp' ? 'Profissional' : 'Família'}
            </p>
            <p>{msg.body}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
