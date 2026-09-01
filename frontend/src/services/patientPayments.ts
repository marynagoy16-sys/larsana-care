import { supabase } from '@/lib/supabase'
import { isPaymentSimulationEnabled } from '@/lib/paymentSimulation'
import { edgeFunctions } from '@/services/edgeFunctions'

const ASAAS_SYNC_MAX_RETRIES = 3
const ASAAS_SYNC_RETRY_MS = 400

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export type SyncPatientChargeResult = {
  synced: boolean
  asaasEnabled?: boolean
  chargeId: string
  pixQrCode?: string | null
  pixCopyPaste?: string | null
  boletoUrl?: string | null
  pixReceiverReady?: boolean
  pixReceiverMessage?: string | null
  error?: string
}

export async function updateChargePaymentMethod(
  chargeId: string,
  paymentMethod: 'PIX' | 'BOLETO',
): Promise<{ charge_id: string; payment_method: string }> {
  const { data, error } = await supabase.rpc('patient_update_charge_payment_method' as never, {
    p_charge_id: chargeId,
    p_payment_method: paymentMethod,
  } as never)
  if (error) throw error
  return data as { charge_id: string; payment_method: string }
}

export async function syncPatientChargeWithAsaas(input: {
  patientId: string
  chargeId: string
  amountCents: number
  paymentMethod: 'PIX' | 'BOLETO'
  description: string
  dueDate?: string
  forceNewAsaasPayment?: boolean
}): Promise<SyncPatientChargeResult> {
  const dueDate = input.dueDate ?? new Date().toISOString().slice(0, 10)
  let lastError: Error | null = null
  let lastPixReceiverReady: boolean | undefined
  let lastPixReceiverMessage: string | null | undefined

  for (let attempt = 1; attempt <= ASAAS_SYNC_MAX_RETRIES; attempt += 1) {
    try {
      const result = await edgeFunctions.createCharge({
        patient_id: input.patientId,
        charge_id: input.chargeId,
        amount_cents: input.amountCents,
        due_date: dueDate,
        payment_method: input.paymentMethod,
        description: input.description,
        force_new_asaas_payment: input.forceNewAsaasPayment ?? false,
      })
      lastPixReceiverReady = result.pix_receiver_ready
      lastPixReceiverMessage = result.pix_receiver_message
      return {
        synced: true,
        asaasEnabled: result.asaas_enabled,
        chargeId: input.chargeId,
        pixQrCode: result.pix_qr_code,
        pixCopyPaste: result.pix_copy_paste,
        boletoUrl: result.boleto_url,
        pixReceiverReady: result.pix_receiver_ready,
        pixReceiverMessage: result.pix_receiver_message,
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < ASAAS_SYNC_MAX_RETRIES) {
        await sleep(ASAAS_SYNC_RETRY_MS * attempt)
      }
    }
  }

  return {
    synced: false,
    asaasEnabled: true,
    chargeId: input.chargeId,
    pixQrCode: null,
    pixCopyPaste: null,
    boletoUrl: null,
    pixReceiverReady: lastPixReceiverReady,
    pixReceiverMessage: lastPixReceiverMessage,
    error: lastError?.message ?? 'Falha ao sincronizar cobrança',
  }
}

export type SimulateChargePaymentResult = {
  charge_id: string
  cycle_id: string | null
  cycle_status?: string
  sessions_count: number
  already_paid?: boolean
}

/** Internal helper. Never expose in production UI. Blocked unless explicitly enabled in Vite DEV. */
export async function simulateChargePayment(chargeId: string): Promise<SimulateChargePaymentResult> {
  if (!isPaymentSimulationEnabled()) {
    throw new Error('Simulação de pagamento indisponível neste ambiente.')
  }

  const { data, error } = await supabase.rpc('simulate_charge_payment', {
    p_charge_id: chargeId,
  })

  if (error) throw error
  return data as SimulateChargePaymentResult
}
