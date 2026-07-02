import { supabase } from '@/lib/supabase'

export async function cancelSessionWithoutJustification(
  sessionId: string,
  cancelledAt?: string,
): Promise<string> {
  const { data, error } = await supabase.rpc('cancel_session_without_justification', {
    p_session_id: sessionId,
    p_cancelled_at: cancelledAt ?? new Date().toISOString(),
  })
  if (error) throw error
  return data as string
}

export type SessionAdjustmentRow = {
  id: string
  session_id: string
  refund_family_cents: number
  pp_transfer_cents: number
  larsana_cents: number
  partial_percent: number
  cancelled_at: string
}

export async function listSessionAdjustments(cycleId: string): Promise<SessionAdjustmentRow[]> {
  const { data, error } = await supabase
    .from('session_adjustments')
    .select('id, session_id, refund_family_cents, pp_transfer_cents, larsana_cents, partial_percent, cancelled_at')
    .eq('cycle_id', cycleId)
    .order('cancelled_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as SessionAdjustmentRow[]
}
