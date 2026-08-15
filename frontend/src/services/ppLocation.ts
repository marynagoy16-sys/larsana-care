import { resolveAddressCoordinates, type GeoPoint } from '@/lib/geo'
import { supabase } from '@/lib/supabase'

export async function resolvePpProfessionalOrigin(): Promise<GeoPoint | null> {
  const { data: professional, error } = await supabase
    .from('professionals')
    .select('address')
    .maybeSingle()

  if (error) throw error

  const address = professional?.address?.trim()
  if (!address) return null

  return resolveAddressCoordinates({ fullAddress: address })
}
