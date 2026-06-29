const R = 6371 // km

export interface GeoPoint {
  lat: number
  lng: number
}

export function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

export function haversineDistanceKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const sinDLat2 = Math.sin(dLat / 2)
  const sinDLon2 = Math.sin(dLon / 2)
  const h = sinDLat2 * sinDLat2 + Math.cos(lat1) * Math.cos(lat2) * sinDLon2 * sinDLon2
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
  return R * c
}

export function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${Math.round(km)} km`
}

export const MAUA_CENTER: GeoPoint = { lat: -23.6684, lng: -46.4609 }

export function resolvePointsCenter(points: GeoPoint[]): GeoPoint {
  if (points.length === 0) return MAUA_CENTER
  const lat = points.reduce((sum, p) => sum + p.lat, 0) / points.length
  const lng = points.reduce((sum, p) => sum + p.lng, 0) / points.length
  return { lat, lng }
}
