type GamificationTable<T extends Record<string, unknown>> = {
  Row: T
  Insert: Partial<T> & Record<string, unknown>
  Update: Partial<T>
  Relationships: []
}

export type GamificationDatabaseTables = {
  pp_points_settings: GamificationTable<{
    id: string
    bronze_threshold: number
    prata_threshold: number
    ouro_threshold: number
    show_next_tier_hint: boolean
    updated_at: string
    updated_by: string | null
  }>
  pp_points_rules: GamificationTable<{
    id: string
    rule_code: string
    label: string
    points_delta: number
    is_active: boolean
    max_applications: number | null
    only_patente: 'ALUMINIO' | 'BRONZE' | 'PRATA' | 'OURO' | null
    updated_at: string
  }>
  pp_points_ledger: GamificationTable<{
    id: string
    professional_id: string
    rule_code: string
    points_delta: number
    balance_after: number
    reference_type: string | null
    reference_id: string | null
    notes: string | null
    created_at: string
  }>
}

export type GamificationDatabaseFunctions = {
  ensure_professional_referral_code: {
    Args: { p_professional_id: string }
    Returns: string
  }
  review_assessment_level_change: {
    Args: {
      p_assessment_id: string
      p_decision: 'aprovado' | 'rejeitado'
      p_admin_notes?: string | null
    }
    Returns: undefined
  }
}
