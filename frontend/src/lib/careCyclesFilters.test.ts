import { describe, expect, it } from 'vitest'
import { matchesCareCyclesFilters, isCareCyclePaymentPending } from '@/lib/careCyclesFilters'
import type { CycleListItem } from '@/services/cycles'

const baseRow: CycleListItem = {
  id: '1',
  cycle_number: 1,
  session_count: 8,
  status: 'ativo',
  payment_status: 'pago',
  created_at: '2026-06-01T10:00:00Z',
  started_at: '2026-06-01T10:00:00Z',
  patient_id: 'p1',
  assigned_professional_id: 'pro1',
  region_id: 'r1',
  patient_level: 'N2',
  patient_name: 'Carlos Mendes',
  professional_name: 'PP Demo',
  completed_sessions: 1,
}

describe('careCyclesFilters', () => {
  it('matches status, payment and session count', () => {
    expect(matchesCareCyclesFilters(baseRow, { status: 'ativo' })).toBe(true)
    expect(matchesCareCyclesFilters(baseRow, { status: 'encerrado' })).toBe(false)
    expect(matchesCareCyclesFilters(baseRow, { session_count: 8 })).toBe(true)
    expect(matchesCareCyclesFilters(baseRow, { region_id: 'r2' })).toBe(false)
  })

  it('detects pending payment', () => {
    expect(isCareCyclePaymentPending({ payment_status: 'pendente' })).toBe(true)
    expect(isCareCyclePaymentPending({ payment_status: 'pago' })).toBe(false)
  })
})
