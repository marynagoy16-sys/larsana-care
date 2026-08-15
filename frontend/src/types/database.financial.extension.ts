type FinancialTable<T extends Record<string, unknown>> = {
  Row: T
  Insert: Partial<T> & Record<string, unknown>
  Update: Partial<T>
  Relationships: []
}

export type PauseTypeEnum =
  | 'none'
  | 'justified'
  | 'unjustified'
  | 'professional_or_operation_issue'

export type RescheduleReasonCategoryEnum =
  | 'saude'
  | 'internacao'
  | 'problema_fisio'
  | 'horario'
  | 'familiar'
  | 'outro'

export type FinancialDatabaseTables = {
  pause_events: FinancialTable<{
    id: string
    cycle_id: string
    patient_id: string
    treatment_pause_id: string | null
    pause_type: PauseTypeEnum
    justification: string | null
    admin_decision: string | null
    financial_closure_id: string | null
    initiated_by: string | null
    closed_at: string | null
    created_at: string
  }>
  financial_closures: FinancialTable<{
    id: string
    cycle_id: string
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
    pause_type: PauseTypeEnum
    snapshot: Record<string, unknown>
    created_by: string | null
    created_at: string
  }>
  reschedule_events: FinancialTable<{
    id: string
    cycle_id: string
    session_id: string
    sequence_number: number
    reason_category: RescheduleReasonCategoryEnum | null
    reason_text: string | null
    warning_acknowledged: boolean
    is_valid_justification: boolean
    new_scheduled_at: string | null
    created_by: string | null
    created_at: string
  }>
  session_adjustments: FinancialTable<{
    id: string
    cycle_id: string
    session_id: string
    reason: string
    session_value_cents: number
    partial_percent: number
    refund_family_cents: number
    family_charge_cents: number
    pp_transfer_cents: number
    larsana_cents: number
    cancelled_at: string
    created_by: string | null
    created_at: string
  }>
}

export type FinancialDatabaseFunctions = {
  calculate_financial_closure: {
    Args: { p_cycle_id: string; p_pause_type?: PauseTypeEnum }
    Returns: {
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
    }[]
  }
  close_cycle_financially: {
    Args: {
      p_cycle_id: string
      p_pause_type: PauseTypeEnum
      p_admin_decision?: string | null
    }
    Returns: string
  }
  initiate_pause: {
    Args: {
      p_cycle_id: string
      p_pause_type: PauseTypeEnum
      p_justification?: string | null
      p_admin_decision?: string | null
    }
    Returns: string
  }
  resume_treatment: {
    Args: { p_pause_event_id: string }
    Returns: undefined
  }
  register_reschedule: {
    Args: {
      p_session_id: string
      p_reason_category?: RescheduleReasonCategoryEnum | null
      p_reason_text?: string | null
      p_warning_acknowledged?: boolean
      p_new_scheduled_at?: string | null
    }
    Returns: {
      reschedule_event_id: string
      sequence_number: number
      warning_acknowledged: boolean
      is_valid_justification: boolean
    }
  }
  submit_pp_transfer_invoice: {
    Args: {
      p_transfer_id: string
      p_storage_path: string
      p_file_name: string
    }
    Returns: undefined
  }
}
