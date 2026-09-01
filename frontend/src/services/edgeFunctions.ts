import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

async function invoke<T>(name: string, body?: object): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body })
  if (error) {
    if (error instanceof FunctionsHttpError) {
      try {
        const payload = await error.context.json() as { error?: string }
        if (payload?.error) throw new Error(payload.error)
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message !== error.message) {
          throw parseErr
        }
      }
    }
    throw error
  }
  if (data && typeof data === 'object' && 'error' in data && typeof (data as { error?: string }).error === 'string') {
    throw new Error((data as { error: string }).error)
  }
  return data as T
}

export interface CreateChargePayload {
  patient_id: string
  amount_cents: number
  due_date: string
  payment_method: 'PIX' | 'BOLETO'
  description?: string
  charge_id?: string
  force_new_asaas_payment?: boolean
}

export interface CreateChargeResult {
  charge_id: string
  asaas_payment_id: string | null
  pix_qr_code: string | null
  pix_copy_paste: string | null
  boleto_url: string | null
  asaas_enabled: boolean
  pix_receiver_ready?: boolean
  pix_receiver_message?: string | null
}

export interface DelumaExportPayload {
  reference_month: string
}

export interface TransferWalletPayload {
  transfer_id?: string
  assessment_repasse_id?: string
  sub_repasse_id?: string
}

export interface CreateAsaasSubaccountPayload {
  professional_id: string
}

export interface CreateAsaasSubaccountResult {
  professional_id: string
  asaas_wallet_id: string
  created: boolean
  already_linked: boolean
}

export interface ContractPdfPayload {
  contract_id: string
}

export interface AcademyCertificatePayload {
  enrollment_id: string
}

export const edgeFunctions = {
  createCharge: (payload: CreateChargePayload) =>
    invoke<CreateChargeResult>('create-charge', payload),

  generateDelumaExport: (payload: DelumaExportPayload) =>
    invoke<{ export_id: string; storage_path: string }>('generate-deluma-export', payload),

  generateContractPdf: (payload: ContractPdfPayload) =>
    invoke<{ storage_path: string }>('generate-contract-pdf', payload),

  generateAcademyCertificate: (payload: AcademyCertificatePayload) =>
    invoke<{ storage_path: string }>('generate-academy-certificate', payload),

  transferWallet: (payload: TransferWalletPayload) =>
    invoke<{ status: string; asaas_transfer_id?: string }>('transfer-wallet', payload),

  createAsaasSubaccount: (payload: CreateAsaasSubaccountPayload) =>
    invoke<CreateAsaasSubaccountResult>('create-asaas-subaccount', payload),
}
