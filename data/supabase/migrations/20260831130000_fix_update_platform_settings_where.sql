-- fix_update_platform_settings_where
-- Supabase blocks UPDATE without WHERE; target the canonical settings row explicitly.

CREATE OR REPLACE FUNCTION public.update_platform_settings(
  p_assessment_fee_cents integer,
  p_assessment_pp_share_cents integer,
  p_early_cycle_discount_pct numeric,
  p_late_interest_pct_month numeric,
  p_late_fine_pct numeric,
  p_max_weekly_sessions_pp integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings_id uuid;
BEGIN
  IF NOT public.is_staff_role(ARRAY['admin']::public.user_role[]) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT ps.id
  INTO v_settings_id
  FROM public.platform_settings ps
  ORDER BY ps.updated_at DESC
  LIMIT 1;

  IF v_settings_id IS NULL THEN
    INSERT INTO public.platform_settings (
      assessment_fee_cents,
      assessment_pp_share_cents,
      early_cycle_discount_pct,
      late_interest_pct_month,
      late_fine_pct,
      max_weekly_sessions_pp
    ) VALUES (
      p_assessment_fee_cents,
      p_assessment_pp_share_cents,
      p_early_cycle_discount_pct,
      p_late_interest_pct_month,
      p_late_fine_pct,
      p_max_weekly_sessions_pp
    );
    RETURN;
  END IF;

  UPDATE public.platform_settings
  SET
    assessment_fee_cents = p_assessment_fee_cents,
    assessment_pp_share_cents = p_assessment_pp_share_cents,
    early_cycle_discount_pct = p_early_cycle_discount_pct,
    late_interest_pct_month = p_late_interest_pct_month,
    late_fine_pct = p_late_fine_pct,
    max_weekly_sessions_pp = p_max_weekly_sessions_pp,
    updated_at = now()
  WHERE id = v_settings_id;
END;
$$;
