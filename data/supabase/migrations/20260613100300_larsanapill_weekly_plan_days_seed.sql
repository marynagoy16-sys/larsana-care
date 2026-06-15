-- Seed larsanapill_weekly_plan_days for T1–T5 (demo/staging)
-- Migration: 20260613100300_larsanapill_weekly_plan_days_seed.sql

DO $$
DECLARE
  v_content_id uuid;
  v_plan_id uuid;
  v_plan_slug text;
  v_plan_slugs text[] := ARRAY['t1-pos-queda', 't2-idoso-ativo', 't3-pos-avc', 't4-lombalgia', 't5-neurologia'];
  v_day int;
BEGIN
  SELECT id INTO v_content_id
  FROM public.larsanapill_contents
  WHERE slug = 'g1-alongamento'
  LIMIT 1;

  FOREACH v_plan_slug IN ARRAY v_plan_slugs LOOP
    SELECT id INTO v_plan_id FROM public.larsanapill_weekly_plans WHERE slug = v_plan_slug LIMIT 1;
    IF v_plan_id IS NULL THEN
      CONTINUE;
    END IF;

    FOR v_day IN 1..3 LOOP
      INSERT INTO public.larsanapill_weekly_plan_days (plan_id, day_index, title, content_id, instructions, sort_order)
      VALUES (
        v_plan_id,
        v_day,
        'Sessão ' || v_day,
        CASE WHEN v_day = 1 THEN v_content_id ELSE NULL END,
        CASE
          WHEN v_day = 1 AND v_content_id IS NOT NULL THEN NULL
          ELSE 'Realize os exercícios orientados pelo seu fisioterapeuta neste dia. Mantenha a respiração controlada.'
        END,
        v_day
      )
      ON CONFLICT (plan_id, day_index) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
