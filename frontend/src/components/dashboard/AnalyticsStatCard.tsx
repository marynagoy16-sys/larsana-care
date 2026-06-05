import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export interface AnalyticsStatCardProps {
  label: string
  value: number | string
  icon?: LucideIcon
  trend?: number
  trendLabel?: string
  href?: string
  isLoading?: boolean
}

function formatValue(value: number | string): string {
  if (typeof value === 'number') return new Intl.NumberFormat('pt-BR').format(value)
  return value
}

export function AnalyticsStatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel = 'período anterior',
  href,
  isLoading,
}: AnalyticsStatCardProps) {
  const trendUp = trend !== undefined && trend >= 0
  const displayValue = isLoading ? '—' : formatValue(value)

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card p-4 min-w-0 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
              <Icon size={18} className="text-foreground" />
            </div>
          )}
          <span className="text-sm font-medium text-muted-foreground truncate">{label}</span>
        </div>
        {href ? (
          <Link to={href} className="shrink-0 text-muted-foreground/50 hover:text-foreground transition-colors" aria-label={`Ver ${label}`}>
            <ArrowUpRight size={16} />
          </Link>
        ) : (
          <span className="shrink-0 text-muted-foreground/30"><ArrowUpRight size={16} /></span>
        )}
      </div>

      <div className="mt-auto">
        <p className={cn('text-2xl sm:text-[1.75rem] font-bold tabular-nums tracking-tight', isLoading && 'animate-pulse')}>
          {displayValue}
        </p>
        {trend !== undefined && !isLoading && (
          <p className="mt-1.5 text-xs">
            <span className={cn('font-semibold', trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive')}>
              {trendUp ? <ArrowUpRight size={12} className="inline -mt-0.5" /> : <ArrowDownRight size={12} className="inline -mt-0.5" />}
              {' '}{trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </span>
            <span className="text-muted-foreground"> {trendLabel}</span>
          </p>
        )}
      </div>
    </div>
  )
}
