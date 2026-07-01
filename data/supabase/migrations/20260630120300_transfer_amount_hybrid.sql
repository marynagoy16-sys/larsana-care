-- Atualiza calculate_transfer_amount para usar resolve_cycle_split_percentages
-- Migration: 20260630120300_transfer_amount_hybrid.sql

CREATE OR REPLACE FUNCTION public.calculate_transfer_amount(p_cycle_id uuid)
RETURNS TABLE (
  pp_transfer_amount_cents integer,
  larsana_margin_cents integer,
  commission_percent numeric,
  first_month_retention_applied boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle public.care_cycles%ROWTYPE;
  v_pp_pct numeric;
  v_larsana_pct numeric;
  v_total integer;
  v_pp_amount integer;
BEGIN
  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = p_cycle_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cycle not found: %', p_cycle_id;
  END IF;

  SELECT r.pp_percent, r.larsana_percent
  INTO v_pp_pct, v_larsana_pct
  FROM public.resolve_cycle_split_percentages(p_cycle_id) r;

  v_total := v_cycle.total_amount_cents;
  v_pp_amount := round(v_total * v_pp_pct / 100)::integer;

  RETURN QUERY SELECT
    v_pp_amount,
    v_total - v_pp_amount,
    v_pp_pct,
    v_cycle.is_first_month_capture OR v_cycle.cycle_number = 1;
END;
$$;
