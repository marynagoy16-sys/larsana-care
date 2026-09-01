import { useMemo, type ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import {
  buildFaturamentoByKind,
  buildFaturamentoByPaymentMethod,
  buildFaturamentoCompareTrend,
  buildFaturamentoMonthComparison,
  buildFaturamentoMonthlyTrend,
  buildFaturamentoStatusBreakdown,
  FATURAMENTO_CHART_STATUSES,
  FATURAMENTO_COMPARE_COLORS,
  FATURAMENTO_STATUS_COLORS,
  sumFaturamentoAmount,
  type FaturamentoCategorySlice,
  type FaturamentoComparePoint,
  type FaturamentoMonthComparison,
  type FaturamentoMonthlyPoint,
  type FaturamentoStatusSlice,
} from '@/lib/faturamentoCharts'
import { formatCurrency } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { ChargeListItem } from '@/services/charges'

type FaturamentoChartsProps = {
  rows: ChargeListItem[]
  className?: string
}

export function FaturamentoCharts({ rows, className }: FaturamentoChartsProps) {
  const monthly = useMemo(() => buildFaturamentoMonthlyTrend(rows), [rows])
  const compare = useMemo(() => buildFaturamentoCompareTrend(rows), [rows])
  const breakdown = useMemo(() => buildFaturamentoStatusBreakdown(rows), [rows])
  const monthComparison = useMemo(() => buildFaturamentoMonthComparison(rows), [rows])
  const byKind = useMemo(() => buildFaturamentoByKind(rows), [rows])
  const byPaymentMethod = useMemo(() => buildFaturamentoByPaymentMethod(rows), [rows])
  const total = useMemo(() => sumFaturamentoAmount(rows), [rows])

  return (
    <div className={cn('space-y-4', className)}>
      <FaturamentoMonthComparisonStrip comparison={monthComparison} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title="Faturamento por mês"
          description="Últimos 6 meses · composição por status"
        >
          <FaturamentoMonthlyChart data={monthly} />
        </ChartCard>

        <ChartCard title="Composição por status" description="Distribuição do faturamento filtrado">
          <div className="mb-4">
            <p className="text-xs text-muted-foreground">Total faturado</p>
            <p className="text-2xl font-bold tabular-nums">{formatCurrency(total)}</p>
          </div>
          <FaturamentoStatusBreakdown slices={breakdown} totalCents={total} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title="Emitido vs recebido"
          description="Comparativo mensal · emissão x caixa recebido"
        >
          <FaturamentoCompareChart data={compare} />
        </ChartCard>

        <ChartCard title="Taxa de recebimento" description="% do emitido já recebido no mês">
          <FaturamentoCollectionRateChart data={compare} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ChartCard title="Por tipo de cobrança" description="Comparativo por origem do faturamento">
          <FaturamentoCategoryBreakdown slices={byKind} emptyLabel="Nenhuma cobrança por tipo." />
        </ChartCard>

        <ChartCard title="Por forma de pagamento" description="Comparativo PIX x Boleto">
          <FaturamentoCategoryBreakdown slices={byPaymentMethod} emptyLabel="Nenhuma cobrança com forma definida." />
        </ChartCard>
      </div>
    </div>
  )
}

function ChartCard({
  title,
  description,
  children,
  className,
}: {
  title: string
  description: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-card shadow-sm', className)}>
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function FaturamentoMonthComparisonStrip({ comparison }: { comparison: FaturamentoMonthComparison }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <ComparisonCard
        label="Faturamento"
        current={comparison.faturado.current}
        previous={comparison.faturado.previous}
        deltaPct={comparison.faturado.deltaPct}
        currentLabel={comparison.currentLabel}
        previousLabel={comparison.previousLabel}
        formatValue={formatCurrency}
      />
      <ComparisonCard
        label="Recebido"
        current={comparison.recebido.current}
        previous={comparison.recebido.previous}
        deltaPct={comparison.recebido.deltaPct}
        currentLabel={comparison.currentLabel}
        previousLabel={comparison.previousLabel}
        formatValue={formatCurrency}
      />
      <ComparisonCard
        label="Taxa de recebimento"
        current={comparison.taxaRecebimento.current}
        previous={comparison.taxaRecebimento.previous}
        deltaPct={comparison.taxaRecebimento.deltaPct}
        currentLabel={comparison.currentLabel}
        previousLabel={comparison.previousLabel}
        formatValue={(value) => `${value}%`}
        deltaSuffix=" p.p."
      />
    </div>
  )
}

function ComparisonCard({
  label,
  current,
  previous,
  deltaPct,
  currentLabel,
  previousLabel,
  formatValue,
  deltaSuffix = '%',
}: {
  label: string
  current: number
  previous: number
  deltaPct: number | null
  currentLabel: string
  previousLabel: string
  formatValue: (value: number) => string
  deltaSuffix?: string
}) {
  const trend = deltaPct == null ? 'neutral' : deltaPct > 0 ? 'up' : deltaPct < 0 ? 'down' : 'neutral'
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <div>
          <p className="text-xl font-bold tabular-nums">{formatValue(current)}</p>
          <p className="mt-0.5 text-[11px] capitalize text-muted-foreground">{currentLabel}</p>
        </div>
        <div
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
            trend === 'up' && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
            trend === 'down' && 'bg-red-500/10 text-red-700 dark:text-red-400',
            trend === 'neutral' && 'bg-muted text-muted-foreground',
          )}
        >
          <TrendIcon className="size-3" />
          {deltaPct == null ? '—' : `${deltaPct > 0 ? '+' : ''}${Math.round(deltaPct)}${deltaSuffix}`}
        </div>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Mês anterior: {formatValue(previous)} · <span className="capitalize">{previousLabel}</span>
      </p>
    </div>
  )
}

function FaturamentoMonthlyChart({ data }: { data: FaturamentoMonthlyPoint[] }) {
  const width = 640
  const height = 220
  const padding = { top: 16, right: 12, bottom: 28, left: 12 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const max = Math.max(...data.map((point) => point.totalCents), 0)
  const hasData = max > 0
  const barCount = Math.max(data.length, 1)
  const gap = 8
  const barWidth = Math.max((innerW - gap * (barCount - 1)) / barCount, 12)
  const gridLines = hasData ? [0.25, 0.5, 0.75, 1] : [1]

  return (
    <div className="relative w-full">
      {!hasData && <ChartEmptyState message="Sem faturamento no período" />}

      <svg viewBox={`0 0 ${width} ${height}`} className="h-[220px] w-full" preserveAspectRatio="xMidYMid meet">
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

        {hasData &&
          data.map((point, index) => {
            const x = padding.left + index * (barWidth + gap)
            const segments = FATURAMENTO_CHART_STATUSES.map((status) => ({
              status,
              amount:
                status === 'pago'
                  ? point.pagoCents
                  : status === 'pendente'
                    ? point.pendenteCents
                    : point.vencidoCents,
              color: FATURAMENTO_STATUS_COLORS[status],
            }))

            let offsetY = padding.top + innerH

            return (
              <g key={point.monthKey}>
                {segments.map((segment) => {
                  if (segment.amount <= 0) return null
                  const segmentHeight = (segment.amount / max) * innerH
                  offsetY -= segmentHeight
                  return (
                    <rect
                      key={`${point.monthKey}-${segment.status}`}
                      x={x}
                      y={offsetY}
                      width={barWidth}
                      height={segmentHeight}
                      fill={segment.color}
                      className="transition-opacity hover:opacity-80"
                    >
                      <title>{`${point.label} · ${segment.status}: ${formatCurrency(segment.amount)}`}</title>
                    </rect>
                  )
                })}
                <text
                  x={x + barWidth / 2}
                  y={height - 6}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px] capitalize"
                >
                  {point.label}
                </text>
              </g>
            )
          })}
      </svg>

      <ChartLegend
        items={FATURAMENTO_CHART_STATUSES.map((status) => ({
          color: FATURAMENTO_STATUS_COLORS[status],
          label: status === 'pago' ? 'Recebido' : status === 'pendente' ? 'Em aberto' : 'Vencido',
        }))}
      />
    </div>
  )
}

function FaturamentoCompareChart({ data }: { data: FaturamentoComparePoint[] }) {
  const width = 640
  const height = 220
  const padding = { top: 16, right: 12, bottom: 28, left: 12 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const max = Math.max(...data.flatMap((point) => [point.emitidoCents, point.recebidoCents]), 0)
  const hasData = max > 0
  const groupCount = Math.max(data.length, 1)
  const groupGap = 10
  const groupWidth = Math.max((innerW - groupGap * (groupCount - 1)) / groupCount, 24)
  const barGap = 3
  const barWidth = Math.max((groupWidth - barGap) / 2, 8)

  return (
    <div className="relative w-full">
      {!hasData && <ChartEmptyState message="Sem dados comparativos no período" />}

      <svg viewBox={`0 0 ${width} ${height}`} className="h-[220px] w-full" preserveAspectRatio="xMidYMid meet">
        {[0.25, 0.5, 0.75, 1].map((ratio) => {
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

        {hasData &&
          data.map((point, index) => {
            const groupX = padding.left + index * (groupWidth + groupGap)
            const bars = [
              { key: 'emitido', amount: point.emitidoCents, color: FATURAMENTO_COMPARE_COLORS.emitido, label: 'Emitido' },
              { key: 'recebido', amount: point.recebidoCents, color: FATURAMENTO_COMPARE_COLORS.recebido, label: 'Recebido' },
            ]

            return (
              <g key={point.monthKey}>
                {bars.map((bar, barIndex) => {
                  const barHeight = (bar.amount / max) * innerH
                  const x = groupX + barIndex * (barWidth + barGap)
                  const y = padding.top + innerH - barHeight
                  return (
                    <rect
                      key={`${point.monthKey}-${bar.key}`}
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx={3}
                      fill={bar.color}
                      className="transition-opacity hover:opacity-80"
                    >
                      <title>{`${point.label} · ${bar.label}: ${formatCurrency(bar.amount)}`}</title>
                    </rect>
                  )
                })}
                <text
                  x={groupX + groupWidth / 2}
                  y={height - 6}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px] capitalize"
                >
                  {point.label}
                </text>
              </g>
            )
          })}
      </svg>

      <ChartLegend
        items={[
          { color: FATURAMENTO_COMPARE_COLORS.emitido, label: 'Emitido' },
          { color: FATURAMENTO_COMPARE_COLORS.recebido, label: 'Recebido' },
        ]}
      />
    </div>
  )
}

function FaturamentoCollectionRateChart({ data }: { data: FaturamentoComparePoint[] }) {
  const width = 320
  const height = 220
  const padding = { top: 16, right: 12, bottom: 28, left: 28 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom
  const hasData = data.some((point) => point.emitidoCents > 0)
  const maxRate = 100

  const points = data
    .map((point, index) => {
      const x = padding.left + (index / Math.max(data.length - 1, 1)) * innerW
      const y = padding.top + innerH - (point.taxaRecebimento / maxRate) * innerH
      return { ...point, x, y }
    })

  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')

  return (
    <div className="relative w-full">
      {!hasData && <ChartEmptyState message="Sem taxa calculável no período" />}

      <svg viewBox={`0 0 ${width} ${height}`} className="h-[220px] w-full" preserveAspectRatio="xMidYMid meet">
        {[0, 25, 50, 75, 100].map((rate) => {
          const y = padding.top + innerH - (rate / maxRate) * innerH
          return (
            <g key={rate}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + innerW}
                y2={y}
                stroke="hsl(var(--border))"
                strokeWidth="1"
                strokeDasharray={rate < 100 ? '4 4' : undefined}
              />
              <text x={padding.left - 6} y={y + 3} textAnchor="end" className="fill-muted-foreground text-[9px]">
                {rate}%
              </text>
            </g>
          )
        })}

        {hasData && (
          <>
            <path d={linePath} fill="none" stroke={FATURAMENTO_COMPARE_COLORS.taxa} strokeWidth="2.5" strokeLinecap="round" />
            {points.map((point) => (
              <g key={point.monthKey}>
                <circle cx={point.x} cy={point.y} r={4} fill={FATURAMENTO_COMPARE_COLORS.taxa} />
                <text
                  x={point.x}
                  y={height - 6}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px] capitalize"
                >
                  {point.label}
                </text>
                <title>{`${point.label}: ${point.taxaRecebimento}% recebido do emitido`}</title>
              </g>
            ))}
          </>
        )}
      </svg>
    </div>
  )
}

function FaturamentoStatusBreakdown({
  slices,
  totalCents,
}: {
  slices: FaturamentoStatusSlice[]
  totalCents: number
}) {
  const max = Math.max(...slices.map((slice) => slice.amountCents), 1)

  if (totalCents <= 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma cobrança no filtro atual.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {slices.map((slice) => {
        const pct = Math.round((slice.amountCents / totalCents) * 100)
        const barPct = (slice.amountCents / max) * 100

        return (
          <div key={slice.status} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-foreground">{slice.label}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {formatCurrency(slice.amountCents)} ({pct}%)
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${barPct}%`,
                  backgroundColor: slice.color,
                  minWidth: slice.amountCents > 0 ? '0.5rem' : 0,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function FaturamentoCategoryBreakdown({
  slices,
  emptyLabel,
}: {
  slices: FaturamentoCategorySlice[]
  emptyLabel: string
}) {
  const total = slices.reduce((sum, slice) => sum + slice.amountCents, 0)
  const max = Math.max(...slices.map((slice) => slice.amountCents), 1)

  if (total <= 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {slices.map((slice) => {
        const pct = Math.round((slice.amountCents / total) * 100)
        const barPct = (slice.amountCents / max) * 100

        return (
          <div key={slice.key} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-foreground">{slice.label}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {formatCurrency(slice.amountCents)} ({pct}%)
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${barPct}%`,
                  backgroundColor: slice.color,
                  minWidth: slice.amountCents > 0 ? '0.5rem' : 0,
                }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {slice.count} cobrança{slice.count === 1 ? '' : 's'}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function ChartLegend({ items }: { items: Array<{ color: string; label: string }> }) {
  return (
    <div className="mt-3 flex flex-wrap gap-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />
          {item.label}
        </div>
      ))}
    </div>
  )
}

function ChartEmptyState({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 rounded-lg bg-muted/30">
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  )
}
