import { useCallback, useEffect, useMemo, useState, type MutableRefObject } from 'react'
import {
  addDays,
  addHours,
  endOfDay,
  format,
  isAfter,
  isBefore,
  setHours,
  setMinutes,
  startOfDay,
  startOfWeek,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertTriangle, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  AVALIACAO_MUST_OCCUR_WITHIN_DAYS,
  CONTINUIDADE_OFFER_HORIZON_DAYS,
  type AvailabilitySlotInput,
} from '@/services/scheduling'

const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const HOUR_OPTIONS = [6, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 20]

const AVAILABILITY_GRID_CLASS =
  'grid w-full min-w-0 grid-cols-[1.625rem_repeat(6,minmax(0,1fr))] gap-x-0.5 gap-y-1 sm:grid-cols-[2.25rem_repeat(6,minmax(0,1fr))] sm:gap-x-1 sm:gap-y-1.5'

const AVAILABILITY_SLOT_CLASS =
  'mx-auto flex size-9 shrink-0 items-center justify-center rounded-sm border transition-colors sm:size-10 sm:rounded-md'

type CellKey = `${string}-${number}`

function buildCellKey(day: Date, hour: number): CellKey {
  return `${format(day, 'yyyy-MM-dd')}-${hour}`
}

function parseCellKey(key: CellKey): { day: Date; hour: number } {
  const lastDash = key.lastIndexOf('-')
  const datePart = key.slice(0, lastDash)
  const hour = Number(key.slice(lastDash + 1))
  const [year, month, dayOfMonth] = datePart.split('-').map(Number)
  return {
    day: new Date(year, month - 1, dayOfMonth),
    hour,
  }
}

function slotStartsAt(day: Date, hour: number): Date {
  return setMinutes(setHours(day, hour), 0)
}

function buildSelectedSlots(selected: Set<CellKey>): AvailabilitySlotInput[] {
  return [...selected]
    .map((key) => {
      const { day, hour } = parseCellKey(key)
      const startsAt = slotStartsAt(day, hour)
      return {
        starts_at: startsAt.toISOString(),
        ends_at: addHours(startsAt, 1).toISOString(),
      }
    })
    .filter((slot) => isAfter(new Date(slot.starts_at), new Date()))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
}

export function formatAvailabilitySlotLabel(startsAt: string): string {
  return format(new Date(startsAt), "EEEE, d 'de' MMMM · HH:mm", { locale: ptBR })
}

function getLatestOfferDay(demandType: 'avaliacao' | 'continuidade'): Date {
  const horizonDays =
    demandType === 'avaliacao' ? AVALIACAO_MUST_OCCUR_WITHIN_DAYS : CONTINUIDADE_OFFER_HORIZON_DAYS
  return endOfDay(addDays(new Date(), horizonDays))
}

function getWeekBounds(demandType: 'avaliacao' | 'continuidade') {
  const today = startOfDay(new Date())
  const minWeekStart = startOfWeek(today, { weekStartsOn: 1 })
  const maxWeekStart = startOfWeek(getLatestOfferDay(demandType), { weekStartsOn: 1 })
  return { minWeekStart, maxWeekStart }
}

function getSchedulingPolicyCopy(demandType: 'avaliacao' | 'continuidade') {
  if (demandType === 'avaliacao') {
    return `A avaliação deve ocorrer em até ${AVALIACAO_MUST_OCCUR_WITHIN_DAYS} dias após o aceite da demanda. Ofereça horários dentro desse prazo.`
  }

  return `Você pode navegar entre semanas para encontrar disponibilidade (até ${CONTINUIDADE_OFFER_HORIZON_DAYS} dias à frente).`
}

export function SchedulingAvailabilityInstructions({
  demandType,
}: {
  demandType: 'avaliacao' | 'continuidade'
}) {
  const message = getSchedulingPolicyCopy(demandType)

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/40 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-amber-200/60 dark:border-amber-900/40">
        <AlertTriangle size={16} className="text-amber-700 dark:text-amber-500" />
        <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">Atenção</h3>
      </div>
      <p className="px-5 py-4 text-sm text-amber-900/90 dark:text-amber-100/90">{message}</p>
    </div>
  )
}

export function SchedulingAvailabilityWizard({
  demandType,
  onSelectionChange,
  getSelectedSlotsRef,
}: {
  demandType: 'avaliacao' | 'continuidade'
  onSelectionChange?: (count: number) => void
  getSelectedSlotsRef?: MutableRefObject<(() => AvailabilitySlotInput[]) | null>
}) {
  const { minWeekStart, maxWeekStart } = useMemo(() => getWeekBounds(demandType), [demandType])
  const latestOfferDay = useMemo(() => getLatestOfferDay(demandType), [demandType])

  const [weekStart, setWeekStart] = useState(minWeekStart)
  const [selected, setSelected] = useState<Set<CellKey>>(new Set())

  const weekDays = useMemo(
    () => WEEKDAY_LABELS.map((_, index) => addDays(weekStart, index)),
    [weekStart],
  )

  const weekLabel = useMemo(() => {
    const weekEnd = addDays(weekStart, WEEKDAY_LABELS.length - 1)
    const sameMonth = weekStart.getMonth() === weekEnd.getMonth()
    if (sameMonth) {
      return `${format(weekStart, 'd', { locale: ptBR })}–${format(weekEnd, "d 'de' MMMM", { locale: ptBR })}`
    }
    return `${format(weekStart, 'd MMM', { locale: ptBR })} – ${format(weekEnd, 'd MMM', { locale: ptBR })}`
  }, [weekStart])

  const canGoPrevWeek = weekStart.getTime() > minWeekStart.getTime()
  const canGoNextWeek = weekStart.getTime() < maxWeekStart.getTime()

  const isSlotSelectable = useCallback(
    (day: Date, hour: number) => {
      const startsAt = slotStartsAt(day, hour)
      const now = new Date()
      if (!isAfter(startsAt, now)) return false
      if (isAfter(startsAt, latestOfferDay)) return false
      return true
    },
    [latestOfferDay],
  )

  const toggle = (day: Date, hour: number) => {
    if (!isSlotSelectable(day, hour)) return
    const key = buildCellKey(day, hour)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const getSelectedSlots = useCallback(() => buildSelectedSlots(selected), [selected])

  useEffect(() => {
    if (getSelectedSlotsRef) getSelectedSlotsRef.current = getSelectedSlots
  }, [getSelectedSlots, getSelectedSlotsRef])

  useEffect(() => {
    onSelectionChange?.(selected.size)
  }, [onSelectionChange, selected.size])

  useEffect(() => {
    setSelected((prev) => {
      const next = new Set<CellKey>()
      for (const key of prev) {
        const { day, hour } = parseCellKey(key)
        if (isSlotSelectable(day, hour)) next.add(key)
      }
      return next.size === prev.size ? prev : next
    })
  }, [isSlotSelectable, weekStart])

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card max-lg:-mx-[var(--shell-gap)] max-lg:w-[calc(100%+2*var(--shell-gap))] max-lg:rounded-none max-lg:border-x-0">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-2 py-2 sm:px-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          disabled={!canGoPrevWeek}
          onClick={() => setWeekStart((current) => addDays(current, -7))}
          aria-label="Semana anterior"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <p className="min-w-0 flex-1 text-center text-xs font-medium capitalize sm:text-sm">{weekLabel}</p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          disabled={!canGoNextWeek}
          onClick={() => setWeekStart((current) => addDays(current, 7))}
          aria-label="Próxima semana"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="px-2 py-3 sm:p-4">
        <div className={cn(AVAILABILITY_GRID_CLASS, 'mb-0.5 sm:mb-1')}>
          <div />
          {weekDays.map((day, index) => (
            <div
              key={day.toISOString()}
              className={cn(
                'min-w-0 text-center text-[9px] font-semibold uppercase leading-tight sm:text-[10px]',
                isBefore(endOfDay(day), startOfDay(new Date())) || isAfter(day, latestOfferDay)
                  ? 'text-muted-foreground/50'
                  : 'text-muted-foreground',
              )}
            >
              {WEEKDAY_LABELS[index]}
              <div className="text-[10px] font-normal normal-case text-foreground sm:text-[11px]">
                {format(day, 'd/M', { locale: ptBR })}
              </div>
            </div>
          ))}
        </div>

        {HOUR_OPTIONS.map((hour) => (
          <div key={hour} className={cn(AVAILABILITY_GRID_CLASS, 'mb-0.5 sm:mb-1')}>
            <div className="pr-0.5 pt-1 text-right text-[9px] tabular-nums leading-none text-muted-foreground sm:pt-1.5 sm:text-[10px]">
              {String(hour).padStart(2, '0')}:00
            </div>
            {weekDays.map((day) => {
              const key = buildCellKey(day, hour)
              const checked = selected.has(key)
              const selectable = isSlotSelectable(day, hour)
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!selectable}
                  onClick={() => toggle(day, hour)}
                  className={cn(
                    AVAILABILITY_SLOT_CLASS,
                    !selectable && 'cursor-not-allowed border-transparent bg-muted/10 opacity-40',
                    selectable && checked && 'border-primary bg-primary/15 text-primary',
                    selectable && !checked && 'border-border bg-muted/20 hover:bg-muted/40',
                  )}
                >
                  {checked ? <Check className="size-5 stroke-[2.5] sm:size-6" aria-hidden /> : null}
                </button>
              )
            })}
          </div>
        ))}
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
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold">Mensagens de agendamento</h3>
      </div>
      <ul className="max-h-64 divide-y divide-border overflow-y-auto">
        {messages.map((msg) => (
          <li key={msg.created_at + msg.body} className="px-5 py-3 text-sm">
            <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              {msg.sender_role === 'sistema' ? 'Larsana Care' : msg.sender_role === 'pp' ? 'Profissional' : 'Família'}
            </p>
            <p>{msg.body}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
