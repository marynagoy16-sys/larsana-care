/** Habilitada por padrão em produção. EXPO_PUBLIC_ENABLE_PAYMENT_SIMULATION=false para ocultar. */
export function isPaymentSimulationEnabled(): boolean {
  const flag = process.env.EXPO_PUBLIC_ENABLE_PAYMENT_SIMULATION
  if (flag === 'false' || flag === '0') return false
  return true
}
