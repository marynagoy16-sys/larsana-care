import { describe, expect, it, vi } from 'vitest'
import { isPaymentSimulationEnabled } from '@/lib/paymentSimulation'

describe('isPaymentSimulationEnabled', () => {
  it('fica desligada quando VITE_ENABLE_PAYMENT_SIMULATION=false', () => {
    vi.stubEnv('VITE_ENABLE_PAYMENT_SIMULATION', 'false')
    vi.stubEnv('DEV', true)
    expect(isPaymentSimulationEnabled()).toBe(false)
  })

  it('fica ligada em dev quando a flag não está definida', () => {
    vi.stubEnv('VITE_ENABLE_PAYMENT_SIMULATION', undefined)
    vi.stubEnv('DEV', true)
    expect(isPaymentSimulationEnabled()).toBe(true)
  })

  it('fica desligada em produção quando a flag não está definida', () => {
    vi.stubEnv('VITE_ENABLE_PAYMENT_SIMULATION', undefined)
    vi.stubEnv('DEV', false)
    expect(isPaymentSimulationEnabled()).toBe(false)
  })

  it('fica ligada em produção quando VITE_ENABLE_PAYMENT_SIMULATION=true', () => {
    vi.stubEnv('VITE_ENABLE_PAYMENT_SIMULATION', 'true')
    vi.stubEnv('DEV', false)
    expect(isPaymentSimulationEnabled()).toBe(true)
  })
})
