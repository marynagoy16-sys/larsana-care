import { supabase } from '@/lib/supabase'
import type { PauseType } from '@/lib/financialClosure'

export interface FinancialClosurePreview {
  sessions_contracted: number
  sessions_completed: number
  gross_cycle_amount_cents: number
  completed_amount_cents: number
  remaining_amount_cents: number
  pp_percentage: number
  larsana_percentage: number
  pp_release_amount_cents: number
  larsana_commission_amount_cents: number
  operational_fee_cents: number
  family_refund_amount_cents: number
  larsana_total_cents: number
  session_cancel_refund_cents?: number
  session_cancel_pp_cents?: number
  session_cancel_larsana_cents?: number
}

export async function previewFinancialClosure(cycleId: string, pauseType: PauseType = 'none') {
  const { data, error } = await supabase.rpc('calculate_financial_closure', {
    p_cycle_id: cycleId,
    p_pause_type: pauseType,
  })

  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  return row as FinancialClosurePreview
}

export async function closeCycleFinancially(
  cycleId: string,
  pauseType: PauseType,
  adminDecision?: string,
) {
  const { data, error } = await supabase.rpc('close_cycle_financially', {
    p_cycle_id: cycleId,
    p_pause_type: pauseType,
    p_admin_decision: adminDecision,
  })

  if (error) throw error
  return data as string
}

export async function initiatePause(
  cycleId: string,
  pauseType: PauseType,
  justification?: string,
  adminDecision?: string,
) {
  const { data, error } = await supabase.rpc('initiate_pause', {
    p_cycle_id: cycleId,
    p_pause_type: pauseType,
    p_justification: justification,
    p_admin_decision: adminDecision,
  })

  if (error) throw error
  return data as string
}

export async function resumeTreatment(pauseEventId: string) {
  const { error } = await supabase.rpc('resume_treatment', {
    p_pause_event_id: pauseEventId,
  })

  if (error) throw error
}
