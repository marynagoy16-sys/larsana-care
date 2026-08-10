import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Calendar,
  Receipt,
  RefreshCw,
  MoreHorizontal,
  ChevronRight,
  Stethoscope,
} from 'lucide-react'
import { AnalyticsStatCard } from '@/components/dashboard/AnalyticsStatCard'
import { DashboardLineChart } from '@/components/dashboard/DashboardLineChart'
import { DashboardDonutChart } from '@/components/dashboard/DashboardDonutChart'
import { DashboardPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDashboardKpis } from '@/hooks/queries/useDashboardKpis'
import { usePaidRevenue, useRecentCharges, useRevenueTrend } from '@/hooks/queries/useDashboardCharts'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { paymentStatusLabels } from '@/constants/labels'
import { cn } from '@/lib/utils'

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: 'PIX',
  boleto: 'Boleto',
  cartao: 'Cartão',
}

function computeTrend(values: number[]): number | undefined {
  if (values.length < 4) return undefined
  const mid = Math.floor(values.length / 2)
  const first = values.slice(0, mid).reduce((s, v) => s + v, 0)
  const second = values.slice(mid).reduce((s, v) => s + v, 0)
  if (first === 0) return second > 0 ? 100 : 0
  return ((second - first) / first) * 100
}

function StatusBadge({ status }: { status: string }) {
  const label = paymentStatusLabels[status] ?? status
  const isPaid = status === 'pago'
  const isPending = status === 'pendente'
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium',
        isPaid && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        isPending && 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
        !isPaid && !isPending && 'bg-destructive/10 text-destructive',
      )}
    >
      {label}
    </span>
  )
}

export function DashboardPage() {
  const { data: kpis, isLoading: kpisLoading, refetch: refetchKpis, isFetching } = useDashboardKpis()
  const { data: trend = [], isLoading: trendLoading, refetch: refetchTrend } = useRevenueTrend()
  const { data: paidRevenue = 0 } = usePaidRevenue()
  const { data: charges = [], isLoading: chargesLoading } = useRecentCharges()

  const revenueTrend = computeTrend(trend.map((p) => p.amountCents))

  const operacaoMetrics = useMemo(
    () => [
      { label: 'Pacientes ativos', value: kpis?.pacientes_ativos ?? 0, color: 'hsl(163.8 81.3% 18.8%)' },
      { label: 'Ciclos abertos', value: kpis?.ciclos_abertos ?? 0, color: 'hsl(100 40% 32%)' },
      { label: 'Avaliações em análise', value: kpis?.avaliacoes_em_analise ?? 0, color: 'hsl(80 22% 58%)' },
    ],
    [kpis],
  )

  const handleRefresh = () => {
    refetchKpis()
    refetchTrend()
  }

  const isInitialLoad = kpisLoading && !kpis
  const isRefreshing = isFetching && !isInitialLoad

  return (
    <CrudScrollPageLayout>
      {isInitialLoad ? (
        <DashboardPageSkeleton />
      ) : (
      <CascadeReveal className="space-y-6">
      <CascadeItem>
      <div className={cn('grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch transition-opacity', isRefreshing && 'opacity-60')}>
        <AnalyticsStatCard
          label="Pacientes ativos"
          value={kpis?.pacientes_ativos ?? 0}
          icon={Users}
          href="/admin/pacientes"
        />
        <AnalyticsStatCard
          label="Fisioterapeutas ativos"
          value={kpis?.fisioterapeutas_ativos ?? 0}
          icon={Stethoscope}
          href="/admin/profissionais"
        />
        <AnalyticsStatCard
          label="Ciclos abertos"
          value={kpis?.ciclos_abertos ?? 0}
          icon={Calendar}
          href="/admin/ciclos"
        />
        <AnalyticsStatCard
          label="Receita recebida"
          value={formatCurrency(paidRevenue)}
          icon={Receipt}
          trend={revenueTrend}
        />
      </div>
      </CascadeItem>

      <CascadeItem>
      <div className={cn('grid grid-cols-1 lg:grid-cols-3 gap-4 transition-opacity', isRefreshing && 'opacity-60')}>
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold">Receita — visão geral</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground border border-border rounded-md px-2.5 py-1.5">
                Últimos 30 dias
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleRefresh} disabled={isFetching}>
                <RefreshCw size={14} className={cn(isFetching && 'animate-spin')} />
              </Button>
            </div>
          </div>
          <div className="px-5 py-4">
            <div className="flex flex-wrap items-end gap-3 mb-4">
              <div>
                <p className="text-xs text-muted-foreground">Total recebido</p>
                <p className="text-2xl font-bold tabular-nums">{formatCurrency(paidRevenue)}</p>
              </div>
              {revenueTrend !== undefined && (
                <span className={cn(
                  'text-xs font-semibold rounded-full px-2 py-0.5',
                  revenueTrend >= 0 ? 'bg-emerald-500/10 text-emerald-700' : 'bg-destructive/10 text-destructive',
                )}>
                  {revenueTrend >= 0 ? '+' : ''}{revenueTrend.toFixed(1)}%
                </span>
              )}
            </div>
            {trendLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <DashboardLineChart data={trend} />
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold">Operação</h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/admin/pacientes">Ver pacientes</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin/ciclos">Ver ciclos</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex-1 flex flex-col justify-between p-5 min-h-[280px]">
            {kpisLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-16" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <DashboardDonutChart metrics={operacaoMetrics} />
            )}
            <p className="text-center text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
              {kpis?.alertas_abertos ?? 0} alertas operacionais pendentes
            </p>
          </div>
        </div>
      </div>
      </CascadeItem>

      <CascadeItem>
      <div className={cn('rounded-xl border border-border bg-card shadow-sm overflow-hidden transition-opacity', isRefreshing && 'opacity-60')}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold">Cobranças recentes</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {charges.length} registros exibidos neste período
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
              <Link to="/admin/cobrancas">Ver todas</Link>
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <MoreHorizontal size={14} />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">Paciente</th>
                <th className="px-5 py-3 font-medium">Valor</th>
                <th className="px-5 py-3 font-medium hidden sm:table-cell">Método</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Vencimento</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {chargesLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={6} className="px-5 py-3"><Skeleton className="h-5 w-full" /></td>
                  </tr>
                ))
              ) : charges.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                    Nenhuma cobrança registrada ainda.
                  </td>
                </tr>
              ) : (
                charges.map((charge) => (
                  <tr key={charge.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-5 py-3 font-medium">{charge.patient_name}</td>
                    <td className="px-5 py-3 tabular-nums">{formatCurrency(charge.amount_cents)}</td>
                    <td className="px-5 py-3 hidden sm:table-cell text-muted-foreground">
                      {charge.payment_method ? PAYMENT_METHOD_LABELS[charge.payment_method] ?? charge.payment_method : '—'}
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-muted-foreground">
                      {charge.due_date ? formatDate(charge.due_date) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={charge.payment_status} />
                    </td>
                    <td className="px-5 py-3">
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link to="/admin/cobrancas" aria-label="Ver cobrança">
                          <ChevronRight size={14} />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </CascadeItem>
      </CascadeReveal>
      )}

    </CrudScrollPageLayout>
  )
}
