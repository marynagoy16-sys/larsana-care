import { supabase } from '@/lib/supabase'

export type PpPatente = 'ALUMINIO' | 'BRONZE' | 'PRATA' | 'OURO'

export const PATENTE_REPASSE_PERCENT: Record<PpPatente, number> = {
  ALUMINIO: 60,
  BRONZE: 70,
  PRATA: 75,
  OURO: 80,
}

export const patenteLabels: Record<PpPatente, string> = {
  ALUMINIO: 'Alumínio',
  BRONZE: 'Bronze',
  PRATA: 'Prata',
  OURO: 'Ouro',
}

export type PpPointsSettings = {
  bronze_threshold: number
  prata_threshold: number
  ouro_threshold: number
  show_next_tier_hint: boolean
}

export type PpProfessionalPointsProfile = {
  points_total: number
  patente: PpPatente
  referral_code: string | null
  referral_count_pre_bronze: number
}

export async function getCurrentProfessionalId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) throw error
  return data?.id ?? null
}

export async function getPpPointsSettings(): Promise<PpPointsSettings | null> {
  const { data, error } = await supabase.from('pp_points_settings').select('*').limit(1).maybeSingle()
  if (error) throw error
  return data as PpPointsSettings | null
}

export async function getProfessionalPointsProfile(professionalId: string): Promise<PpProfessionalPointsProfile | null> {
  const { data, error } = await supabase
    .from('professionals')
    .select('points_total, patente, referral_code, referral_count_pre_bronze')
    .eq('id', professionalId)
    .maybeSingle()
  if (error) throw error
  return data as PpProfessionalPointsProfile | null
}

export async function ensureReferralCode(professionalId: string): Promise<string> {
  const { data, error } = await supabase.rpc('ensure_professional_referral_code', {
    p_professional_id: professionalId,
  })
  if (error) throw error
  return data as string
}

export function resolveNextPatenteTarget(
  points: number,
  settings: PpPointsSettings,
  current: PpPatente,
): { patente: PpPatente; threshold: number } | null {
  if (current === 'OURO') return null
  if (current === 'ALUMINIO' || points < settings.bronze_threshold) {
    return { patente: 'BRONZE', threshold: settings.bronze_threshold }
  }
  if (current === 'BRONZE' || points < settings.prata_threshold) {
    return { patente: 'PRATA', threshold: settings.prata_threshold }
  }
  return { patente: 'OURO', threshold: settings.ouro_threshold }
}
