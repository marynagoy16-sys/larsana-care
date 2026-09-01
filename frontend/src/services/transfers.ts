import { supabase } from '@/lib/supabase'
import { edgeFunctions } from '@/services/edgeFunctions'

export type TransferStatus =
  | 'aguardando_nf'
  | 'aguardando_validacao'
  | 'liberado'
  | 'transferido'
  | 'falhou'
  | 'cancelado'

export type StaffTransferInvoice = {
  id: string
  file_name: string | null
  storage_path: string
  uploaded_at: string
}

export type StaffTransferCycle = {
  cycle_number: number
  session_count: number
  started_at: string | null
  closed_at: string | null
  patient_name: string | null
}

export type TransferDetail = {
  id: string
  cycle_id: string
  professional_id: string
  pp_transfer_amount_cents: number
  patient_charged_amount_cents: number
  pp_class: string
  commission_percent: number
  first_month_retention_applied: boolean
  larsana_margin_cents: number
  status: TransferStatus
  transferred_at: string | null
  validated_at: string | null
  created_at: string
  invoice: StaffTransferInvoice | null
  cycle: StaffTransferCycle | null
  professionals?: { full_name: string; email: string } | null
}

export type TransferListItem = {
  id: string
  pp_transfer_amount_cents: number
  status: TransferStatus
  created_at: string
  transferred_at: string | null
  professionals?: { full_name: string } | null
  care_cycles?: {
    cycle_number: number
    patients?: { full_name: string } | null
  } | null
  professional_invoices?: { id: string } | { id: string }[] | null
}

export function formatRepasseWaitingLabel(
  createdAt: string,
  status: TransferStatus,
): string | null {
  if (status === 'transferido' || status === 'cancelado') return null
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'Hoje'
  if (days === 1) return '1 dia'
  return `${days} dias`
}

export function transferHasInvoice(row: Pick<TransferListItem, 'professional_invoices'>): boolean {
  const invoice = row.professional_invoices
  if (!invoice) return false
  if (Array.isArray(invoice)) return invoice.length > 0
  return Boolean(invoice.id)
}

export async function listStaffCycleTransfers(): Promise<{ data: TransferListItem[]; count: number }> {
  const { data, error } = await supabase
    .from('transfers')
    .select(
      `
      id, pp_transfer_amount_cents, status, created_at, transferred_at,
      professionals ( full_name ),
      care_cycles ( cycle_number, patients ( full_name ) ),
      professional_invoices ( id )
    `,
    )
    .order('created_at', { ascending: false })

  if (error) throw error
  const rows = (data ?? []) as TransferListItem[]
  return { data: rows, count: rows.length }
}

export async function getStaffTransferDetail(id: string): Promise<TransferDetail | null> {
  const { data, error } = await supabase
    .from('transfers')
    .select(
      `
      id, cycle_id, professional_id, pp_transfer_amount_cents, patient_charged_amount_cents,
      pp_class, commission_percent, first_month_retention_applied, larsana_margin_cents,
      status, transferred_at, validated_at, created_at,
      professional_invoices ( id, file_name, storage_path, uploaded_at ),
      professionals ( full_name, email ),
      care_cycles (
        cycle_number,
        session_count,
        started_at,
        closed_at,
        patients ( full_name )
      )
    `,
    )
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const invoiceRaw = data.professional_invoices as StaffTransferInvoice | StaffTransferInvoice[] | null | undefined
  const invoice = Array.isArray(invoiceRaw) ? invoiceRaw[0] ?? null : invoiceRaw ?? null

  const cycleRaw = data.care_cycles as
    | {
        cycle_number: number
        session_count: number
        started_at: string | null
        closed_at: string | null
        patients: { full_name: string } | { full_name: string }[] | null
      }
    | null
    | undefined

  const patient = cycleRaw?.patients
  const patientRow = Array.isArray(patient) ? patient[0] : patient

  return {
    id: data.id,
    cycle_id: data.cycle_id,
    professional_id: data.professional_id,
    pp_transfer_amount_cents: data.pp_transfer_amount_cents,
    patient_charged_amount_cents: data.patient_charged_amount_cents,
    pp_class: data.pp_class,
    commission_percent: Number(data.commission_percent),
    first_month_retention_applied: data.first_month_retention_applied,
    larsana_margin_cents: data.larsana_margin_cents,
    status: data.status as TransferStatus,
    transferred_at: data.transferred_at,
    validated_at: data.validated_at,
    created_at: data.created_at,
    invoice,
    cycle: cycleRaw
      ? {
          cycle_number: cycleRaw.cycle_number,
          session_count: cycleRaw.session_count,
          started_at: cycleRaw.started_at,
          closed_at: cycleRaw.closed_at,
          patient_name: patientRow?.full_name ?? null,
        }
      : null,
    professionals: data.professionals as TransferDetail['professionals'],
  }
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
