import { supabase } from '@/lib/supabase'

async function invoke<T>(name: string, body?: object): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body })
  if (error) throw error
  return data as T
}

export interface CreateChargePayload {
  patient_id: string
  amount_cents: number
  due_date: string
  payment_method: 'PIX' | 'BOLETO'
  description?: string
}

export interface DelumaExportPayload {
  reference_month: string
}

export interface TransferWalletPayload {
  transfer_id: string
}

export const edgeFunctions = {
  createCharge: (payload: CreateChargePayload) =>
    invoke<{ charge_id: string }>('create-charge', payload),

  generateDelumaExport: (payload: DelumaExportPayload) =>
    invoke<{ export_id: string; storage_path: string }>('generate-deluma-export', payload),

  transferWallet: (payload: TransferWalletPayload) =>
    invoke<{ status: string }>('transfer-wallet', payload),
}
