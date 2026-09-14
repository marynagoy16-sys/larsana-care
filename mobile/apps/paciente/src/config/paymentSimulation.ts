/** Disponível em dev ou com EXPO_PUBLIC_ENABLE_PAYMENT_SIMULATION=true. Oculta em produção por padrão. */
export function isPaymentSimulationEnabled(): boolean {
  const flag = process.env.EXPO_PUBLIC_ENABLE_PAYMENT_SIMULATION
  if (flag === 'true' || flag === '1') return true
  if (flag === 'false' || flag === '0') return false
  return __DEV__
}
