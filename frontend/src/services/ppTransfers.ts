import { supabase } from '@/lib/supabase'
import { sanitizeStorageFileName } from '@/lib/sanitize'
import { getCurrentProfessional } from '@/services/professionals'

export const INVOICES_NF_BUCKET = 'invoices-nf'
const MAX_INVOICE_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_INVOICE_MIME = ['application/pdf', 'image/jpeg', 'image/png']

export type TransferStatus =
  | 'aguardando_nf'
  | 'aguardando_validacao'
  | 'liberado'
  | 'transferido'
  | 'falhou'
  | 'cancelado'

export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  aguardando_nf: 'Aguardando NF',
  aguardando_validacao: 'Aguardando validação',
  liberado: 'Liberado',
  transferido: 'Transferido',
  falhou: 'Falhou',
  cancelado: 'Cancelado',
}

export const TRANSFER_STATUS_ORDER: TransferStatus[] = [
  'aguardando_nf',
  'aguardando_validacao',
  'liberado',
  'transferido',
  'falhou',
  'cancelado',
]

export const TRANSFER_STATUS_HINTS: Partial<Record<TransferStatus, string>> = {
  aguardando_nf: 'Envie a nota fiscal para liberar o repasse.',
  aguardando_validacao: 'Nota fiscal em análise pela Larsana.',
  liberado: 'Repasse liberado, aguardando transferência para sua conta.',
  transferido: 'Valor creditado na sua conta.',
  falhou: 'Houve falha na transferência. Entre em contato com o suporte.',
  cancelado: 'Este repasse foi cancelado.',
}

const PP_CLASS_LABELS: Record<string, string> = {
  BRONZE: 'Bronze',
  PRATA: 'Prata',
  OURO: 'Ouro',
}

export type PPRepasseInvoice = {
  id: string
  file_name: string | null
  storage_path: string
  uploaded_at: string
}

export type PPRepasseDetail = {
  id: string
  cycle_id: string
  pp_transfer_amount_cents: number
  pp_class: string
  commission_percent: number
  first_month_retention_applied: boolean
  status: TransferStatus
  transferred_at: string | null
  created_at: string
  invoice: PPRepasseInvoice | null
  cycle: {
    cycle_number: number
    session_count: number
    is_first_month_capture: boolean
    started_at: string | null
    closed_at: string | null
    patient_name: string | null
  } | null
}

export function formatPpClassLabel(ppClass: string | null | undefined): string {
  if (!ppClass) return '—'
  return PP_CLASS_LABELS[ppClass] ?? ppClass
}

export async function getPPRepasseDetail(id: string): Promise<PPRepasseDetail | null> {
  const { data, error } = await supabase
    .from('transfers')
    .select(
      `
      id,
      cycle_id,
      pp_transfer_amount_cents,
      pp_class,
      commission_percent,
      first_month_retention_applied,
      status,
      transferred_at,
      created_at,
      professional_invoices (
        id,
        file_name,
        storage_path,
        uploaded_at
      ),
      care_cycles (
        cycle_number,
        session_count,
        is_first_month_capture,
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

  const invoiceRaw = data.professional_invoices as PPRepasseInvoice | PPRepasseInvoice[] | null | undefined
  const invoice = Array.isArray(invoiceRaw) ? invoiceRaw[0] ?? null : invoiceRaw ?? null

  const cycleRaw = data.care_cycles as
    | {
        cycle_number: number
        session_count: number
        is_first_month_capture: boolean
        started_at: string | null
        closed_at: string | null
        patients: { full_name: string } | { full_name: string }[] | null
      }
    | null
    | undefined

  const patient = cycleRaw?.patients
  const patientName = Array.isArray(patient) ? patient[0]?.full_name : patient?.full_name

  return {
    id: data.id,
    cycle_id: data.cycle_id,
    pp_transfer_amount_cents: data.pp_transfer_amount_cents,
    pp_class: data.pp_class,
    commission_percent: Number(data.commission_percent),
    first_month_retention_applied: data.first_month_retention_applied,
    status: data.status as TransferStatus,
    transferred_at: data.transferred_at,
    created_at: data.created_at,
    invoice,
    cycle: cycleRaw
      ? {
          cycle_number: cycleRaw.cycle_number,
          session_count: cycleRaw.session_count,
          is_first_month_capture: cycleRaw.is_first_month_capture,
          started_at: cycleRaw.started_at,
          closed_at: cycleRaw.closed_at,
          patient_name: patientName ?? null,
        }
      : null,
  }
}

async function requireCurrentProfessionalId(): Promise<string> {
  const professional = await getCurrentProfessional()
  if (!professional?.id) throw new Error('Profissional não identificado')
  return professional.id
}

export async function getPPTransferInvoiceSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(INVOICES_NF_BUCKET)
    .createSignedUrl(storagePath, 3600)

  if (error) throw error
  if (!data?.signedUrl) throw new Error('Não foi possível abrir a nota fiscal')
  return data.signedUrl
}

export async function uploadPPTransferInvoice(
  transferId: string,
  file: File,
  previousStoragePath?: string | null,
): Promise<void> {
  if (!ALLOWED_INVOICE_MIME.includes(file.type)) {
    throw new Error('Tipo de arquivo não permitido. Use PDF, JPEG ou PNG.')
  }
  if (file.size > MAX_INVOICE_FILE_SIZE) {
    throw new Error('Arquivo excede o limite de 10 MB.')
  }

  const professionalId = await requireCurrentProfessionalId()
  const safeFileName = sanitizeStorageFileName(file.name)
  const storagePath = `${professionalId}/${transferId}/${Date.now()}-${safeFileName}`

  const { error: uploadError } = await supabase.storage
    .from(INVOICES_NF_BUCKET)
    .upload(storagePath, file, { upsert: false, contentType: file.type })

  if (uploadError) throw uploadError

  const { error: submitError } = await supabase.rpc('submit_pp_transfer_invoice', {
    p_transfer_id: transferId,
    p_storage_path: storagePath,
    p_file_name: file.name,
  })

  if (submitError) {
    await supabase.storage.from(INVOICES_NF_BUCKET).remove([storagePath])
    throw submitError
  }

  if (previousStoragePath && previousStoragePath !== storagePath) {
    await supabase.storage.from(INVOICES_NF_BUCKET).remove([previousStoragePath])
  }
}
