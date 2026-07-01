import { supabase } from '@/lib/supabase'

export type TransferListItem = {
  id: string
  pp_transfer_amount_cents: number
  status: string
  created_at: string
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
    .select('id, pp_transfer_amount_cents, status, created_at')
    .eq('professional_id', professional.id)
    .order('created_at', { ascending: false })

  if (error) throw error

  const rows = (data ?? []) as TransferListItem[]
  return { data: rows, count: rows.length }
}
