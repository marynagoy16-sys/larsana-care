-- Link VSL content to weekly plans via metadata
-- Migration: 20260613100400_larsanapill_weekly_plans_vsl_metadata.sql

DO $$
DECLARE
  v_vsl_id uuid;
BEGIN
  SELECT id INTO v_vsl_id
  FROM public.larsanapill_contents
  WHERE slug = 'g1-alongamento'
  LIMIT 1;

  IF v_vsl_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.larsanapill_weekly_plans
  SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('vsl_content_id', v_vsl_id::text)
  WHERE slug IN ('t1-pos-queda', 't2-idoso-ativo', 't3-pos-avc', 't4-lombalgia', 't5-neurologia');
END $$;
