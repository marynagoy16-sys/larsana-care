type SchedulingTable<T extends Record<string, unknown>> = {
  Row: T
  Insert: Partial<T> & Record<string, unknown>
  Update: Partial<T>
  Relationships: []
}

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

export type SchedulingDatabaseTables = {
  scheduling_proposals: SchedulingTable<{
    id: string
    demand_id: string | null
    patient_id: string
    professional_id: string
    cycle_id: string | null
    session_id: string | null
    proposal_type: 'avaliacao' | 'continuidade' | 'remarcacao'
    status: 'pendente' | 'confirmado' | 'recusado' | 'expirado'
    expires_at: string | null
    confirmed_slot_id: string | null
    rejection_reason: string | null
    created_at: string
    updated_at: string
  }>
  scheduling_proposal_slots: SchedulingTable<{
    id: string
    proposal_id: string
    starts_at: string
    ends_at: string
    sort_order: number
    created_at: string
  }>
  scheduling_messages: SchedulingTable<{
    id: string
    proposal_id: string
    sender_role: string
    template_code: string
    body: string
    created_at: string
  }>
  session_reschedule_requests: SchedulingTable<{
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
    original_professional_id: string | null
    certificate_storage_path: string | null
    session_adjustment_id: string | null
    created_by: string | null
    created_at: string
    updated_at: string
  }>
}

export type SchedulingDatabaseFunctions = {
  submit_pp_availability: {
    Args: { p_demand_id: string; p_slots: unknown }
    Returns: { proposal_id: string; status: string }
  }
  patient_confirm_slot: {
    Args: { p_proposal_id: string; p_slot_id: string }
    Returns: { proposal_id: string; status: string; session_id: string | null }
  }
  patient_reject_slot: {
    Args: { p_proposal_id: string; p_reason?: string | null }
    Returns: { proposal_id: string; status: string }
  }
  pp_reschedule_session: {
    Args: { p_session_id: string; p_new_scheduled_at: string }
    Returns: {
      flow?: 'patient_acceptance' | 'sub_offer'
      proposal_id?: string
      request_id?: string
      status?: string
    }
  }
  pp_request_reschedule: {
    Args: { p_session_id: string; p_new_scheduled_at: string }
    Returns: {
      flow?: 'patient_acceptance' | 'sub_offer'
      proposal_id?: string
      request_id?: string
      status?: string
    }
  }
  patient_respond_reschedule_proposal: {
    Args: { p_proposal_id: string; p_accept: boolean; p_slot_id?: string | null }
    Returns: { status: string; session_id?: string; request_id?: string }
  }
  patient_respond_sub_offer: {
    Args: { p_request_id: string; p_accept: boolean }
    Returns: { status: string; substitute_professional_id?: string; session_id?: string }
  }
  patient_request_reschedule: {
    Args: {
      p_session_id: string
      p_new_scheduled_at: string
      p_certificate_storage_path?: string | null
    }
    Returns: Record<string, unknown>
  }
  pp_reschedule_after_sub_rejection: {
    Args: { p_request_id: string; p_new_scheduled_at: string }
    Returns: Record<string, unknown>
  }
}
