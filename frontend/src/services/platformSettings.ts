import { supabase } from '@/lib/supabase'

export type PlatformSettings = {
  id: string
  assessment_fee_cents: number
  assessment_pp_share_cents: number
  early_cycle_discount_pct: number
  late_interest_pct_month: number
  late_fine_pct: number
  max_weekly_sessions_pp: number
  updated_at: string
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const { data, error } = await supabase.rpc('get_platform_settings' as never)
  if (error) throw error
  return data as PlatformSettings
}

export async function updatePlatformSettings(
  input: Omit<PlatformSettings, 'id' | 'updated_at'>,
): Promise<void> {
  const { error } = await supabase.rpc('update_platform_settings' as never, {
    p_assessment_fee_cents: input.assessment_fee_cents,
    p_assessment_pp_share_cents: input.assessment_pp_share_cents,
    p_early_cycle_discount_pct: input.early_cycle_discount_pct,
    p_late_interest_pct_month: input.late_interest_pct_month,
    p_late_fine_pct: input.late_fine_pct,
    p_max_weekly_sessions_pp: input.max_weekly_sessions_pp,
  } as never)
  if (error) throw error
}
