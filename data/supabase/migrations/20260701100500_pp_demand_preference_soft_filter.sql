-- LarsanaCare: soft filter de preferências PP em demandas (não bloqueia visibilidade)
-- Migration: 20260701100500_pp_demand_preference_soft_filter

CREATE OR REPLACE FUNCTION public.pp_demand_preference_score(
  p_professional_id uuid,
  p_demand_id uuid
)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefs public.pp_technical_category[];
  v_category public.pp_technical_category;
BEGIN
  SELECT p.patient_preferences INTO v_prefs
  FROM public.professionals p
  WHERE p.id = p_professional_id;

  IF v_prefs IS NULL OR cardinality(v_prefs) = 0 THEN
    RETURN 0;
  END IF;

  v_category := public.resolve_demand_technical_category(p_demand_id);

  IF v_category IS NULL THEN
    RETURN 0;
  END IF;

  IF v_category = ANY (v_prefs) THEN
    RETURN 1;
  END IF;

  RETURN -1;
END;
$$;

COMMENT ON FUNCTION public.pp_demand_preference_score IS
  'Soft filter: 1=match preferência, 0=sem preferências/neutro, -1=fora das preferências (demanda ainda visível)';

REVOKE ALL ON FUNCTION public.pp_demand_preference_score(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pp_demand_preference_score(uuid, uuid) TO authenticated;
