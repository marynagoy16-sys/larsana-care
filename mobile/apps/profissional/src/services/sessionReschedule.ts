import { supabase } from '@/lib/supabaseClient'

export type SessionRescheduleRequest = {
  id: string
  session_id: string
  original_scheduled_at: string
  reschedule_deadline: string
  status: string
}

export async function listPpRescheduleWindowsForProfessional(): Promise<SessionRescheduleRequest[]> {
  const { data, error } = await supabase
    .from('session_reschedule_requests')
    .select(`
      id, session_id, original_scheduled_at, reschedule_deadline, status
    `)
    .eq('status', 'pp_reschedule_window')
    .order('reschedule_deadline', { ascending: true })

  if (error) throw error
  return (data ?? []) as SessionRescheduleRequest[]
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
  return data as Record<string, unknown>
}

export async function ppRescheduleSession(
  sessionId: string,
  newScheduledAt: string,
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.rpc('pp_reschedule_session', {
    p_session_id: sessionId,
    p_new_scheduled_at: newScheduledAt,
  })
  if (error) throw error
  return data as Record<string, unknown>
}
