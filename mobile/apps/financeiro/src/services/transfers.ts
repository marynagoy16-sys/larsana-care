import { createCrudService } from '@/lib/createCrudService'
import { supabase } from '@/lib/supabase'

export const transfersService = createCrudService('transfers')

export type TransferListItem = {
  id: string
  pp_transfer_amount_cents: number
  status: string
  created_at: string
  cycle_id: string
  professional_id: string
  professionals?: { full_name: string; email: string } | null
}

const TRANSFER_LIST_SELECT =
  'id, pp_transfer_amount_cents, status, created_at, cycle_id, professional_id, professionals(full_name, email)'

export async function listTransfersWithProfessionals(): Promise<TransferListItem[]> {
  const { data, error } = await supabase
    .from('transfers')
    .select(TRANSFER_LIST_SELECT)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as TransferListItem[]
}

export async function getTransferDetail(id: string) {
  const { data, error } = await supabase
    .from('transfers')
    .select(
      'id, pp_transfer_amount_cents, status, created_at, transferred_at, cycle_id, professional_id, patient_charged_amount_cents, professionals(full_name, email, id)',
    )
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function listPendingTransfers(limit?: number): Promise<TransferListItem[]> {
  let query = supabase
    .from('transfers')
    .select(TRANSFER_LIST_SELECT)
    .neq('status', 'transferido')
    .order('created_at', { ascending: false })

  if (limit) query = query.limit(limit)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as TransferListItem[]
}

export async function listPendingTransfersAging(): Promise<TransferListItem[]> {
  const { data, error } = await supabase
    .from('transfers')
    .select(TRANSFER_LIST_SELECT)
    .neq('status', 'transferido')
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as TransferListItem[]
}
