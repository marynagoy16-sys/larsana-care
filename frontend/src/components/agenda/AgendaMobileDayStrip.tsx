import { useEffect, useMemo, useRef } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  formatMobileDayStripLabel,
  getMobileDayStripRange,
  isTodayDate,
  toAgendaDayKey,
} from '@/lib/agendaWeek'
import { cn } from '@/lib/utils'

interface AgendaMobileDayStripProps {
  anchorDate: Date
  onSelectDay: (day: Date) => void
  sessionDayKeys?: ReadonlySet<string>
  className?: string
}

export function AgendaMobileDayStrip({
  anchorDate,
  onSelectDay,
  sessionDayKeys,
  className,
}: AgendaMobileDayStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const dayButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const selectedKey = toAgendaDayKey(anchorDate)

  const { days } = useMemo(() => getMobileDayStripRange(anchorDate), [anchorDate])

  useEffect(() => {
    const node = dayButtonRefs.current.get(selectedKey)
    node?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [selectedKey, days])

  return (
    <div className={cn('border-b border-border/60 bg-background', className)}>
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {days.map((day) => {
          const key = toAgendaDayKey(day)
          const { weekdayLetter, day: dayNum } = formatMobileDayStripLabel(day)
          const selected = key === selectedKey
          const today = isTodayDate(day)
          const hasSessions = sessionDayKeys?.has(key) ?? false

          return (
            <button
              key={key}
              ref={(node) => {
                if (node) dayButtonRefs.current.set(key, node)
                else dayButtonRefs.current.delete(key)
              }}
              type="button"
              onClick={() => {
                const d = new Date(day)
                d.setHours(0, 0, 0, 0)
                onSelectDay(d)
              }}
              className={cn(
                'flex min-w-[3rem] shrink-0 snap-center flex-col items-center rounded-2xl border px-3 py-2 transition-colors',
                selected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:bg-muted/40',
              )}
              aria-label={format(day, "EEEE, d 'de' MMMM", { locale: ptBR })}
              aria-current={selected ? 'date' : undefined}
            >
              <span
                className={cn(
                  'text-[11px] font-medium uppercase leading-none',
                  selected ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {weekdayLetter}
              </span>
              <span
                className={cn(
                  'mt-1 text-lg font-bold tabular-nums leading-none',
                  selected ? 'text-primary' : 'text-foreground',
                  today && !selected && 'text-primary',
                )}
              >
                {dayNum}
              </span>
              <span
                className={cn(
                  'mt-1.5 h-1.5 w-1.5 rounded-full',
                  hasSessions ? 'bg-primary' : 'bg-transparent',
                )}
                aria-hidden
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
