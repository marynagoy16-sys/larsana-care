import { supabase } from '@/lib/supabase'

export type PpPatente = 'ALUMINIO' | 'BRONZE' | 'PRATA' | 'OURO'

export const PATENTE_REPASSE_PERCENT: Record<PpPatente, number> = {
  ALUMINIO: 65,
  BRONZE: 70,
  PRATA: 75,
  OURO: 80,
}

export type PpPointsSettings = {
  id: string
  bronze_threshold: number
  prata_threshold: number
  ouro_threshold: number
  show_next_tier_hint: boolean
}

export type PpPointsRule = {
  id: string
  rule_code: string
  label: string
  points_delta: number
  is_active: boolean
  max_applications: number | null
  only_patente: PpPatente | null
}

export type PpPointsLedgerEntry = {
  id: string
  rule_code: string
  points_delta: number
  balance_after: number
  notes: string | null
  created_at: string
}

export type PpProfessionalPointsProfile = {
  points_total: number
  patente: PpPatente
  referral_code: string | null
  referral_count_pre_bronze: number
}

export async function getPpPointsSettings(): Promise<PpPointsSettings | null> {
  const { data, error } = await supabase.from('pp_points_settings').select('*').limit(1).maybeSingle()
  if (error) throw error
  return data as PpPointsSettings | null
}

export async function updatePpPointsSettings(values: Partial<PpPointsSettings>): Promise<void> {
  const current = await getPpPointsSettings()
  if (!current?.id) throw new Error('Configuração de pontos não encontrada')
  const { error } = await supabase.from('pp_points_settings').update(values).eq('id', current.id)
  if (error) throw error
}

export async function listPpPointsRules(): Promise<PpPointsRule[]> {
  const { data, error } = await supabase.from('pp_points_rules').select('*').order('rule_code')
  if (error) throw error
  return (data ?? []) as PpPointsRule[]
}

export async function updatePpPointsRule(id: string, values: Partial<Pick<PpPointsRule, 'points_delta' | 'is_active' | 'label'>>): Promise<void> {
  const { error } = await supabase.from('pp_points_rules').update(values).eq('id', id)
  if (error) throw error
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

export async function listPointsLedger(professionalId: string, limit = 20): Promise<PpPointsLedgerEntry[]> {
  const { data, error } = await supabase
    .from('pp_points_ledger')
    .select('id, rule_code, points_delta, balance_after, notes, created_at')
    .eq('professional_id', professionalId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as PpPointsLedgerEntry[]
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

export const patenteLabels: Record<PpPatente, string> = {
  ALUMINIO: 'Alumínio',
  BRONZE: 'Bronze',
  PRATA: 'Prata',
  OURO: 'Ouro',
}
