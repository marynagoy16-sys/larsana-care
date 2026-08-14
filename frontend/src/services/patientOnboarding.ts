import { supabase } from '@/lib/supabase'
import type { PatientOnboardingValues } from '@/schemas/patientOnboarding'

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

export async function completePatientOnboarding(values: PatientOnboardingValues): Promise<void> {
  const { error } = await supabase.rpc('patient_complete_onboarding' as never, {
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
}

export const patientOnboardingQueryKeys = {
  status: ['paciente', 'onboarding-status'] as const,
}
