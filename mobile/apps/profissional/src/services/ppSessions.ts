import { supabase } from '@/lib/supabase'

export async function ppSessionCheckIn(sessionId: string): Promise<void> {
  const { error } = await supabase.rpc('pp_session_check_in' as never, { p_session_id: sessionId } as never)
  if (error) throw error
}

export async function ppSessionCheckOut(sessionId: string): Promise<void> {
  const { error } = await supabase.rpc('pp_session_check_out' as never, { p_session_id: sessionId } as never)
  if (error) throw error
}
