import { createCrudService } from '@/lib/createCrudService'
import { supabase } from '@/lib/supabase'
import { edgeFunctions } from '@/services/edgeFunctions'

export const transfersService = createCrudService('transfers')

export async function validateTransferInvoice(transferId: string) {
  const { data, error } = await supabase.rpc('staff_validate_transfer_invoice', {
    p_transfer_id: transferId,
  })
  if (error) throw error
  return data
}

export async function rejectTransferInvoice(transferId: string, notes?: string) {
  const { data, error } = await supabase.rpc('staff_reject_transfer_invoice', {
    p_transfer_id: transferId,
    p_notes: notes ?? null,
  })
  if (error) throw error
  return data
}

export async function simulateTransferWallet(transferId: string) {
  const { data, error } = await supabase.rpc('simulate_transfer_wallet', {
    p_transfer_id: transferId,
  })
  if (error) throw error
  return data
}

export async function releaseTransferToWallet(transferId: string) {
  return edgeFunctions.transferWallet({ transfer_id: transferId })
}

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

export type SubRepasseListItem = {
  id: string
  amount_cents: number
  status: string
  created_at: string
  session_number: number
  substitute_professional_id: string
  substitute?: { full_name: string; email: string } | null
}

export async function getSubRepasseDetail(id: string) {
  const { data, error } = await supabase
    .from('sub_pp_repasses')
    .select(
      `
      id, amount_cents, status, created_at, transferred_at, session_number,
      session_unit_price_cents, pp_percentage, cycle_id, patient_id,
      substitute:professionals!sub_pp_repasses_substitute_professional_id_fkey ( full_name, email ),
      assigned:professionals!sub_pp_repasses_assigned_professional_id_fkey ( full_name, email ),
      patients ( full_name ),
      care_cycles ( cycle_number )
    `,
    )
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function simulateSubRepasseWallet(repasseId: string) {
  const { data, error } = await supabase.rpc('simulate_sub_repasse_wallet', {
    p_repasse_id: repasseId,
  })
  if (error) throw error
  return data
}

export async function releaseSubRepasseToWallet(repasseId: string) {
  return edgeFunctions.transferWallet({ sub_repasse_id: repasseId })
}

export async function listSubRepassesWithProfessionals(): Promise<SubRepasseListItem[]> {
  const { data, error } = await supabase
    .from('sub_pp_repasses')
    .select(
      `
      id, amount_cents, status, created_at, session_number, substitute_professional_id,
      substitute:professionals!sub_pp_repasses_substitute_professional_id_fkey ( full_name, email )
    `,
    )
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as SubRepasseListItem[]
}
