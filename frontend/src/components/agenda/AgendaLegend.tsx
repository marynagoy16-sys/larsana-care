import { SESSION_STATUS_CONFIG, EVOLUCAO_PENDENTE_CONFIG } from '@/lib/sessionStatus'
import { cn } from '@/lib/utils'

interface AgendaLegendProps {
  className?: string
  /** Na barra de ferramentas do cabeçalho (sem borda superior). */
  inline?: boolean
}

export function AgendaLegend({ className, inline = false }: AgendaLegendProps) {
  const items = [
    SESSION_STATUS_CONFIG.prevista,
    SESSION_STATUS_CONFIG.realizada,
    EVOLUCAO_PENDENTE_CONFIG,
    SESSION_STATUS_CONFIG.remarcada,
    SESSION_STATUS_CONFIG.falta,
  ]

  return (
    <div
      className={cn(
        'flex items-center gap-x-3 text-[10px] text-muted-foreground sm:gap-x-3.5 sm:text-[11px]',
        inline
          ? 'shrink-0 flex-nowrap'
          : 'relative z-0 flex-wrap gap-y-2 border-t border-border bg-background pt-4 sm:gap-x-4 sm:text-xs',
        className,
      )}
      aria-label="Legenda de status"
    >
      {items.map((cfg) => {
        const Icon = cfg.icon
        return (
          <span key={cfg.label} className="inline-flex shrink-0 items-center gap-1">
            <Icon size={11} className={cfg.color} aria-hidden />
            {cfg.label}
          </span>
        )
      })}
    </div>
  )
}
