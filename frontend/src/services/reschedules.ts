import { supabase } from '@/lib/supabase'
import type { RescheduleReasonCategory } from '@/lib/financialClosure'

export interface RegisterRescheduleParams {
  sessionId: string
  reasonCategory?: RescheduleReasonCategory | null
  reasonText?: string | null
  warningAcknowledged?: boolean
  newScheduledAt?: string | null
}

export async function registerReschedule(params: RegisterRescheduleParams) {
  const { data, error } = await supabase.rpc('register_reschedule', {
    p_session_id: params.sessionId,
    p_reason_category: params.reasonCategory ?? undefined,
    p_reason_text: params.reasonText ?? undefined,
    p_warning_acknowledged: params.warningAcknowledged ?? false,
    p_new_scheduled_at: params.newScheduledAt ?? undefined,
  })

  if (error) throw error
  return data as {
    reschedule_event_id: string
    sequence_number: number
    warning_acknowledged: boolean
    is_valid_justification: boolean
  }
}
