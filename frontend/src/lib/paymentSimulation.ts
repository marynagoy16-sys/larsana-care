/**
 * Payment simulation is a local-dev only escape hatch.
 * Production, preview, TestFlight and Play internal builds must never enable it.
 */
export function isPaymentSimulationEnabled(): boolean {
  if (import.meta.env.PROD) return false
  return import.meta.env.DEV && import.meta.env.VITE_ENABLE_PAYMENT_SIMULATION === 'true'
}
