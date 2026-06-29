import { supabase } from '@/lib/supabase'

export interface PricingEntry {
  id: string
  version_id: string
  region_id: string
  patient_level: string
  session_price_cents: number
}

export interface CommissionRule {
  id: string
  version_id: string
  pp_class: string
  pp_percent: number
  larsana_percent: number
}

export interface RetentionRule {
  id: string
  version_id: string
  larsana_percent: number
}

export interface PricingBundle {
  version: { id: string; version_code: string; is_active: boolean; effective_from: string } | null
  entries: PricingEntry[]
  commissions: CommissionRule[]
  retention: RetentionRule | null
}

export async function getActivePricingVersion() {
  const { data, error } = await (supabase as any)
    .from('pricing_matrix_versions')
    .select('*')
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getPricingBundle(versionId: string): Promise<PricingBundle> {
  const [entries, commissions, retention] = await Promise.all([
    (supabase as any)
      .from('pricing_matrix_entries')
      .select('*')
      .eq('version_id', versionId)
      .then((r: any) => { if (r.error) throw r.error; return r.data ?? [] }),
    (supabase as any)
      .from('commission_rules')
      .select('*')
      .eq('version_id', versionId)
      .then((r: any) => { if (r.error) throw r.error; return r.data ?? [] }),
    (supabase as any)
      .from('first_month_retention_rules')
      .select('*')
      .eq('version_id', versionId)
      .maybeSingle()
      .then((r: any) => { if (r.error) throw r.error; return r.data ?? null }),
  ])

  const version = await getActivePricingVersion()

  return { version, entries, commissions, retention }
}
