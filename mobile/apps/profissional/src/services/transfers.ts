import { supabase } from '@/lib/supabase'

export type TransferListItem = {
  id: string
  pp_transfer_amount_cents: number
  status: string
  created_at: string
  cycle_id: string
  cycle_number: number | null
  patient_name: string | null
}

export const transferStatusLabels: Record<string, string> = {
  aguardando_nf: 'NF pendente',
  aguardando_validacao: 'Aguardando validação',
  liberado: 'Liberado',
  transferido: 'Transferido',
  falhou: 'Falhou',
  cancelado: 'Cancelado',
}

export function isTransferNfPending(status: string): boolean {
  return status === 'aguardando_nf' || status === 'aguardando_validacao'
}

type TransferRow = {
  id: string
  pp_transfer_amount_cents: number
  status: string
  created_at: string
  cycle_id: string
  care_cycles: {
    cycle_number: number
    patients: { full_name: string } | null
  } | null
}

export async function listTransfersForPp(): Promise<{ data: TransferListItem[]; count: number }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], count: 0 }

  const { data: professional } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.id) return { data: [], count: 0 }

  const { data, error } = await supabase
    .from('transfers')
    .select(`
      id,
      pp_transfer_amount_cents,
      status,
      created_at,
      cycle_id,
      care_cycles (
        cycle_number,
        patients ( full_name )
      )
    `)
    .eq('professional_id', professional.id)
    .order('created_at', { ascending: false })

  if (error) throw error

  const rows = (data ?? []) as unknown as TransferRow[]
  const mapped: TransferListItem[] = rows.map((row) => ({
    id: row.id,
    pp_transfer_amount_cents: row.pp_transfer_amount_cents,
    status: row.status,
    created_at: row.created_at,
    cycle_id: row.cycle_id,
    cycle_number: row.care_cycles?.cycle_number ?? null,
    patient_name: row.care_cycles?.patients?.full_name ?? null,
  }))

  return { data: mapped, count: mapped.length }
}
