import { describe, expect, it } from 'vitest'
import {
  buildAvaliacaoSimulation,
  buildContinuidadeSimulation,
  resolveCyclePercents,
} from './demandSimulation'

describe('demandSimulation', () => {
  const commissions = [
    {
      id: '1',
      pp_class: 'BRONZE' as const,
      pp_percent: 70,
      larsana_percent: 30,
      bonus_pp_percent: 0,
      version_id: 'v1',
      created_at: '2026-01-01T00:00:00Z',
    },
  ]
  const retention = {
    id: '1',
    version_id: 'v1',
    larsana_percent: 40,
    created_at: '2026-01-01T00:00:00Z',
  }

  it('calculates cycle 1 at 60% and cycle 2 at 70% for R$100 session', () => {
    const result = buildAvaliacaoSimulation({
      sessionPriceCents: 10000,
      commissions,
      retention,
    })

    expect(result?.rules.cycle1RepassePerSessionCents).toBe(6000)
    expect(result?.rules.cycle2RepassePerSessionCents).toBe(7000)
    expect(result?.rows[0]).toMatchObject({
      sessionsPerCycle: 4,
      cycle1TotalCents: 24000,
      cycle2TotalCents: 28000,
    })
    expect(result?.rows[2]).toMatchObject({
      sessionsPerCycle: 12,
      cycle1TotalCents: 72000,
      cycle2TotalCents: 84000,
    })
  })

  it('uses patient weekly frequency for continuidade simulation', () => {
    const result = buildContinuidadeSimulation({
      sessionPriceCents: 10000,
      commissions,
      retention,
      weeklyFrequency: 1,
    })

    expect(result?.row.sessionsPerCycle).toBe(4)
    expect(result?.row.cycle2TotalCents).toBe(28000)
  })

  it('defaults continuidade to 1x per week', () => {
    const result = buildContinuidadeSimulation({
      sessionPriceCents: 10000,
      commissions,
      retention,
      weeklyFrequency: null,
    })

    expect(result?.row.weeklyFrequency).toBe(1)
  })

  it('returns null when session price is missing', () => {
    expect(
      buildAvaliacaoSimulation({ sessionPriceCents: null, commissions, retention }),
    ).toBeNull()
  })

  it('resolves cycle percents from retention and bronze commission', () => {
    expect(resolveCyclePercents({ commissions, retention })).toEqual({
      cycle1Percent: 60,
      cycle2Percent: 70,
    })
  })
})
