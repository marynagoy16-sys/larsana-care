import { TrendingUp } from 'lucide-react'
import { getPaymentStatusVisual } from '@/components/admin/finance/PaymentStatusVisual'
import type { StatCardItem } from '@/components/crud/list-page/StatsCardRow'
import { formatCurrency } from '@/lib/formatters'
import type { ChargeListItem, PaymentStatus } from '@/services/charges'

const REVENUE_STATUSES = ['pago', 'pendente', 'vencido'] as const satisfies readonly PaymentStatus[]

const FATURAMENTO_STATUS_LABELS: Record<(typeof REVENUE_STATUSES)[number], string> = {
  pago: 'Recebido',
  pendente: 'Em aberto',
  vencido: 'Vencido',
}

function billableRows(rows: ChargeListItem[]): ChargeListItem[] {
  return rows.filter((row) => row.payment_status !== 'cancelado')
}

function sumAmount(rows: ChargeListItem[]): number {
  return rows.reduce((sum, row) => sum + row.amount_cents, 0)
}

function shareOfTotal(amount: number, total: number): string {
  if (total <= 0) return '—'
  return `${Math.round((amount / total) * 100)}% do faturado`
}

export function buildFaturamentoStatCards(rows: ChargeListItem[]): StatCardItem[] {
  const billable = billableRows(rows)
  const totalAmount = sumAmount(billable)
  const totalCount = billable.length

  const statusCards = REVENUE_STATUSES.map((status) => {
    const statusRows = billable.filter((row) => row.payment_status === status)
    const amount = sumAmount(statusRows)
    const count = statusRows.length

    return {
      label: FATURAMENTO_STATUS_LABELS[status],
      value: formatCurrency(amount),
      icon: getPaymentStatusVisual(status).icon,
      footer:
        totalCount > 0
          ? `${count} cobrança${count === 1 ? '' : 's'} · ${shareOfTotal(amount, totalAmount)}`
          : `${count} cobrança${count === 1 ? '' : 's'}`,
    } satisfies StatCardItem
  })

  return [
    {
      label: 'Faturamento',
      value: formatCurrency(totalAmount),
      icon: TrendingUp,
      footer: totalCount > 0 ? `${totalCount} cobranças emitidas` : 'Nenhuma cobrança',
    },
    ...statusCards,
  ]
}
