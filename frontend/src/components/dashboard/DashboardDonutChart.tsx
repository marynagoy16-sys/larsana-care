import { cn } from '@/lib/utils'

export interface OperationMetric {
  label: string
  value: number
  color: string
}

interface DashboardDonutChartProps {
  metrics: OperationMetric[]
  className?: string
}

export function DashboardDonutChart({ metrics, className }: DashboardDonutChartProps) {
  const max = Math.max(...metrics.map((m) => m.value), 1)
  const total = metrics.reduce((sum, m) => sum + m.value, 0)

  return (
    <div className={cn('flex flex-col gap-5 w-full', className)}>
      <div className="flex items-baseline justify-between gap-3 px-1">
        <p className="text-3xl font-bold tabular-nums">{total}</p>
        <p className="text-xs text-muted-foreground text-right leading-snug">
          indicadores operacionais no total
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {metrics.map((metric) => {
          const pct = max > 0 ? (metric.value / max) * 100 : 0
          return (
            <div key={metric.label} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-foreground truncate">{metric.label}</span>
                <span className="tabular-nums text-muted-foreground shrink-0">{metric.value}</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: metric.color,
                    minWidth: metric.value > 0 ? '0.5rem' : 0,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-3 pt-1">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-2 w-2 rounded-sm shrink-0" style={{ backgroundColor: metric.color }} />
            {metric.label}
          </div>
        ))}
      </div>
    </div>
  )
}
