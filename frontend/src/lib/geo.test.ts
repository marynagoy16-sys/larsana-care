import { describe, expect, it } from 'vitest'
import { formatDistanceKm, haversineDistanceKm, resolvePointsCenter } from './geo'

describe('geo', () => {
  it('calculates distance between two nearby points', () => {
    const km = haversineDistanceKm(
      { lat: -23.6678, lng: -46.4614 },
      { lat: -23.6754, lng: -46.4498 },
    )
    expect(km).toBeGreaterThan(1)
    expect(km).toBeLessThan(3)
  })

  it('formats sub-kilometer distances in meters', () => {
    expect(formatDistanceKm(0.42)).toBe('420 m')
  })

  it('resolves center of multiple points', () => {
    const center = resolvePointsCenter([
      { lat: -23.67, lng: -46.46 },
      { lat: -23.68, lng: -46.47 },
    ])
    expect(center.lat).toBeCloseTo(-23.675)
    expect(center.lng).toBeCloseTo(-46.465)
  })
})
