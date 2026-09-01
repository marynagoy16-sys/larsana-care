import { supabase } from '@/lib/supabase'

export type CashFlowSummary = {
  monthKey: string
  receivedCents: number
  receivedCount: number
  receivableCents: number
  receivableCount: number
  toTransferCents: number
  toTransferCount: number
  transferredCents: number
  transferredCount: number
  marginCents: number
  expensesCents: number
  expensesCount: number
  retainedCents: number
}

const PENDING_TRANSFER_STATUSES = [
  'aguardando_nf',
  'aguardando_validacao',
  'liberado',
  'falhou',
] as const

function monthBounds(monthKey: string): { start: string; end: string } {
  const [year, month] = monthKey.split('-').map(Number)
  const nextYear = month === 12 ? year + 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  return {
    start: `${monthKey}-01T00:00:00.000Z`,
    end: `${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00.000Z`,
  }
}

function sumAmounts(rows: { amount_cents?: number; pp_transfer_amount_cents?: number }[], key: 'amount_cents' | 'pp_transfer_amount_cents' = 'amount_cents') {
  return rows.reduce((sum, row) => sum + Number(row[key] ?? 0), 0)
}

export async function fetchCashFlowSummary(monthKey: string): Promise<CashFlowSummary> {
  const { start, end } = monthBounds(monthKey)

  const [
    paidChargesRes,
    openChargesRes,
    pendingTransfersRes,
    pendingSubRes,
    transferredRes,
    transferredSubRes,
    expensesRes,
  ] = await Promise.all([
    supabase
      .from('charges')
      .select('amount_cents')
      .eq('payment_status', 'pago')
      .gte('paid_at', start)
      .lt('paid_at', end),
    supabase
      .from('charges')
      .select('amount_cents')
      .in('payment_status', ['pendente', 'vencido']),
    supabase
      .from('transfers')
      .select('pp_transfer_amount_cents')
      .in('status', [...PENDING_TRANSFER_STATUSES]),
    supabase
      .from('sub_pp_repasses')
      .select('amount_cents')
      .in('status', [...PENDING_TRANSFER_STATUSES]),
    supabase
      .from('transfers')
      .select('pp_transfer_amount_cents, larsana_margin_cents')
      .eq('status', 'transferido')
      .gte('transferred_at', start)
      .lt('transferred_at', end),
    supabase
      .from('sub_pp_repasses')
      .select('amount_cents')
      .eq('status', 'transferido')
      .gte('transferred_at', start)
      .lt('transferred_at', end),
    supabase.from('internal_expenses').select('amount_cents').eq('reference_month', monthKey),
  ])

  for (const res of [
    paidChargesRes,
    openChargesRes,
    pendingTransfersRes,
    pendingSubRes,
    transferredRes,
    transferredSubRes,
    expensesRes,
  ]) {
    if (res.error) throw res.error
  }

  const paidCharges = paidChargesRes.data ?? []
  const openCharges = openChargesRes.data ?? []
  const pendingTransfers = pendingTransfersRes.data ?? []
  const pendingSub = pendingSubRes.data ?? []
  const transferred = transferredRes.data ?? []
  const transferredSub = transferredSubRes.data ?? []
  const expenses = expensesRes.data ?? []

  const receivedCents = sumAmounts(paidCharges)
  const transferredCents =
    sumAmounts(transferred, 'pp_transfer_amount_cents') + sumAmounts(transferredSub)
  const marginCents = transferred.reduce((sum, row) => sum + Number(row.larsana_margin_cents ?? 0), 0)
  const expensesCents = sumAmounts(expenses)
  const toTransferCents =
    sumAmounts(pendingTransfers, 'pp_transfer_amount_cents') + sumAmounts(pendingSub)

  return {
    monthKey,
    receivedCents,
    receivedCount: paidCharges.length,
    receivableCents: sumAmounts(openCharges),
    receivableCount: openCharges.length,
    toTransferCents,
    toTransferCount: pendingTransfers.length + pendingSub.length,
    transferredCents,
    transferredCount: transferred.length + transferredSub.length,
    marginCents,
    expensesCents,
    expensesCount: expenses.length,
    retainedCents: receivedCents - transferredCents - expensesCents,
  }
}

export async function listInternalExpensesByMonth(monthKey: string) {
  const { data, error } = await supabase
    .from('internal_expenses')
    .select('id, expense_type, amount_cents, reference_month, notes, created_at')
    .eq('reference_month', monthKey)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export type InternalExpenseRow = Awaited<ReturnType<typeof listInternalExpensesByMonth>>[number]
