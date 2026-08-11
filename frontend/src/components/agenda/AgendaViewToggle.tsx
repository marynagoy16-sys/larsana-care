import { cn } from '@/lib/utils'
import type { AgendaViewMode } from '@/lib/agendaWeek'

interface AgendaViewToggleProps {
  value: AgendaViewMode
  onChange: (value: AgendaViewMode) => void
  className?: string
  dayLabel?: string
  weekLabel?: string
}

export function AgendaViewToggle({
  value,
  onChange,
  className,
  dayLabel = 'Diário',
  weekLabel = 'Semanal',
}: AgendaViewToggleProps) {
  return (
    <div
      className={cn(
        'inline-flex shrink-0 rounded-full border border-border bg-muted/40 p-0.5',
        className,
      )}
      role="group"
      aria-label="Modo de visualização da agenda"
    >
      {(['day', 'week'] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={cn(
            'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
            value === mode
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
          aria-pressed={value === mode}
        >
          {mode === 'day' ? dayLabel : weekLabel}
        </button>
      ))}
    </div>
  )
}
