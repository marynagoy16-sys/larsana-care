import { supabase } from '@/lib/supabaseClient'

export type SchedulingProposal = {
  id: string
  demand_id: string | null
  proposal_type: 'avaliacao' | 'continuidade' | 'remarcacao'
  status: string
  created_at: string
}

export async function listPendingSchedulingProposalsForPatient(): Promise<SchedulingProposal[]> {
  const { data, error } = await supabase
    .from('scheduling_proposals')
    .select('id, demand_id, proposal_type, status, created_at')
    .eq('status', 'pendente')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as SchedulingProposal[]
}
