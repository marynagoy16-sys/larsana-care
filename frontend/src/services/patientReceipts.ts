import { supabase } from '@/lib/supabase'
import { sanitizeStorageFileName } from '@/lib/sanitize'

export const RECEIPTS_BUCKET = 'receipts'
const MAX_RECEIPT_SIZE = 10 * 1024 * 1024
const ALLOWED_RECEIPT_MIME = ['application/pdf', 'image/jpeg', 'image/png']

export async function getPatientReceiptSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from(RECEIPTS_BUCKET).createSignedUrl(storagePath, 3600)
  if (error) throw error
  return data.signedUrl
}

export async function uploadAdminIntermediationReceipt(
  chargeId: string,
  file: File,
): Promise<string> {
  if (!ALLOWED_RECEIPT_MIME.includes(file.type)) {
    throw new Error('Envie PDF, JPEG ou PNG')
  }
  if (file.size > MAX_RECEIPT_SIZE) {
    throw new Error('Arquivo muito grande (máx. 10 MB)')
  }

  const safeName = sanitizeStorageFileName(file.name)
  const storagePath = `intermediacao/${chargeId}/${Date.now()}-${safeName}`

  const { error: uploadError } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .upload(storagePath, file, { upsert: false, contentType: file.type })
  if (uploadError) throw uploadError

  const { data, error } = await supabase.rpc('admin_upload_patient_receipt' as never, {
    p_charge_id: chargeId,
    p_storage_path: storagePath,
    p_receipt_kind: 'intermediacao',
  } as never)
  if (error) throw error
  return String(data)
}

export const receiptKindLabels: Record<string, string> = {
  intermediacao: 'Intermediação Larsana',
  pp_prestacao: 'Prestação de serviço (PP)',
}
