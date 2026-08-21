import { supabase } from '@/lib/supabase'
import { edgeFunctions } from '@/services/edgeFunctions'

export type TransferStatus =
  | 'aguardando_nf'
  | 'aguardando_validacao'
  | 'liberado'
  | 'transferido'
  | 'falhou'
  | 'cancelado'

export type TransferDetail = {
  id: string
  cycle_id: string
  professional_id: string
  pp_transfer_amount_cents: number
  patient_charged_amount_cents: number
  status: TransferStatus
  transferred_at: string | null
  validated_at: string | null
  created_at: string
  professional_invoices?: {
    id: string
    file_name: string | null
    storage_path: string
    uploaded_at: string
  } | {
    id: string
    file_name: string | null
    storage_path: string
    uploaded_at: string
  }[] | null
  professionals?: { full_name: string; email: string } | null
}

export async function getStaffTransferDetail(id: string): Promise<TransferDetail | null> {
  const { data, error } = await supabase
    .from('transfers')
    .select(
      `
      id, cycle_id, professional_id, pp_transfer_amount_cents, patient_charged_amount_cents,
      status, transferred_at, validated_at, created_at,
      professional_invoices ( id, file_name, storage_path, uploaded_at ),
      professionals ( full_name, email )
    `,
    )
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data as TransferDetail | null
}

export async function validateTransferInvoice(transferId: string) {
  const { data, error } = await supabase.rpc('staff_validate_transfer_invoice', {
    p_transfer_id: transferId,
  })
  if (error) throw error
  return data as { transfer_id: string; status: string }
}

export async function rejectTransferInvoice(transferId: string, notes?: string) {
  const { data, error } = await supabase.rpc('staff_reject_transfer_invoice', {
    p_transfer_id: transferId,
    p_notes: notes,
  })
  if (error) throw error
  return data as { transfer_id: string; status: string }
}

export async function simulateTransferWallet(transferId: string) {
  const { data, error } = await supabase.rpc('simulate_transfer_wallet', {
    p_transfer_id: transferId,
  })
  if (error) throw error
  return data as { transfer_id: string; status: string; simulated?: boolean }
}

export async function releaseTransferToWallet(transferId: string) {
  return edgeFunctions.transferWallet({ transfer_id: transferId })
}

export async function releaseAssessmentRepasseToWallet(repasseId: string) {
  return edgeFunctions.transferWallet({ assessment_repasse_id: repasseId })
}

export async function simulateAssessmentRepasseWallet(repasseId: string) {
  const { data, error } = await supabase.rpc('simulate_assessment_repasse_wallet', {
    p_repasse_id: repasseId,
  })
  if (error) throw error
  return data as { repasse_id: string; status: string; simulated?: boolean }
}

export type SubRepasseDetail = {
  id: string
  session_id: string
  cycle_id: string
  patient_id: string
  session_number: number
  session_unit_price_cents: number
  amount_cents: number
  pp_percentage: number
  status: TransferStatus
  transferred_at: string | null
  created_at: string
  substitute_professional_id: string
  assigned_professional_id: string
  substitute?: { full_name: string; email: string } | null
  assigned?: { full_name: string; email: string } | null
  patients?: { full_name: string } | null
  care_cycles?: { cycle_number: number } | null
}

export async function listSubRepassesStaff(): Promise<SubRepasseDetail[]> {
  const { data, error } = await supabase
    .from('sub_pp_repasses')
    .select(
      `
      id, session_id, cycle_id, patient_id, session_number, session_unit_price_cents,
      amount_cents, pp_percentage, status, transferred_at, created_at,
      substitute_professional_id, assigned_professional_id,
      substitute:professionals!sub_pp_repasses_substitute_professional_id_fkey ( full_name, email ),
      assigned:professionals!sub_pp_repasses_assigned_professional_id_fkey ( full_name, email ),
      patients ( full_name ),
      care_cycles ( cycle_number )
    `,
    )
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as SubRepasseDetail[]
}

export async function getStaffSubRepasseDetail(id: string): Promise<SubRepasseDetail | null> {
  const { data, error } = await supabase
    .from('sub_pp_repasses')
    .select(
      `
      id, session_id, cycle_id, patient_id, session_number, session_unit_price_cents,
      amount_cents, pp_percentage, status, transferred_at, created_at,
      substitute_professional_id, assigned_professional_id,
      substitute:professionals!sub_pp_repasses_substitute_professional_id_fkey ( full_name, email ),
      assigned:professionals!sub_pp_repasses_assigned_professional_id_fkey ( full_name, email ),
      patients ( full_name ),
      care_cycles ( cycle_number )
    `,
    )
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data as SubRepasseDetail | null
}

export async function simulateSubRepasseWallet(repasseId: string) {
  const { data, error } = await supabase.rpc('simulate_sub_repasse_wallet', {
    p_repasse_id: repasseId,
  })
  if (error) throw error
  return data as { repasse_id: string; status: string; simulated?: boolean }
}

export async function releaseSubRepasseToWallet(repasseId: string) {
  return edgeFunctions.transferWallet({ sub_repasse_id: repasseId })
}
