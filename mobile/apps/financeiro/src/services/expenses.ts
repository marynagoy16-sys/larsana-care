import { createCrudService } from '@/lib/createCrudService'
import { supabase } from '@/lib/supabase'
import { getMonthRange } from '@/lib/formatters'

export const internalExpensesService = createCrudService('internal_expenses')

export type ExpenseListItem = {
  id: string
  expense_type: string
  amount_cents: number
  reference_month: string
  created_at: string
}

export async function listExpenses(referenceMonth?: string): Promise<ExpenseListItem[]> {
  let query = supabase
    .from('internal_expenses')
    .select('id, expense_type, amount_cents, reference_month, created_at')
    .order('created_at', { ascending: false })

  if (referenceMonth) {
    query = query.eq('reference_month', referenceMonth)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as ExpenseListItem[]
}

export async function sumExpensesForMonth(monthKey: string): Promise<number> {
  const month = monthKey.length === 7 ? monthKey : monthKey.slice(0, 7)
  const { data, error } = await supabase
    .from('internal_expenses')
    .select('amount_cents')
    .eq('reference_month', month)

  if (error) throw error
  return (data ?? []).reduce((sum, row) => sum + Number(row.amount_cents), 0)
}

export async function sumExpensesForCurrentMonth(): Promise<number> {
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return sumExpensesForMonth(month)
}

export async function sumChargesForMonth(monthKey: string): Promise<number> {
  const { start, end } = getMonthRange(monthKey)
  const { data, error } = await supabase
    .from('charges')
    .select('amount_cents')
    .gte('created_at', `${start}T00:00:00`)
    .lte('created_at', `${end}T23:59:59`)

  if (error) throw error
  return (data ?? []).reduce((sum, row) => sum + Number(row.amount_cents), 0)
}
