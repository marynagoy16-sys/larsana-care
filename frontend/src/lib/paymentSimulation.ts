/**
 * Simulação de pagamento — habilitada por padrão (incl. produção) enquanto o Asaas
 * não cobre todos os fluxos. Defina VITE_ENABLE_PAYMENT_SIMULATION=false para ocultar.
 */
export function isPaymentSimulationEnabled(): boolean {
  const flag = import.meta.env.VITE_ENABLE_PAYMENT_SIMULATION
  if (flag === 'false' || flag === '0') return false
  return true
}
