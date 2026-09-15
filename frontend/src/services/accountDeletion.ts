import { supabase } from '@/lib/supabase'

export interface AccountDeletionStatus {
  pending: boolean
  requested_at?: string
  scheduled_deletion_at?: string
  already_requested?: boolean
}

export interface CancelDeletionResult {
  cancelled: boolean
  scheduled_deletion_at?: string
}

// RPCs criadas em 20260916000000_account_deletion_flow.sql. Ainda não constam nos
// tipos gerados do Supabase, por isso o cast `as never` (mesmo padrão de publicLegalTerms).
export async function getAccountDeletionStatus(): Promise<AccountDeletionStatus> {
  const { data, error } = await supabase.rpc('get_account_deletion_status' as never)
  if (error) throw error
  return (data ?? { pending: false }) as unknown as AccountDeletionStatus
}

export async function requestAccountDeletion(): Promise<AccountDeletionStatus> {
  const { data, error } = await supabase.rpc('request_account_deletion' as never)
  if (error) throw error
  return data as unknown as AccountDeletionStatus
}

export async function cancelAccountDeletion(): Promise<CancelDeletionResult> {
  const { data, error } = await supabase.rpc('cancel_account_deletion' as never)
  if (error) throw error
  return data as unknown as CancelDeletionResult
}

export async function cancelAccountDeletionOnLogin(): Promise<CancelDeletionResult> {
  const { data, error } = await supabase.rpc('cancel_account_deletion_on_login' as never)
  if (error) throw error
  return data as unknown as CancelDeletionResult
}
