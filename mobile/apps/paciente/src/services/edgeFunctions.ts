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
  charge_id?: string
}

export interface CreateChargeResult {
  charge_id: string
  asaas_payment_id: string | null
  pix_qr_code: string | null
  pix_copy_paste: string | null
  boleto_url: string | null
  asaas_enabled: boolean
}

export const edgeFunctions = {
  createCharge: (payload: CreateChargePayload) =>
    invoke<CreateChargeResult>('create-charge', payload),
}
