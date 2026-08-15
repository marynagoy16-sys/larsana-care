export type GeoPoint = {
  lat: number
  lng: number
}

const EARTH_RADIUS_KM = 6371

export function haversineDistanceKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1).replace('.', ',')} km`
  return `${Math.round(km)} km`
}

/** Centro aproximado de Mauá/SP — fallback quando não há coordenadas ou GPS. */
export const MAUA_CENTER: GeoPoint = { lat: -23.6678, lng: -46.4614 }

export function resolvePointsCenter(points: GeoPoint[]): GeoPoint {
  if (points.length === 0) return MAUA_CENTER
  const sum = points.reduce(
    (acc, point) => ({ lat: acc.lat + point.lat, lng: acc.lng + point.lng }),
    { lat: 0, lng: 0 },
  )
  return { lat: sum.lat / points.length, lng: sum.lng / points.length }
}

export const NEARBY_DEMANDS_RADIUS_KM = 20

export function buildOsmEmbedUrl(point: GeoPoint, delta = 0.012): string {
  const { lat, lng } = point
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`
}

export async function geocodeAddress(query: string): Promise<GeoPoint | null> {
  const trimmed = query.trim()
  if (!trimmed) return null

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=1&countrycodes=br`,
    {
      headers: {
        'Accept-Language': 'pt-BR,pt',
        'User-Agent': 'LarsanaCare/1.0 (contact: dev@larsanacare.com.br)',
      },
    },
  )

  if (!response.ok) return null

  const results = (await response.json()) as Array<{ lat: string; lon: string }>
  const hit = results[0]
  if (!hit) return null

  return { lat: Number(hit.lat), lng: Number(hit.lon) }
}

export type AddressGeocodeInput = {
  fullAddress?: string | null
  street?: string | null
  number?: string | null
  neighborhood?: string | null
  postalCode?: string | null
  cityName?: string | null
  cityState?: string | null
}

export function buildAddressGeocodeQueries(input: AddressGeocodeInput): string[] {
  const city = input.cityName?.trim()
  const state = input.cityState?.trim()
  const queries: string[] = []

  if (input.fullAddress?.trim()) queries.push(`${input.fullAddress.trim()}, Brasil`)

  const streetLine = [input.street, input.number].filter(Boolean).join(', ').trim()
  if (streetLine && city) {
    queries.push([streetLine, input.neighborhood, `${city}/${state}`, 'Brasil'].filter(Boolean).join(', '))
  }

  const cep = String(input.postalCode ?? '').replace(/\D/g, '')
  if (cep.length === 8 && city) {
    queries.push(`${cep}, ${city}, ${state}, Brasil`)
  }

  if (input.neighborhood?.trim() && city) {
    queries.push(`${input.neighborhood.trim()}, ${city}, ${state}, Brasil`)
  }

  if (city) {
    queries.push(`${city}, ${state}, Brasil`)
  }

  return [...new Set(queries.filter(Boolean))]
}

export async function resolveAddressCoordinates(
  input: AddressGeocodeInput,
  options?: { delayMs?: number },
): Promise<GeoPoint | null> {
  const delayMs = options?.delayMs ?? 0
  const queries = buildAddressGeocodeQueries(input)

  for (const query of queries) {
    const point = await geocodeAddress(query)
    if (point) return point
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  return null
}

export function buildGoogleMapsSearchUrl(
  address: string,
  neighborhood?: string | null,
  point?: GeoPoint | null,
): string {
  if (point) {
    return `https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}`
  }
  const query = [address, neighborhood].filter(Boolean).join(', ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export function countDemandsWithinRadius(
  demands: Array<{ location_lat: number | null; location_lng: number | null }>,
  origin: GeoPoint,
  radiusKm = NEARBY_DEMANDS_RADIUS_KM,
): number {
  return demands.filter((demand) => {
    if (demand.location_lat == null || demand.location_lng == null) return false
    return (
      haversineDistanceKm(origin, { lat: demand.location_lat, lng: demand.location_lng }) <=
      radiusKm
    )
  }).length
}
