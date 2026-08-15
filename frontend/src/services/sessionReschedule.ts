import { supabase } from '@/lib/supabase'

export type RescheduleRequestStatus =
  | 'pending_patient'
  | 'patient_accepted'
  | 'patient_rejected'
  | 'sub_offered'
  | 'sub_accepted'
  | 'sub_rejected'
  | 'pp_reschedule_window'
  | 'completed'
  | 'expired'
  | 'cancelled'

export type SessionRescheduleRequest = {
  id: string
  session_id: string
  cycle_id: string
  patient_id: string
  responsible_professional_id: string
  initiated_by: 'paciente' | 'pp' | 'staff'
  window_type: 'on_time' | 'late'
  status: RescheduleRequestStatus
  original_scheduled_at: string
  proposed_scheduled_at: string | null
  reschedule_deadline: string
  scheduling_proposal_id: string | null
  substitute_professional_id: string | null
  certificate_storage_path: string | null
  created_at: string
}

export type PpRescheduleResult = {
  flow?: 'patient_acceptance' | 'sub_offer'
  proposal_id?: string
  request_id?: string
  status?: string
}

export async function patientRespondRescheduleProposal(
  proposalId: string,
  accept: boolean,
  slotId?: string,
): Promise<{ status: string; session_id?: string; request_id?: string }> {
  const { data, error } = await supabase.rpc('patient_respond_reschedule_proposal', {
    p_proposal_id: proposalId,
    p_accept: accept,
    p_slot_id: slotId ?? null,
  })
  if (error) throw error
  return data as { status: string; session_id?: string; request_id?: string }
}

export async function patientRespondSubOffer(
  requestId: string,
  accept: boolean,
): Promise<{ status: string; substitute_professional_id?: string; session_id?: string }> {
  const { data, error } = await supabase.rpc('patient_respond_sub_offer', {
    p_request_id: requestId,
    p_accept: accept,
  })
  if (error) throw error
  return data as { status: string; substitute_professional_id?: string; session_id?: string }
}

export async function patientRequestReschedule(
  sessionId: string,
  newScheduledAt: string,
  certificateStoragePath?: string | null,
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.rpc('patient_request_reschedule', {
    p_session_id: sessionId,
    p_new_scheduled_at: newScheduledAt,
    p_certificate_storage_path: certificateStoragePath ?? null,
  })
  if (error) throw error
  return data as unknown as Record<string, unknown>
}

export async function ppRescheduleAfterSubRejection(
  requestId: string,
  newScheduledAt: string,
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.rpc('pp_reschedule_after_sub_rejection', {
    p_request_id: requestId,
    p_new_scheduled_at: newScheduledAt,
  })
  if (error) throw error
  return data as unknown as Record<string, unknown>
}

export async function listPendingSubOffersForPatient(): Promise<SessionRescheduleRequest[]> {
  const { data, error } = await supabase
    .from('session_reschedule_requests')
    .select(`
      id, session_id, cycle_id, patient_id, responsible_professional_id,
      initiated_by, window_type, status, original_scheduled_at, proposed_scheduled_at,
      reschedule_deadline, scheduling_proposal_id, substitute_professional_id,
      certificate_storage_path, created_at
    `)
    .eq('status', 'sub_offered')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as SessionRescheduleRequest[]
}

export async function listPpRescheduleWindowsForProfessional(): Promise<SessionRescheduleRequest[]> {
  const { data, error } = await supabase
    .from('session_reschedule_requests')
    .select(`
      id, session_id, cycle_id, patient_id, responsible_professional_id,
      initiated_by, window_type, status, original_scheduled_at, proposed_scheduled_at,
      reschedule_deadline, scheduling_proposal_id, substitute_professional_id,
      certificate_storage_path, created_at
    `)
    .eq('status', 'pp_reschedule_window')
    .order('reschedule_deadline', { ascending: true })

  if (error) throw error
  return (data ?? []) as SessionRescheduleRequest[]
}

export async function uploadRescheduleCertificate(
  patientId: string,
  file: File,
): Promise<string> {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) {
    throw new Error('Tipo de arquivo não permitido. Use PDF, JPEG, PNG ou WebP.')
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Arquivo excede o limite de 10 MB.')
  }

  const storagePath = `${patientId}/${Date.now()}-${file.name}`
  const { error } = await supabase.storage.from('patient-documents').upload(storagePath, file, {
    upsert: false,
    contentType: file.type || undefined,
  })
  if (error) throw error
  return storagePath
}
