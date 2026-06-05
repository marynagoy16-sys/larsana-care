import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type PatientLevel = Database['public']['Enums']['patient_level']
type PpClass = Database['public']['Enums']['pp_class']

export type PricingVersion = Database['public']['Tables']['pricing_matrix_versions']['Row']
export type PricingEntry = Database['public']['Tables']['pricing_matrix_entries']['Row']
export type CommissionRule = Database['public']['Tables']['commission_rules']['Row']
export type RetentionRule = Database['public']['Tables']['first_month_retention_rules']['Row']

export const PRICING_PATIENT_LEVELS: PatientLevel[] = ['N1', 'N2', 'N3', 'VALOR_SOCIAL']
export const PP_CLASSES: PpClass[] = ['BRONZE', 'PRATA', 'OURO']

export const pricingQueryKeys = {
  versions: ['pricing_matrix_versions'] as const,
  version: (id: string) => ['pricing_matrix_versions', id] as const,
  bundle: (id: string) => ['pricing_bundle', id] as const,
}

export function centsToReaisInput(cents: number | null | undefined): string {
  if (cents == null) return ''
  return (cents / 100).toFixed(2).replace('.', ',')
}

export function reaisInputToCents(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const normalized = trimmed.replace(/\./g, '').replace(',', '.')
  const num = Number(normalized)
  if (!Number.isFinite(num) || num < 0) return null
  return Math.round(num * 100)
}

export async function listPricingVersions() {
  const { data, error } = await supabase
    .from('pricing_matrix_versions')
    .select('*')
    .order('effective_from', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getPricingVersion(id: string) {
  const { data, error } = await supabase.from('pricing_matrix_versions').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function listPricingEntries(versionId: string) {
  const { data, error } = await supabase
    .from('pricing_matrix_entries')
    .select('*')
    .eq('version_id', versionId)
  if (error) throw error
  return data ?? []
}

export async function listCommissionRules(versionId: string) {
  const { data, error } = await supabase
    .from('commission_rules')
    .select('*')
    .eq('version_id', versionId)
    .order('pp_class')
  if (error) throw error
  return data ?? []
}

export async function getRetentionRule(versionId: string) {
  const { data, error } = await supabase
    .from('first_month_retention_rules')
    .select('*')
    .eq('version_id', versionId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getPricingBundle(versionId: string) {
  const [version, entries, commissions, retention] = await Promise.all([
    getPricingVersion(versionId),
    listPricingEntries(versionId),
    listCommissionRules(versionId),
    getRetentionRule(versionId),
  ])
  return { version, entries, commissions, retention }
}

export async function activatePricingVersion(versionId: string) {
  const { error: deactivateError } = await supabase
    .from('pricing_matrix_versions')
    .update({ is_active: false })
    .neq('id', versionId)
  if (deactivateError) throw deactivateError

  const { data, error } = await supabase
    .from('pricing_matrix_versions')
    .update({ is_active: true })
    .eq('id', versionId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function clonePricingVersion(params: {
  sourceVersionId: string
  versionCode: string
  effectiveFrom: string
  notes?: string | null
}) {
  const [entries, commissions, retention] = await Promise.all([
    listPricingEntries(params.sourceVersionId),
    listCommissionRules(params.sourceVersionId),
    getRetentionRule(params.sourceVersionId),
  ])

  const { data: version, error: versionError } = await supabase
    .from('pricing_matrix_versions')
    .insert({
      version_code: params.versionCode,
      effective_from: params.effectiveFrom,
      is_active: false,
      notes: params.notes ?? null,
    })
    .select()
    .single()
  if (versionError) throw versionError

  const newId = version.id

  if (entries.length > 0) {
    const { error } = await supabase.from('pricing_matrix_entries').insert(
      entries.map((entry) => ({
        version_id: newId,
        region_id: entry.region_id,
        patient_level: entry.patient_level,
        session_price_cents: entry.session_price_cents,
      })),
    )
    if (error) throw error
  }

  if (commissions.length > 0) {
    const { error } = await supabase.from('commission_rules').insert(
      commissions.map((rule) => ({
        version_id: newId,
        pp_class: rule.pp_class,
        pp_percent: rule.pp_percent,
        larsana_percent: rule.larsana_percent,
      })),
    )
    if (error) throw error
  }

  const { error: retentionError } = await supabase.from('first_month_retention_rules').insert({
    version_id: newId,
    larsana_percent: retention?.larsana_percent ?? 40,
  })
  if (retentionError) throw retentionError

  return version
}

export async function upsertPricingEntries(
  entries: Array<{
    version_id: string
    region_id: string
    patient_level: PatientLevel
    session_price_cents: number
  }>,
) {
  if (entries.length === 0) return
  const { error } = await supabase
    .from('pricing_matrix_entries')
    .upsert(entries, { onConflict: 'version_id,region_id,patient_level' })
  if (error) throw error
}

export async function saveCommissionRules(
  versionId: string,
  rules: Array<{ id?: string; pp_class: PpClass; pp_percent: number }>,
) {
  for (const rule of rules) {
    const larsana_percent = 100 - rule.pp_percent
    if (rule.id) {
      const { error } = await supabase
        .from('commission_rules')
        .update({ pp_percent: rule.pp_percent, larsana_percent })
        .eq('id', rule.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('commission_rules').insert({
        version_id: versionId,
        pp_class: rule.pp_class,
        pp_percent: rule.pp_percent,
        larsana_percent,
      })
      if (error) throw error
    }
  }
}

export async function saveRetentionRule(
  versionId: string,
  larsanaPercent: number,
  existingId?: string | null,
) {
  if (existingId) {
    const { error } = await supabase
      .from('first_month_retention_rules')
      .update({ larsana_percent: larsanaPercent })
      .eq('id', existingId)
    if (error) throw error
    return
  }

  const { error } = await supabase.from('first_month_retention_rules').insert({
    version_id: versionId,
    larsana_percent: larsanaPercent,
  })
  if (error) throw error
}
