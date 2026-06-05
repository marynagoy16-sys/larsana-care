import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export interface MetricCardProps {
  label: string
  value: number | string
  icon?: LucideIcon
  trend?: number
  trendLabel?: string
  footer?: string
  href?: string
  isLoading?: boolean
}

function formatMetricValue(value: number | string): string {
  if (typeof value === 'number') {
    return new Intl.NumberFormat('pt-BR').format(value)
  }
  return value
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel = 'Mês anterior',
  footer,
  href,
  isLoading,
}: MetricCardProps) {
  const trendUp = trend !== undefined && trend >= 0
  const displayValue = isLoading ? '—' : formatMetricValue(value)

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card overflow-hidden min-w-0">
      <div className="flex flex-1 flex-col p-4 pb-3 min-h-[88px]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {Icon && (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon size={18} className="text-foreground" />
              </div>
            )}
            <span className="text-sm font-semibold text-foreground truncate">{label}</span>
          </div>
          {href ? (
            <Link
              to={href}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={`Ver ${label}`}
            >
              <ArrowUpRight size={16} />
            </Link>
          ) : (
            <span className="shrink-0 text-muted-foreground/40">
              <ArrowUpRight size={16} />
            </span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <p className={cn('text-2xl sm:text-3xl font-bold tabular-nums tracking-tight', isLoading && 'animate-pulse')}>
            {displayValue}
          </p>
          {trend !== undefined && !isLoading && (
            <div className="text-right shrink-0">
              <div className={cn('flex items-center justify-end gap-0.5 text-sm font-medium', trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive')}>
                {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                <span>{trend > 0 ? '+' : ''}{trend.toFixed(1)}%</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{trendLabel}</p>
            </div>
          )}
        </div>
      </div>

      {footer && (
        <div className="mt-auto shrink-0 px-4 py-2.5 bg-muted/50 border-t border-border text-xs text-muted-foreground">
          {footer}
        </div>
      )}
    </div>
  )
}
