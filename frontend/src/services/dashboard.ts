import { subDays } from 'date-fns'
import { supabase } from '@/lib/supabase'

export interface RevenueTrendPoint {
  label: string
  amountCents: number
}

export interface RecentChargeRow {
  id: string
  amount_cents: number
  payment_status: string
  payment_method: string | null
  due_date: string | null
  created_at: string
  patient_name: string
}

function groupChargesByDay(
  rows: { amount_cents: number; created_at: string }[],
  days: number,
): RevenueTrendPoint[] {
  const buckets = new Map<string, number>()
  const now = new Date()

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = subDays(now, i)
    const key = d.toISOString().slice(0, 10)
    buckets.set(key, 0)
  }

  for (const row of rows) {
    const key = row.created_at.slice(0, 10)
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + row.amount_cents)
    }
  }

  return [...buckets.entries()].map(([key, amountCents]) => ({
    label: `${key.slice(8, 10)}/${key.slice(5, 7)}`,
    amountCents,
  }))
}

export async function fetchRevenueTrend(days = 30) {
  const since = subDays(new Date(), days).toISOString()
  const { data, error } = await supabase
    .from('charges')
    .select('amount_cents, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: true })

  if (error) throw error
  return groupChargesByDay(data ?? [], days)
}

export async function fetchRecentCharges(limit = 8) {
  const { data, error } = await supabase
    .from('charges')
    .select('id, amount_cents, payment_status, payment_method, due_date, created_at, patients(full_name)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    amount_cents: row.amount_cents,
    payment_status: row.payment_status,
    payment_method: row.payment_method,
    due_date: row.due_date,
    created_at: row.created_at,
    patient_name: (row.patients as { full_name: string } | null)?.full_name ?? '—',
  })) satisfies RecentChargeRow[]
}

export async function fetchPaidRevenueCents(days = 30) {
  const since = subDays(new Date(), days).toISOString()
  const { data, error } = await supabase
    .from('charges')
    .select('amount_cents')
    .eq('payment_status', 'pago')
    .gte('paid_at', since)

  if (error) throw error
  return (data ?? []).reduce((sum, row) => sum + row.amount_cents, 0)
}
