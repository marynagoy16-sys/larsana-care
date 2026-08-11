import { haversineDistanceKm, type GeoPoint } from '@/lib/geo'
import type { DemandListItem } from '@/services/demands'

export type DemandHighlightTag = 'closest' | 'recommended'

export type DemandListItemWithHighlights = DemandListItem & {
  highlight_tags?: DemandHighlightTag[]
}

export function annotateDemandsWithHighlights(
  demands: DemandListItem[],
  origin: GeoPoint,
): DemandListItemWithHighlights[] {
  if (demands.length === 0) return []

  let closestId: string | null = null
  let closestKm = Number.POSITIVE_INFINITY

  for (const demand of demands) {
    if (demand.location_lat == null || demand.location_lng == null) continue
    const km = haversineDistanceKm(origin, {
      lat: demand.location_lat,
      lng: demand.location_lng,
    })
    if (km < closestKm) {
      closestKm = km
      closestId = demand.id
    }
  }

  return demands.map((demand) => {
    const tags: DemandHighlightTag[] = []
    if (closestId && demand.id === closestId) tags.push('closest')
    if (demand.preference_match_score === 1) tags.push('recommended')
    return tags.length > 0 ? { ...demand, highlight_tags: tags } : demand
  })
}

export const demandHighlightLabels: Record<DemandHighlightTag, string> = {
  closest: 'Mais próxima',
  recommended: 'Recomendada',
}
