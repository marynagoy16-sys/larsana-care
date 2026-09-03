import { describe, expect, it, vi } from 'vitest'
import { isPaymentSimulationEnabled } from '@/lib/paymentSimulation'

describe('isPaymentSimulationEnabled', () => {
  it('fica desligada quando VITE_ENABLE_PAYMENT_SIMULATION=false', () => {
    vi.stubEnv('VITE_ENABLE_PAYMENT_SIMULATION', 'false')
    expect(isPaymentSimulationEnabled()).toBe(false)
  })

  it('permanece ligada por padrão', () => {
    vi.stubEnv('VITE_ENABLE_PAYMENT_SIMULATION', undefined)
    expect(isPaymentSimulationEnabled()).toBe(true)
  })
})
