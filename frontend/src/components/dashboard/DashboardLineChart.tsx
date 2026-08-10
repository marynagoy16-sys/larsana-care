import type { RevenueTrendPoint } from '@/services/dashboard'
import { formatCurrency } from '@/lib/formatters'
import { cn } from '@/lib/utils'

interface DashboardLineChartProps {
  data: RevenueTrendPoint[]
  className?: string
}

export function DashboardLineChart({ data, className }: DashboardLineChartProps) {
  const width = 640
  const height = 220
  const padding = { top: 16, right: 12, bottom: 28, left: 12 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const max = Math.max(...data.map((d) => d.amountCents), 0)
  const hasRevenue = max > 0
  const barCount = Math.max(data.length, 1)
  const gap = 3
  const barWidth = Math.max((innerW - gap * (barCount - 1)) / barCount, 2)

  const labelIndexes =
    data.length <= 7
      ? data.map((_, i) => i)
      : [0, Math.floor(data.length / 4), Math.floor(data.length / 2), Math.floor((3 * data.length) / 4), data.length - 1]

  const gridLines = hasRevenue ? [0.25, 0.5, 0.75, 1] : [1]

  return (
    <div className={cn('relative w-full', className)}>
      {!hasRevenue && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 rounded-lg bg-muted/30">
          <p className="text-sm font-medium text-muted-foreground">Sem recebimentos no período</p>
          <p className="text-xs text-muted-foreground/70">Os valores aparecerão aqui quando houver cobranças pagas</p>
        </div>
      )}

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[220px]" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="revenueBarFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(100 50% 28%)" />
            <stop offset="100%" stopColor="hsl(163.8 81.3% 18.8%)" />
          </linearGradient>
        </defs>

        {gridLines.map((ratio) => {
          const y = padding.top + innerH * (1 - ratio)
          return (
            <line
              key={ratio}
              x1={padding.left}
              y1={y}
              x2={padding.left + innerW}
              y2={y}
              stroke="hsl(var(--border))"
              strokeWidth="1"
              strokeDasharray={ratio < 1 ? '4 4' : undefined}
            />
          )
        })}

        {hasRevenue &&
          data.map((point, i) => {
            const barH = (point.amountCents / max) * innerH
            const x = padding.left + i * (barWidth + gap)
            const y = padding.top + innerH - barH
            const showLabel = labelIndexes.includes(i)

            return (
              <g key={`${point.label}-${i}`}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx={3}
                  fill="url(#revenueBarFill)"
                  opacity={point.amountCents > 0 ? 1 : 0.2}
                  className="transition-opacity hover:opacity-80"
                >
                  <title>{`${point.label}: ${formatCurrency(point.amountCents)}`}</title>
                </rect>
                {showLabel && (
                  <text
                    x={x + barWidth / 2}
                    y={height - 6}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[10px]"
                  >
                    {point.label}
                  </text>
                )}
              </g>
            )
          })}
      </svg>
    </div>
  )
}
