import * as Location from 'expo-location'
import { MAUA_CENTER, type GeoPoint } from '@/lib/geo'
import { supabase } from '@/lib/supabase'

const LOCATION_MAX_AGE_MS = 1000 * 60 * 30

export async function savePpLiveLocation(point: GeoPoint): Promise<void> {
  const { error } = await (supabase as any).rpc('pp_update_live_location', {
    p_lat: point.lat,
    p_lng: point.lng,
  })
  if (error) throw error
}

export async function resolvePpProfessionalOrigin(): Promise<GeoPoint> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return MAUA_CENTER

  const { data: professional, error } = await (supabase as any)
    .from('professionals')
    .select('last_lat, last_lng, location_updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error

  const updatedAt = professional?.location_updated_at
    ? new Date(professional.location_updated_at).getTime()
    : 0
  const isFresh = Date.now() - updatedAt < LOCATION_MAX_AGE_MS

  if (isFresh && professional?.last_lat != null && professional?.last_lng != null) {
    return { lat: Number(professional.last_lat), lng: Number(professional.last_lng) }
  }

  try {
    const permission = await Location.requestForegroundPermissionsAsync()
    if (permission.status === 'granted') {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      const point = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      }
      try {
        await savePpLiveLocation(point)
      } catch {
        // best effort
      }
      return point
    }
  } catch {
    // ignore
  }

  if (professional?.last_lat != null && professional?.last_lng != null) {
    return { lat: Number(professional.last_lat), lng: Number(professional.last_lng) }
  }

  return MAUA_CENTER
}
