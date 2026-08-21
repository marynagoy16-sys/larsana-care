import type { GeoPoint } from '@/lib/geo'
import { resolveAddressCoordinates } from '@/lib/geo'
import { supabase } from '@/lib/supabase'

const LOCATION_MAX_AGE_MS = 1000 * 60 * 30

export async function savePpLiveLocation(point: GeoPoint): Promise<void> {
  const { error } = await supabase.rpc('pp_update_live_location' as never, {
    p_lat: point.lat,
    p_lng: point.lng,
  } as never)
  if (error) throw error
}

export async function getBrowserGeolocation(): Promise<GeoPoint | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return null

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({ lat: position.coords.latitude, lng: position.coords.longitude })
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: LOCATION_MAX_AGE_MS },
    )
  })
}

export async function resolvePpProfessionalOrigin(): Promise<GeoPoint | null> {
  const { data: professional, error } = await supabase
    .from('professionals')
    .select('address, last_lat, last_lng, location_updated_at')
    .maybeSingle()

  if (error) throw error
  if (!professional) return null

  const updatedAt = professional.location_updated_at
    ? new Date(professional.location_updated_at).getTime()
    : 0
  const isFresh = Date.now() - updatedAt < LOCATION_MAX_AGE_MS

  if (isFresh && professional.last_lat != null && professional.last_lng != null) {
    return { lat: Number(professional.last_lat), lng: Number(professional.last_lng) }
  }

  const live = await getBrowserGeolocation()
  if (live) {
    try {
      await savePpLiveLocation(live)
    } catch {
      // best effort — ainda usa coordenada local
    }
    return live
  }

  const address = professional.address?.trim()
  if (!address) return null

  return resolveAddressCoordinates({ fullAddress: address })
}
