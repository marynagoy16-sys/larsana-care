import { supabase } from '@/lib/supabase'
import { getMonthRange, getCurrentMonthKey } from '@/lib/formatters'
import { getLatestDelumaExport } from '@/services/deluma'
import { sumExpensesForCurrentMonth } from '@/services/expenses'
import { listRecentCharges } from '@/services/charges'
import { listPendingTransfers } from '@/services/transfers'
import { getEffectivePaymentStatus } from '@/lib/formatters'

export type FinanceKpis = {
  chargesMonthTotal: number
  chargesPaidTotal: number
  chargesOpenTotal: number
  chargesMonthCount: number
  chargesPaidCount: number
  chargesOpenCount: number
  pendingTransfersCount: number
  pendingTransfersTotal: number
  expensesMonthTotal: number
  lastDelumaExport: { reference_month: string; generated_at: string } | null
  recentCharges: Awaited<ReturnType<typeof listRecentCharges>>
  recentPendingTransfers: Awaited<ReturnType<typeof listPendingTransfers>>
}

export async function getFinanceKpis(): Promise<FinanceKpis> {
  const monthKey = getCurrentMonthKey()
  const { start, end } = getMonthRange(monthKey)

  const [chargesRes, transfersRes, expensesMonth, lastDeluma, recentCharges, recentPendingTransfers] =
    await Promise.all([
      supabase
        .from('charges')
        .select('amount_cents, payment_status, due_date')
        .gte('created_at', `${start}T00:00:00`)
        .lte('created_at', `${end}T23:59:59`),
      supabase
        .from('transfers')
        .select('pp_transfer_amount_cents')
        .neq('status', 'transferido'),
      sumExpensesForCurrentMonth(),
      getLatestDelumaExport(),
      listRecentCharges(5),
      listPendingTransfers(5),
    ])

  if (chargesRes.error) throw chargesRes.error
  if (transfersRes.error) throw transfersRes.error

  const charges = chargesRes.data ?? []
  let chargesMonthTotal = 0
  let chargesPaidTotal = 0
  let chargesOpenTotal = 0
  let chargesPaidCount = 0
  let chargesOpenCount = 0

  for (const c of charges) {
    chargesMonthTotal += c.amount_cents
    const status = getEffectivePaymentStatus(c.payment_status, c.due_date)
    if (status === 'pago') {
      chargesPaidTotal += c.amount_cents
      chargesPaidCount += 1
    } else if (status === 'pendente' || status === 'vencido') {
      chargesOpenTotal += c.amount_cents
      chargesOpenCount += 1
    }
  }

  const pendingTransfers = transfersRes.data ?? []
  const pendingTransfersTotal = pendingTransfers.reduce(
    (sum, t) => sum + Number(t.pp_transfer_amount_cents),
    0,
  )

  return {
    chargesMonthTotal,
    chargesPaidTotal,
    chargesOpenTotal,
    chargesMonthCount: charges.length,
    chargesPaidCount,
    chargesOpenCount,
    pendingTransfersCount: pendingTransfers.length,
    pendingTransfersTotal,
    expensesMonthTotal: expensesMonth,
    lastDelumaExport: lastDeluma
      ? { reference_month: lastDeluma.reference_month, generated_at: lastDeluma.generated_at }
      : null,
    recentCharges,
    recentPendingTransfers,
  }
}
