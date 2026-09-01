import { supabase } from '@/lib/supabase'

export type SessionReminderState = {
  sessionId: string
  presenceConfirmed: boolean
  reschedulePending: boolean
}

export async function patientChatConfirmPresence(sessionId: string): Promise<void> {
  const { error } = await supabase.rpc('patient_chat_confirm_presence' as never, {
    p_session_id: sessionId,
  } as never)
  if (error) throw error
}

export async function patientChatRequestReschedule(sessionId: string): Promise<{ request_id: string }> {
  const { data, error } = await supabase.rpc('patient_chat_request_reschedule' as never, {
    p_session_id: sessionId,
  } as never)
  if (error) throw error
  return data as { request_id: string }
}

export async function ppSubmitRescheduleAvailability(
  requestId: string,
  slots: { starts_at: string; ends_at?: string }[],
): Promise<{ proposal_id: string }> {
  const { data, error } = await supabase.rpc('pp_submit_reschedule_availability' as never, {
    p_request_id: requestId,
    p_slots: slots,
  } as never)
  if (error) throw error
  return data as { proposal_id: string }
}

export async function listSessionReminderStates(
  sessionIds: string[],
): Promise<Map<string, SessionReminderState>> {
  const map = new Map<string, SessionReminderState>()
  if (sessionIds.length === 0) return map

  const { data: sessions, error: sessionsError } = await supabase
    .from('care_sessions')
    .select('id, presence_confirmed_at')
    .in('id', sessionIds)

  if (sessionsError) throw sessionsError

  const { data: requests, error: requestsError } = await supabase
    .from('session_reschedule_requests')
    .select('session_id, status')
    .in('session_id', sessionIds)
    .in('status', ['awaiting_pp_slots', 'pending_patient'])

  if (requestsError) throw requestsError

  for (const id of sessionIds) {
    const session = sessions?.find((row) => row.id === id)
    const hasPendingRequest = (requests ?? []).some((row) => row.session_id === id)
    map.set(id, {
      sessionId: id,
      presenceConfirmed: Boolean(session?.presence_confirmed_at),
      reschedulePending: hasPendingRequest,
    })
  }

  return map
}

export async function getAwaitingRescheduleRequestForSession(sessionId: string) {
  const { data, error } = await supabase
    .from('session_reschedule_requests')
    .select('id, session_id, status, original_scheduled_at, reschedule_deadline')
    .eq('session_id', sessionId)
    .eq('status', 'awaiting_pp_slots')
    .maybeSingle()

  if (error) throw error
  return data
}
