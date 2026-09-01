import { subMonths, startOfMonth, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CHARGE_KIND_LABELS, PAYMENT_METHOD_LABELS } from '@/services/charges'
import type { ChargeKind, ChargeListItem, PaymentMethod, PaymentStatus } from '@/services/charges'

export const FATURAMENTO_CHART_STATUSES: PaymentStatus[] = ['pago', 'pendente', 'vencido']

export const FATURAMENTO_STATUS_COLORS: Record<(typeof FATURAMENTO_CHART_STATUSES)[number], string> = {
  pago: 'hsl(163.8 81.3% 28%)',
  pendente: 'hsl(38 92% 50%)',
  vencido: 'hsl(0 72% 51%)',
}

export const FATURAMENTO_COMPARE_COLORS = {
  emitido: 'hsl(215 16% 47%)',
  recebido: 'hsl(163.8 81.3% 28%)',
  taxa: 'hsl(200 80% 45%)',
} as const

export const CHARGE_KIND_COLORS: Record<ChargeKind, string> = {
  cycle: 'hsl(163.8 81.3% 28%)',
  assessment_fee: 'hsl(200 80% 45%)',
  assessment_request: 'hsl(270 55% 52%)',
}

export const PAYMENT_METHOD_COLORS: Record<PaymentMethod, string> = {
  PIX: 'hsl(163.8 81.3% 28%)',
  BOLETO: 'hsl(38 92% 50%)',
}

export type FaturamentoMonthlyPoint = {
  monthKey: string
  label: string
  totalCents: number
  pagoCents: number
  pendenteCents: number
  vencidoCents: number
}

export type FaturamentoComparePoint = {
  monthKey: string
  label: string
  emitidoCents: number
  recebidoCents: number
  taxaRecebimento: number
}

export type FaturamentoStatusSlice = {
  status: (typeof FATURAMENTO_CHART_STATUSES)[number]
  label: string
  amountCents: number
  color: string
}

export type FaturamentoCategorySlice = {
  key: string
  label: string
  amountCents: number
  count: number
  color: string
}

export type FaturamentoMonthComparison = {
  currentLabel: string
  previousLabel: string
  faturado: { current: number; previous: number; deltaPct: number | null }
  recebido: { current: number; previous: number; deltaPct: number | null }
  taxaRecebimento: { current: number; previous: number; deltaPct: number | null }
}

const STATUS_LABELS: Record<(typeof FATURAMENTO_CHART_STATUSES)[number], string> = {
  pago: 'Recebido',
  pendente: 'Em aberto',
  vencido: 'Vencido',
}

function billableRows(rows: ChargeListItem[]): ChargeListItem[] {
  return rows.filter((row) => row.payment_status !== 'cancelado')
}

function monthKeyFromDate(iso: string): string {
  return iso.slice(0, 7)
}

function buildMonthBuckets(months: number): Map<string, { monthKey: string; label: string }> {
  const now = startOfMonth(new Date())
  const buckets = new Map<string, { monthKey: string; label: string }>()

  for (let i = months - 1; i >= 0; i -= 1) {
    const monthDate = subMonths(now, i)
    const monthKey = format(monthDate, 'yyyy-MM')
    buckets.set(monthKey, {
      monthKey,
      label: format(monthDate, 'MMM yy', { locale: ptBR }),
    })
  }

  return buckets
}

function computeDeltaPct(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : null
  return ((current - previous) / previous) * 100
}

export function buildFaturamentoMonthlyTrend(
  rows: ChargeListItem[],
  months = 6,
): FaturamentoMonthlyPoint[] {
  const billable = billableRows(rows)
  const buckets = buildMonthBuckets(months)
  const points = new Map<string, FaturamentoMonthlyPoint>()

  for (const { monthKey, label } of buckets.values()) {
    points.set(monthKey, {
      monthKey,
      label,
      totalCents: 0,
      pagoCents: 0,
      pendenteCents: 0,
      vencidoCents: 0,
    })
  }

  for (const row of billable) {
    const monthKey = monthKeyFromDate(row.created_at)
    const bucket = points.get(monthKey)
    if (!bucket) continue

    bucket.totalCents += row.amount_cents
    if (row.payment_status === 'pago') bucket.pagoCents += row.amount_cents
    if (row.payment_status === 'pendente') bucket.pendenteCents += row.amount_cents
    if (row.payment_status === 'vencido') bucket.vencidoCents += row.amount_cents
  }

  return [...points.values()]
}

export function buildFaturamentoCompareTrend(
  rows: ChargeListItem[],
  months = 6,
): FaturamentoComparePoint[] {
  const billable = billableRows(rows)
  const buckets = buildMonthBuckets(months)
  const points = new Map<string, FaturamentoComparePoint>()

  for (const { monthKey, label } of buckets.values()) {
    points.set(monthKey, {
      monthKey,
      label,
      emitidoCents: 0,
      recebidoCents: 0,
      taxaRecebimento: 0,
    })
  }

  for (const row of billable) {
    const emitMonth = monthKeyFromDate(row.created_at)
    const emitBucket = points.get(emitMonth)
    if (emitBucket) {
      emitBucket.emitidoCents += row.amount_cents
    }

    if (row.payment_status === 'pago') {
      const paidAt = row.paid_at ?? row.created_at
      const receiveMonth = monthKeyFromDate(paidAt)
      const receiveBucket = points.get(receiveMonth)
      if (receiveBucket) {
        receiveBucket.recebidoCents += row.amount_cents
      }
    }
  }

  for (const point of points.values()) {
    const emittedPaid = billable
      .filter((row) => monthKeyFromDate(row.created_at) === point.monthKey && row.payment_status === 'pago')
      .reduce((sum, row) => sum + row.amount_cents, 0)
    point.taxaRecebimento = point.emitidoCents > 0 ? Math.round((emittedPaid / point.emitidoCents) * 100) : 0
  }

  return [...points.values()]
}

export function buildFaturamentoMonthComparison(rows: ChargeListItem[]): FaturamentoMonthComparison {
  const billable = billableRows(rows)
  const now = startOfMonth(new Date())
  const currentKey = format(now, 'yyyy-MM')
  const previousKey = format(subMonths(now, 1), 'yyyy-MM')
  const currentLabel = format(now, 'MMMM yyyy', { locale: ptBR })
  const previousLabel = format(subMonths(now, 1), 'MMMM yyyy', { locale: ptBR })

  const sumByEmitMonth = (monthKey: string) =>
    billable
      .filter((row) => monthKeyFromDate(row.created_at) === monthKey)
      .reduce((sum, row) => sum + row.amount_cents, 0)

  const sumReceivedByMonth = (monthKey: string) =>
    billable
      .filter((row) => {
        if (row.payment_status !== 'pago') return false
        const paidAt = row.paid_at ?? row.created_at
        return monthKeyFromDate(paidAt) === monthKey
      })
      .reduce((sum, row) => sum + row.amount_cents, 0)

  const taxaByEmitMonth = (monthKey: string) => {
    const emitted = sumByEmitMonth(monthKey)
    if (emitted <= 0) return 0
    const paid = billable
      .filter((row) => monthKeyFromDate(row.created_at) === monthKey && row.payment_status === 'pago')
      .reduce((sum, row) => sum + row.amount_cents, 0)
    return Math.round((paid / emitted) * 100)
  }

  const currentFaturado = sumByEmitMonth(currentKey)
  const previousFaturado = sumByEmitMonth(previousKey)
  const currentRecebido = sumReceivedByMonth(currentKey)
  const previousRecebido = sumReceivedByMonth(previousKey)
  const currentTaxa = taxaByEmitMonth(currentKey)
  const previousTaxa = taxaByEmitMonth(previousKey)

  return {
    currentLabel,
    previousLabel,
    faturado: {
      current: currentFaturado,
      previous: previousFaturado,
      deltaPct: computeDeltaPct(currentFaturado, previousFaturado),
    },
    recebido: {
      current: currentRecebido,
      previous: previousRecebido,
      deltaPct: computeDeltaPct(currentRecebido, previousRecebido),
    },
    taxaRecebimento: {
      current: currentTaxa,
      previous: previousTaxa,
      deltaPct: currentTaxa - previousTaxa,
    },
  }
}

export function buildFaturamentoByKind(rows: ChargeListItem[]): FaturamentoCategorySlice[] {
  const billable = billableRows(rows)
  const kinds: ChargeKind[] = ['cycle', 'assessment_fee', 'assessment_request']

  return kinds
    .map((kind) => {
      const kindRows = billable.filter((row) => row.charge_kind === kind)
      return {
        key: kind,
        label: CHARGE_KIND_LABELS[kind],
        amountCents: kindRows.reduce((sum, row) => sum + row.amount_cents, 0),
        count: kindRows.length,
        color: CHARGE_KIND_COLORS[kind],
      }
    })
    .filter((slice) => slice.amountCents > 0 || slice.count > 0)
    .sort((a, b) => b.amountCents - a.amountCents)
}

export function buildFaturamentoByPaymentMethod(rows: ChargeListItem[]): FaturamentoCategorySlice[] {
  const billable = billableRows(rows)
  const methods: PaymentMethod[] = ['PIX', 'BOLETO']

  return methods
    .map((method) => {
      const methodRows = billable.filter((row) => row.payment_method === method)
      return {
        key: method,
        label: PAYMENT_METHOD_LABELS[method],
        amountCents: methodRows.reduce((sum, row) => sum + row.amount_cents, 0),
        count: methodRows.length,
        color: PAYMENT_METHOD_COLORS[method],
      }
    })
    .filter((slice) => slice.amountCents > 0 || slice.count > 0)
    .sort((a, b) => b.amountCents - a.amountCents)
}

export function buildFaturamentoStatusBreakdown(rows: ChargeListItem[]): FaturamentoStatusSlice[] {
  const billable = billableRows(rows)

  return FATURAMENTO_CHART_STATUSES.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    amountCents: billable
      .filter((row) => row.payment_status === status)
      .reduce((sum, row) => sum + row.amount_cents, 0),
    color: FATURAMENTO_STATUS_COLORS[status],
  }))
}

export function sumFaturamentoAmount(rows: ChargeListItem[]): number {
  return billableRows(rows).reduce((sum, row) => sum + row.amount_cents, 0)
}
