import { supabase } from '@/lib/supabase'
import { isPaymentSimulationEnabled } from '@/lib/paymentSimulation'

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
