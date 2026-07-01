import { listChargesByPeriod } from '@/services/charges'
import { listPendingTransfersAging } from '@/services/transfers'
import { getEffectivePaymentStatus } from '@/lib/formatters'
import { getMonthRange } from '@/lib/formatters'

export async function getFaturamentoData(monthKey: string) {
  const { start, end } = getMonthRange(monthKey)
  const charges = await listChargesByPeriod(start, end)

  let total = 0
  let pago = 0
  let pendente = 0
  let vencido = 0

  for (const charge of charges) {
    total += charge.amount_cents
    const status = getEffectivePaymentStatus(charge.payment_status, charge.due_date)
    if (status === 'pago') pago += charge.amount_cents
    else if (status === 'vencido') vencido += charge.amount_cents
    else if (status === 'pendente') pendente += charge.amount_cents
  }

  return { charges, total, pago, pendente, vencido, monthKey }
}

export async function getRepassesAgingData() {
  const transfers = await listPendingTransfersAging()
  const total = transfers.reduce((sum, t) => sum + t.pp_transfer_amount_cents, 0)
  return { transfers, total, count: transfers.length }
}
