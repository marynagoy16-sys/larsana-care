import { describe, expect, it } from 'vitest'
import {
  isDemandListSortedByDistance,
  sortDemandsByDistance,
} from '@/components/demands/DemandCompactCard'
import type { DemandListItem } from '@/services/demands'

function makeDemand(
  id: string,
  lat: number | null,
  lng: number | null,
  preference: 1 | 0 | -1 = 0,
): DemandListItem {
  return {
    id,
    demand_type: 'avaliacao',
    technical_category: null,
    patient_abbreviation: id,
    patient_sex: '—',
    patient_age: '—',
    patient_level: 'N1',
    diagnostic_hypothesis: '—',
    attendance_period: '—',
    attendance_period_raw: null,
    region_id: null,
    assigned_professional_id: null,
    assigned_professional_name: null,
    location_lat: lat,
    location_lng: lng,
    location_address: null,
    location_neighborhood: null,
    preference_match_score: preference,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }
}

describe('sortDemandsByDistance', () => {
  const origin = { lat: -23.6678, lng: -46.4614 }

  it('orders nearest demands first for a therapist origin', () => {
    const demands = [
      makeDemand('far', -25.4284, -49.2733),
      makeDemand('near', -23.6754, -46.4498),
      makeDemand('mid', -23.55, -46.63),
    ]

    const sorted = sortDemandsByDistance(demands, origin)

    expect(sorted.map((demand) => demand.id)).toEqual(['near', 'mid', 'far'])
    expect(isDemandListSortedByDistance(sorted, origin)).toBe(true)
  })

  it('pushes demands without coordinates to the end', () => {
    const demands = [
      makeDemand('missing', null, null),
      makeDemand('near', -23.6754, -46.4498),
      makeDemand('far', -25.4284, -49.2733),
    ]

    const sorted = sortDemandsByDistance(demands, origin)

    expect(sorted[0]?.id).toBe('near')
    expect(sorted.at(-1)?.id).toBe('missing')
  })

  it('keeps preference score as tiebreaker for equal distances', () => {
    const sharedPoint = { lat: -23.6754, lng: -46.4498 }
    const demands = [
      makeDemand('neutral', sharedPoint.lat, sharedPoint.lng, 0),
      makeDemand('recommended', sharedPoint.lat, sharedPoint.lng, 1),
    ]

    const sorted = sortDemandsByDistance(demands, origin)

    expect(sorted[0]?.id).toBe('recommended')
  })
})
