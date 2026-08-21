import { supabase } from '@/lib/supabase'

export type PpPatente = 'ALUMINIO' | 'BRONZE' | 'PRATA' | 'OURO'

export const PATENTE_REPASSE_PERCENT: Record<PpPatente, number> = {
  ALUMINIO: 60,
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

export const DEFAULT_PP_POINTS_SETTINGS: PpPointsSettings = {
  id: 'default',
  bronze_threshold: 600,
  prata_threshold: 800,
  ouro_threshold: 1000,
  show_next_tier_hint: true,
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

export async function getPpPointsSettings(): Promise<PpPointsSettings> {
  const { data, error } = await supabase.from('pp_points_settings').select('*').limit(1).maybeSingle()
  if (error) throw error
  return (data as PpPointsSettings | null) ?? DEFAULT_PP_POINTS_SETTINGS
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

export type PpPatenteTierRow = {
  patente: PpPatente
  base_pp_percent: number
  label: string
  sort_order: number
}

export async function listPpPatenteTiers(): Promise<PpPatenteTierRow[]> {
  const { data, error } = await supabase
    .from('pp_patente_tiers')
    .select('patente, base_pp_percent, label, sort_order')
    .order('sort_order')
  if (error) throw error
  return (data ?? []) as PpPatenteTierRow[]
}

export async function updatePpPatenteTierPercent(patente: PpPatente, base_pp_percent: number): Promise<void> {
  const { error } = await supabase
    .from('pp_patente_tiers')
    .update({ base_pp_percent })
    .eq('patente', patente)
  if (error) throw error
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

export type PatenteProgress = {
  current: number
  target: number
  percent: number
  fromPatente: PpPatente
}

export function resolvePatenteProgress(
  points: number,
  patente: PpPatente,
  settings: Pick<PpPointsSettings, 'bronze_threshold' | 'prata_threshold' | 'ouro_threshold'>,
): PatenteProgress {
  if (patente === 'OURO') {
    return { current: points, target: settings.ouro_threshold, percent: 100, fromPatente: 'OURO' }
  }
  if (patente === 'PRATA') {
    const from = settings.prata_threshold
    const to = settings.ouro_threshold
    return {
      current: points,
      target: to,
      percent: Math.min(100, Math.round(((points - from) / Math.max(1, to - from)) * 100)),
      fromPatente: 'PRATA',
    }
  }
  if (patente === 'BRONZE') {
    const from = settings.bronze_threshold
    const to = settings.prata_threshold
    return {
      current: points,
      target: to,
      percent: Math.min(100, Math.round(((points - from) / Math.max(1, to - from)) * 100)),
      fromPatente: 'BRONZE',
    }
  }
  const to = settings.bronze_threshold
  return {
    current: points,
    target: to,
    percent: Math.min(100, Math.round((points / Math.max(1, to)) * 100)),
    fromPatente: 'ALUMINIO',
  }
}

export const patenteLabels: Record<PpPatente, string> = {
  ALUMINIO: 'Alumínio',
  BRONZE: 'Bronze',
  PRATA: 'Prata',
  OURO: 'Ouro',
}
