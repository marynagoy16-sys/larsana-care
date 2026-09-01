import { resolveAddressCoordinates } from '@/lib/geo'
import { supabase } from '@/lib/supabase'
import type { PatientOnboardingValues } from '@/schemas/patientOnboarding'

type OnboardingResult = {
  success?: boolean
  patient_id?: string
  region_id?: string
}

export type PatientOnboardingStatus = {
  linked: boolean
  needs_onboarding: boolean
  patient_id?: string
}

export async function getPatientOnboardingStatus(): Promise<PatientOnboardingStatus> {
  const { data, error } = await supabase.rpc('patient_get_onboarding_status' as never)
  if (error) throw error
  return (data ?? { linked: false, needs_onboarding: true }) as PatientOnboardingStatus
}

export async function bootstrapPatientAccount(): Promise<string> {
  const { data, error } = await supabase.rpc('bootstrap_patient_account' as never)
  if (error) throw error
  return data as string
}

async function geocodeAndSavePatientAddress(
  _patientId: string,
  values: PatientOnboardingValues,
): Promise<void> {
  const { data: city } = await supabase
    .from('cities')
    .select('name, state')
    .eq('id', values.cityId)
    .maybeSingle()

  const point = await resolveAddressCoordinates(
    {
      street: values.street,
      number: values.number,
      neighborhood: values.neighborhood,
      postalCode: values.postalCode,
      cityName: city?.name ?? null,
      cityState: city?.state ?? null,
    },
    { delayMs: 1100 },
  )

  if (!point) return

  const { error } = await supabase.rpc('patient_set_primary_address_coordinates' as never, {
    p_latitude: point.lat,
    p_longitude: point.lng,
  } as never)

  if (error) throw error
}

export async function completePatientOnboarding(values: PatientOnboardingValues): Promise<void> {
  const { data, error } = await supabase.rpc('patient_complete_onboarding' as never, {
    p_patient_full_name: values.patientFullName,
    p_responsible_phone: values.phone,
    p_street: values.street,
    p_number: values.number,
    p_complement: values.complement ?? null,
    p_neighborhood: values.neighborhood,
    p_postal_code: values.postalCode,
    p_city_id: values.cityId,
  } as never)

  if (error) throw error

  const result = (data ?? {}) as OnboardingResult
  if (result.patient_id) {
    await geocodeAndSavePatientAddress(result.patient_id, values)
  }
}

export const patientOnboardingQueryKeys = {
  status: ['paciente', 'onboarding-status'] as const,
}
