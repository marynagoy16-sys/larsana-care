import { supabase } from '@/lib/supabase'

export async function ppSessionCheckIn(sessionId: string): Promise<void> {
  const { error } = await supabase.rpc('pp_session_check_in' as never, { p_session_id: sessionId } as never)
  if (error) throw error
}

export async function ppSessionCheckOut(sessionId: string): Promise<void> {
  const { error } = await supabase.rpc('pp_session_check_out' as never, { p_session_id: sessionId } as never)
  if (error) throw error
}

export async function patientConfirmSessionPresence(sessionId: string): Promise<void> {
  const { error } = await supabase.rpc('patient_confirm_session_presence' as never, {
    p_session_id: sessionId,
  } as never)
  if (error) throw error
}

export async function getPpWeeklySessionCount(weekStart: string): Promise<number> {
  const { data: professional } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '')
    .maybeSingle()

  if (!professional?.id) return 0

  const { data, error } = await supabase.rpc('pp_weekly_scheduled_session_count' as never, {
    p_professional_id: professional.id,
    p_week_start: weekStart,
  } as never)
  if (error) throw error
  return Number(data ?? 0)
}
