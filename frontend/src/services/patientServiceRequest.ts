import { supabase } from '@/lib/supabase'

export type PatientServiceDemand = {
  id: string
  status: 'aberta' | 'alocada' | 'cancelada'
  demand_type: string
  request_source: string
  created_at: string
  assigned_professional_id: string | null
}

export type PatientServiceStatus = {
  linked: boolean
  patient_id?: string
  patient_name?: string
  region_id?: string | null
  region_code?: string | null
  region_name?: string | null
  service_available?: boolean
  primary_address_id?: string | null
  active_demand?: PatientServiceDemand | null
  waitlist?: { id: string; status: string; created_at: string } | null
}

export type RequestAttendanceResult = {
  success: boolean
  reason?: 'no_coverage' | 'already_available'
  message?: string
  demand_id?: string
  already_exists?: boolean
  status?: string
}

export type JoinWaitlistResult = {
  success: boolean
  reason?: string
  message?: string
  waitlist_id?: string
  already_exists?: boolean
}

export async function getPatientServiceStatus(): Promise<PatientServiceStatus> {
  const { data, error } = await supabase.rpc('patient_get_service_status' as never)
  if (error) throw error
  return (data ?? { linked: false }) as PatientServiceStatus
}

export async function requestAttendance(notes?: string): Promise<RequestAttendanceResult> {
  const { data, error } = await supabase.rpc('patient_request_attendance' as never, {
    p_notes: notes ?? null,
  } as never)
  if (error) throw error
  return data as RequestAttendanceResult
}

export async function joinWaitlist(notes?: string): Promise<JoinWaitlistResult> {
  const { data, error } = await supabase.rpc('patient_join_waitlist' as never, {
    p_notes: notes ?? null,
  } as never)
  if (error) throw error
  return data as JoinWaitlistResult
}

export const patientServiceQueryKeys = {
  status: ['paciente', 'service-status'] as const,
}
