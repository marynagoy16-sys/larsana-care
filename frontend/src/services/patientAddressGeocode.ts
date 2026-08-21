import { resolveAddressCoordinates } from '@/lib/geo'
import { supabase } from '@/lib/supabase'

/** Garante coordenadas no endereço primário antes de abrir demanda (distância/repasse PP). */
export async function ensurePatientPrimaryAddressGeocoded(patientId: string): Promise<void> {
  const { data: address, error } = await supabase
    .from('patient_addresses')
    .select(
      `
      id,
      full_address,
      street,
      number,
      neighborhood,
      postal_code,
      latitude,
      longitude,
      cities ( name, state )
    `,
    )
    .eq('patient_id', patientId)
    .order('is_primary', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!address || (address.latitude != null && address.longitude != null)) return

  const city = address.cities as { name: string; state: string } | null

  const point = await resolveAddressCoordinates(
    {
      fullAddress: address.full_address,
      street: address.street,
      number: address.number,
      neighborhood: address.neighborhood,
      postalCode: address.postal_code,
      cityName: city?.name ?? null,
      cityState: city?.state ?? null,
    },
    { delayMs: 1100 },
  )

  if (!point) return

  const { error: updateError } = await supabase
    .from('patient_addresses')
    .update({ latitude: point.lat, longitude: point.lng })
    .eq('id', address.id)

  if (updateError) throw updateError
}
