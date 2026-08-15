import { supabase } from '@/lib/supabase'

export type SchedulingProposalStatus = 'pendente' | 'confirmado' | 'recusado' | 'expirado'

export type SchedulingProposalSlot = {
  id: string
  proposal_id: string
  starts_at: string
  ends_at: string
  sort_order: number
}

export type SchedulingProposal = {
  id: string
  demand_id: string | null
  patient_id: string
  professional_id: string
  proposal_type: 'avaliacao' | 'continuidade' | 'remarcacao'
  status: SchedulingProposalStatus
  expires_at: string | null
  confirmed_slot_id: string | null
  rejection_reason: string | null
  created_at: string
  scheduling_proposal_slots?: SchedulingProposalSlot[]
  scheduling_messages?: SchedulingMessage[]
}

export type SchedulingMessage = {
  id: string
  proposal_id: string
  sender_role: 'pp' | 'paciente' | 'sistema'
  template_code: string
  body: string
  created_at: string
}

export type AvailabilitySlotInput = {
  starts_at: string
  ends_at?: string
}

/** Prazo para o paciente confirmar um horário após o PP enviar opções (RPC `submit_pp_availability`). */
export const SCHEDULING_PATIENT_RESPONSE_DAYS = 7

/** Avaliação inicial deve ser agendada/realizada em até 7 dias após aceite da demanda. */
export const AVALIACAO_MUST_OCCUR_WITHIN_DAYS = 7

/** Horizonte máximo para oferta de horários de continuidade. */
export const CONTINUIDADE_OFFER_HORIZON_DAYS = 28

export async function submitPpAvailability(
  demandId: string,
  slots: AvailabilitySlotInput[],
): Promise<{ proposal_id: string; status: string }> {
  const { data, error } = await supabase.rpc('submit_pp_availability', {
    p_demand_id: demandId,
    p_slots: slots,
  })
  if (error) throw error
  return data as { proposal_id: string; status: string }
}

export async function patientConfirmSlot(
  proposalId: string,
  slotId: string,
): Promise<{ proposal_id: string; status: string; session_id: string | null }> {
  const { data, error } = await supabase.rpc('patient_confirm_slot', {
    p_proposal_id: proposalId,
    p_slot_id: slotId,
  })
  if (error) throw error
  return data as { proposal_id: string; status: string; session_id: string | null }
}

export async function patientRejectSlot(
  proposalId: string,
  reason?: string,
): Promise<{ proposal_id: string; status: string }> {
  const { data, error } = await supabase.rpc('patient_reject_slot', {
    p_proposal_id: proposalId,
    p_reason: reason ?? null,
  })
  if (error) throw error
  return data as { proposal_id: string; status: string }
}

export async function ppRescheduleSession(
  sessionId: string,
  newScheduledAt: string,
): Promise<{
  flow?: 'patient_acceptance' | 'sub_offer'
  proposal_id?: string
  request_id?: string
  status?: string
}> {
  const { data, error } = await supabase.rpc('pp_reschedule_session', {
    p_session_id: sessionId,
    p_new_scheduled_at: newScheduledAt,
  })
  if (error) throw error
  return data as {
    flow?: 'patient_acceptance' | 'sub_offer'
    proposal_id?: string
    request_id?: string
    status?: string
  }
}

export async function listPendingSchedulingProposalsForPatient(): Promise<SchedulingProposal[]> {
  const { data, error } = await supabase
    .from('scheduling_proposals')
    .select(`
      id, demand_id, patient_id, professional_id, proposal_type, status,
      expires_at, confirmed_slot_id, rejection_reason, created_at,
      scheduling_proposal_slots ( id, proposal_id, starts_at, ends_at, sort_order ),
      scheduling_messages ( id, proposal_id, sender_role, template_code, body, created_at )
    `)
    .eq('status', 'pendente')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as SchedulingProposal[]
}

export async function getSchedulingProposal(id: string): Promise<SchedulingProposal | null> {
  const { data, error } = await supabase
    .from('scheduling_proposals')
    .select(`
      id, demand_id, patient_id, professional_id, proposal_type, status,
      expires_at, confirmed_slot_id, rejection_reason, created_at,
      scheduling_proposal_slots ( id, proposal_id, starts_at, ends_at, sort_order ),
      scheduling_messages ( id, proposal_id, sender_role, template_code, body, created_at )
    `)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data as SchedulingProposal | null
}

export type DemandSchedulingFollowUp =
  | { kind: 'needs_slots' }
  | { kind: 'awaiting_patient' }
  | { kind: 'confirmed' }

export async function getDemandSchedulingFollowUp(demandId: string): Promise<DemandSchedulingFollowUp> {
  const { data, error } = await supabase
    .from('scheduling_proposals')
    .select('status')
    .eq('demand_id', demandId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return { kind: 'needs_slots' }
  if (data.status === 'pendente') return { kind: 'awaiting_patient' }
  if (data.status === 'confirmado') return { kind: 'confirmed' }
  return { kind: 'needs_slots' }
}

/** Demanda alocada ao PP atual que ainda precisa de envio de horários. */
export async function getPendingScheduleDemandIdForPatient(patientId: string): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: professional, error: proError } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (proError) throw proError
  if (!professional) return null

  const { data: demand, error: demandError } = await supabase
    .from('demands')
    .select('id')
    .eq('patient_id', patientId)
    .eq('status', 'alocada')
    .eq('assigned_professional_id', professional.id)
    .maybeSingle()

  if (demandError) throw demandError
  if (!demand) return null

  const followUp = await getDemandSchedulingFollowUp(demand.id)
  return followUp.kind === 'needs_slots' ? demand.id : null
}
