/**
 * Payment simulation is a local-dev only escape hatch.
 * Production builds must never enable it.
 */
export function isPaymentSimulationEnabled(): boolean {
  return !import.meta.env.PROD
}
