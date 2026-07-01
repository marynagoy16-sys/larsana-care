import { createCrudService } from '@/lib/createCrudService'
import { supabase } from '@/lib/supabase'

export const chargesService = createCrudService('charges')

export type ChargeListItem = {
  id: string
  amount_cents: number
  payment_status: string
  due_date: string | null
  created_at: string
  patient_id: string
  payment_method: string | null
  patients?: { full_name: string } | null
}

const CHARGE_LIST_SELECT =
  'id, amount_cents, payment_status, due_date, created_at, patient_id, payment_method, patients(full_name)'

export async function listChargesWithPatients(): Promise<ChargeListItem[]> {
  const { data, error } = await supabase
    .from('charges')
    .select(CHARGE_LIST_SELECT)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as ChargeListItem[]
}

export async function getChargeDetail(id: string) {
  const { data, error } = await supabase
    .from('charges')
    .select(
      'id, amount_cents, payment_status, due_date, created_at, updated_at, paid_at, payment_method, description, boleto_url, patient_id, patients(full_name, id)',
    )
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function listChargesByPeriod(start: string, end: string) {
  const { data, error } = await supabase
    .from('charges')
    .select(CHARGE_LIST_SELECT)
    .gte('created_at', `${start}T00:00:00`)
    .lte('created_at', `${end}T23:59:59`)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as ChargeListItem[]
}

export async function listRecentCharges(limit = 5): Promise<ChargeListItem[]> {
  const { data, error } = await supabase
    .from('charges')
    .select(CHARGE_LIST_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as ChargeListItem[]
}
