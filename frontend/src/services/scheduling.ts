import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'

/** Mesmo texto exibido nos botões de escolha de horário. */
export function formatAvailabilitySlotLabel(startsAt: string): string {
  return format(new Date(startsAt), "EEEE, d 'de' MMMM · HH:mm", { locale: ptBR })
}

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

export async function registerFixedCycleSchedule(
  demandId: string,
  slots: AvailabilitySlotInput[],
): Promise<{ scheduled: number }> {
  const { data, error } = await supabase.rpc('pp_register_fixed_cycle_schedule' as never, {
    p_demand_id: demandId,
    p_slots: slots,
  } as never)
  if (error) throw error
  return data as { scheduled: number }
}

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
  options?: { choiceLabel?: string },
): Promise<{ proposal_id: string; status: string; session_id: string | null }> {
  const { data, error } = await supabase.rpc('patient_confirm_slot', {
    p_proposal_id: proposalId,
    p_slot_id: slotId,
    p_choice_label: options?.choiceLabel ?? null,
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
    p_reason: reason,
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

export async function listPendingSchedulingProposalsForPatient(options?: {
  patientId?: string
  demandId?: string
}): Promise<SchedulingProposal[]> {
  const { data, error } = await supabase.rpc('patient_list_pending_scheduling_proposals' as never, {
    p_demand_id: options?.demandId ?? null,
  } as never)

  if (error) throw error
  return (data ?? []) as unknown as SchedulingProposal[]
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
  return data as unknown as SchedulingProposal | null
}

export type DemandSchedulingFollowUp =
  | { kind: 'needs_slots' }
  | { kind: 'awaiting_patient' }
  | { kind: 'confirmed' }

type DemandScheduleContext = {
  id: string
  cycle_id: string | null
  demand_type: string
}

/** Demanda ainda precisa que o PP envie horários (inclui continuidade pós-pagamento com sessões sem data). */
export async function demandNeedsScheduleSlots(demand: DemandScheduleContext): Promise<boolean> {
  const { data: latestProposal, error: proposalError } = await supabase
    .from('scheduling_proposals')
    .select('status')
    .eq('demand_id', demand.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (proposalError) throw proposalError
  if (latestProposal?.status === 'pendente') return false

  if (demand.cycle_id && demand.demand_type === 'continuidade') {
    const { count, error: sessionError } = await supabase
      .from('care_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('cycle_id', demand.cycle_id)
      .eq('is_assessment_session', false)
      .is('scheduled_at', null)
      .eq('status', 'prevista')

    if (sessionError) throw sessionError
    if ((count ?? 0) > 0) return true
  }

  if (!latestProposal) return true
  if (latestProposal.status === 'recusado' || latestProposal.status === 'expirado') return true
  return false
}

export async function getDemandSchedulingFollowUp(demandId: string): Promise<DemandSchedulingFollowUp> {
  const { data: demandRaw, error: demandError } = await supabase
    .from('demands')
    .select('id, cycle_id, demand_type' as never)
    .eq('id', demandId)
    .maybeSingle()

  if (demandError) throw demandError
  const demand = demandRaw as DemandScheduleContext | null

  if (demand && (await demandNeedsScheduleSlots(demand))) {
    return { kind: 'needs_slots' }
  }

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

export type PendingScheduleDemand = {
  id: string
  demand_type: 'avaliacao' | 'continuidade'
}

/** Demanda alocada ao PP atual que ainda precisa de envio de horários. */
export async function getPendingScheduleDemandForPatient(
  patientId: string,
): Promise<PendingScheduleDemand | null> {
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

  const { data: demandsRaw, error: demandError } = await supabase
    .from('demands')
    .select('id, demand_type, cycle_id, created_at' as never)
    .eq('patient_id', patientId)
    .eq('status', 'alocada')
    .eq('assigned_professional_id', professional.id)
    .order('created_at', { ascending: false })

  if (demandError) throw demandError
  const demands = (demandsRaw ?? []) as unknown as DemandScheduleContext[]
  if (!demands.length) return null

  const prioritized = [
    ...demands.filter((d) => d.cycle_id != null),
    ...demands.filter((d) => d.cycle_id == null),
  ]

  for (const demand of prioritized) {
    if (await demandNeedsScheduleSlots(demand)) {
      return {
        id: demand.id,
        demand_type: demand.demand_type as PendingScheduleDemand['demand_type'],
      }
    }
  }

  return null
}

/** @deprecated Use getPendingScheduleDemandForPatient */
export async function getPendingScheduleDemandIdForPatient(patientId: string): Promise<string | null> {
  const pending = await getPendingScheduleDemandForPatient(patientId)
  return pending?.id ?? null
}
