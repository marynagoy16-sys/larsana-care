/**
 * Simulação de pagamento — disponível em dev ou com VITE_ENABLE_PAYMENT_SIMULATION=true.
 * Oculta os botões em produção por padrão.
 */
export function isPaymentSimulationEnabled(): boolean {
  const flag = import.meta.env.VITE_ENABLE_PAYMENT_SIMULATION
  if (flag === 'true' || flag === '1') return true
  if (flag === 'false' || flag === '0') return false
  return import.meta.env.DEV
}
