import { Wallet } from 'lucide-react'
import { getPaymentStatusVisual } from '@/components/admin/finance/PaymentStatusVisual'
import type { StatCardItem } from '@/components/crud/list-page/StatsCardRow'
import { paymentStatusLabels } from '@/constants/labels'
import { formatCurrency } from '@/lib/formatters'
import type { ChargeListItem, PaymentStatus } from '@/services/charges'

const HIGHLIGHT_STATUSES: PaymentStatus[] = ['pendente', 'pago', 'vencido']

function countByStatus(rows: ChargeListItem[], status: PaymentStatus): number {
  return rows.filter((row) => row.payment_status === status).length
}

function sumByStatus(rows: ChargeListItem[], status: PaymentStatus): number {
  return rows
    .filter((row) => row.payment_status === status)
    .reduce((sum, row) => sum + row.amount_cents, 0)
}

function sumAmount(rows: ChargeListItem[]): number {
  return rows.reduce((sum, row) => sum + row.amount_cents, 0)
}

export function buildChargesStatCards(rows: ChargeListItem[]): StatCardItem[] {
  const total = rows.length
  const totalAmount = sumAmount(rows)

  const statusCards = HIGHLIGHT_STATUSES.map((status) => {
    const count = countByStatus(rows, status)
    const amount = sumByStatus(rows, status)
    const share = total > 0 ? `${Math.round((count / total) * 100)}% do total` : '—'

    return {
      label: paymentStatusLabels[status],
      value: count,
      icon: getPaymentStatusVisual(status).icon,
      footer: total > 0 ? `${formatCurrency(amount)} · ${share}` : formatCurrency(0),
    } satisfies StatCardItem
  })

  return [
    {
      label: 'Total',
      value: total,
      icon: Wallet,
      footer: total > 0 ? formatCurrency(totalAmount) : 'Nenhuma cobrança',
    },
    ...statusCards,
  ]
}
