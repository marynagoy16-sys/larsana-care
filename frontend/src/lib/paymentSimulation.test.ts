import { describe, expect, it } from 'vitest'
import { isPaymentSimulationEnabled } from '@/lib/paymentSimulation'

describe('isPaymentSimulationEnabled', () => {
  it('permanece desligada nos testes (PROD)', () => {
    expect(isPaymentSimulationEnabled()).toBe(false)
  })
})
