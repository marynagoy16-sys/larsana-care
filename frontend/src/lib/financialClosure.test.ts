import { describe, expect, it } from 'vitest'
import {
  calculateFinancialClosure,
  isValidRescheduleJustification,
  requiresRescheduleReason,
  requiresRescheduleWarningAck,
} from './financialClosure'

describe('financialClosure', () => {
  const baseInput = {
    sessionsContracted: 8,
    sessionsCompleted: 4,
    sessionUnitPriceCents: 15000,
    ppPercentage: 70,
    larsanaPercentage: 30,
  }

  it('calculates PDF example for justified pause', () => {
    const result = calculateFinancialClosure({
      ...baseInput,
      pauseType: 'justified',
    })

    expect(result.grossCycleAmountCents).toBe(120000)
    expect(result.completedAmountCents).toBe(60000)
    expect(result.remainingAmountCents).toBe(60000)
    expect(result.ppReleaseAmountCents).toBe(42000)
    expect(result.larsanaCommissionAmountCents).toBe(18000)
    expect(result.operationalFeeCents).toBe(0)
    expect(result.familyRefundAmountCents).toBe(60000)
    expect(result.larsanaTotalCents).toBe(18000)
  })

  it('calculates PDF example for unjustified pause', () => {
    const result = calculateFinancialClosure({
      ...baseInput,
      pauseType: 'unjustified',
    })

    expect(result.ppReleaseAmountCents).toBe(42000)
    expect(result.larsanaCommissionAmountCents).toBe(18000)
    expect(result.operationalFeeCents).toBe(12000)
    expect(result.familyRefundAmountCents).toBe(48000)
    expect(result.larsanaTotalCents).toBe(30000)
  })

  it('calculates full cycle completion without pause', () => {
    const result = calculateFinancialClosure({
      ...baseInput,
      sessionsCompleted: 8,
      pauseType: 'none',
    })

    expect(result.grossCycleAmountCents).toBe(120000)
    expect(result.completedAmountCents).toBe(120000)
    expect(result.ppReleaseAmountCents).toBe(84000)
    expect(result.larsanaCommissionAmountCents).toBe(36000)
    expect(result.operationalFeeCents).toBe(0)
    expect(result.familyRefundAmountCents).toBe(0)
  })

  it('applies 20% operational fee only on remaining balance', () => {
    const result = calculateFinancialClosure({
      sessionsContracted: 8,
      sessionsCompleted: 4,
      sessionUnitPriceCents: 15000,
      ppPercentage: 70,
      larsanaPercentage: 30,
      pauseType: 'unjustified',
    })

    expect(result.operationalFeeCents).toBe(Math.round(result.remainingAmountCents * 0.2))
    expect(result.operationalFeeCents).not.toBe(Math.round(result.grossCycleAmountCents * 0.2))
  })
})

describe('reschedule rules', () => {
  it('identifies valid health justifications', () => {
    expect(isValidRescheduleJustification('saude')).toBe(true)
    expect(isValidRescheduleJustification('internacao')).toBe(true)
    expect(isValidRescheduleJustification('horario')).toBe(false)
  })

  it('requires reason from second reschedule onward', () => {
    expect(requiresRescheduleReason(1)).toBe(false)
    expect(requiresRescheduleReason(2)).toBe(true)
  })

  it('requires warning ack on third reschedule without valid justification', () => {
    expect(requiresRescheduleWarningAck(3, 'horario')).toBe(true)
    expect(requiresRescheduleWarningAck(3, 'saude')).toBe(false)
    expect(requiresRescheduleWarningAck(2, 'horario')).toBe(false)
  })
})
