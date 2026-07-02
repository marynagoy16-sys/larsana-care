-- LarsanaCare: gamificação PP — pontos, patentes, indicações e repasse
-- Migration: 20260701100300_pp_points_gamification.sql

CREATE TYPE public.pp_patente AS ENUM (
  'ALUMINIO',
  'BRONZE',
  'PRATA',
  'OURO'
);

CREATE TYPE public.pp_referral_status AS ENUM (
  'pendente',
  'confirmada',
  'expirada'
);

CREATE TABLE IF NOT EXISTS public.pp_points_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bronze_threshold integer NOT NULL DEFAULT 600,
  prata_threshold integer NOT NULL DEFAULT 800,
  ouro_threshold integer NOT NULL DEFAULT 1000,
  show_next_tier_hint boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL
);

INSERT INTO public.pp_points_settings (bronze_threshold, prata_threshold, ouro_threshold)
SELECT 600, 800, 1000
WHERE NOT EXISTS (SELECT 1 FROM public.pp_points_settings LIMIT 1);

CREATE TABLE IF NOT EXISTS public.pp_patente_tiers (
  patente public.pp_patente PRIMARY KEY,
  base_pp_percent numeric(5, 2) NOT NULL CHECK (base_pp_percent >= 0 AND base_pp_percent <= 100),
  label text NOT NULL,
  sort_order integer NOT NULL
);

INSERT INTO public.pp_patente_tiers (patente, base_pp_percent, label, sort_order) VALUES
  ('ALUMINIO', 65, 'Alumínio', 0),
  ('BRONZE', 70, 'Bronze', 1),
  ('PRATA', 75, 'Prata', 2),
  ('OURO', 80, 'Ouro', 3)
ON CONFLICT (patente) DO UPDATE SET
  base_pp_percent = EXCLUDED.base_pp_percent,
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order;

CREATE TABLE IF NOT EXISTS public.pp_points_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_code text NOT NULL UNIQUE,
  label text NOT NULL,
  points_delta integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  max_applications integer,
  only_patente public.pp_patente,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.pp_points_rules (rule_code, label, points_delta, max_applications, only_patente) VALUES
  ('complete_credentialing', 'Finalizar cadastro credenciamento', 300, 1, NULL),
  ('complete_lesson', 'Concluir aula Academy', 25, NULL, NULL),
  ('complete_course', 'Concluir curso Academy', 100, NULL, NULL),
  ('pp_referral', 'Indicar profissional parceiro', 50, 3, 'ALUMINIO'::public.pp_patente),
  ('marketplace_purchase', 'Compra no marketplace', 30, NULL, NULL),
  ('nps_bonus', 'Bônus NPS', 20, NULL, NULL),
  ('nps_penalty', 'Penalidade NPS', -20, NULL, NULL)
ON CONFLICT (rule_code) DO NOTHING;

ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS points_total integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS patente public.pp_patente NOT NULL DEFAULT 'ALUMINIO',
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referral_count_pre_bronze integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points_grandfathered boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_professionals_patente ON public.professionals (patente);
CREATE INDEX IF NOT EXISTS idx_professionals_referral_code ON public.professionals (referral_code);

CREATE TABLE IF NOT EXISTS public.pp_points_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals (id) ON DELETE CASCADE,
  rule_code text NOT NULL REFERENCES public.pp_points_rules (rule_code),
  points_delta integer NOT NULL,
  balance_after integer NOT NULL,
  reference_type text,
  reference_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (professional_id, rule_code, reference_id)
);

CREATE INDEX IF NOT EXISTS idx_pp_points_ledger_pp ON public.pp_points_ledger (professional_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.pp_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_professional_id uuid NOT NULL REFERENCES public.professionals (id) ON DELETE CASCADE,
  referred_professional_id uuid REFERENCES public.professionals (id) ON DELETE SET NULL,
  referral_code text NOT NULL,
  status public.pp_referral_status NOT NULL DEFAULT 'pendente',
  points_awarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referrer_professional_id, referred_professional_id)
);

CREATE INDEX IF NOT EXISTS idx_pp_referrals_referrer ON public.pp_referrals (referrer_professional_id);
CREATE INDEX IF NOT EXISTS idx_pp_referrals_referred ON public.pp_referrals (referred_professional_id);

ALTER TABLE public.pp_points_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pp_points_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pp_patente_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pp_points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pp_referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pp_points_settings_admin ON public.pp_points_settings;
CREATE POLICY pp_points_settings_admin ON public.pp_points_settings FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS pp_points_rules_admin ON public.pp_points_rules;
CREATE POLICY pp_points_rules_admin ON public.pp_points_rules FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS pp_patente_tiers_read ON public.pp_patente_tiers;
CREATE POLICY pp_patente_tiers_read ON public.pp_patente_tiers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS pp_points_ledger_read ON public.pp_points_ledger;
CREATE POLICY pp_points_ledger_read ON public.pp_points_ledger FOR SELECT TO authenticated
  USING (public.is_staff() OR professional_id = public.current_professional_id());

DROP POLICY IF EXISTS pp_referrals_read ON public.pp_referrals;
CREATE POLICY pp_referrals_read ON public.pp_referrals FOR SELECT TO authenticated
  USING (public.is_staff() OR referrer_professional_id = public.current_professional_id()
    OR referred_professional_id = public.current_professional_id());

CREATE OR REPLACE FUNCTION public.generate_pp_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_code text;
BEGIN
  LOOP
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.professionals WHERE referral_code = v_code);
  END LOOP;
  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_professional_referral_code(p_professional_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
BEGIN
  SELECT referral_code INTO v_code FROM public.professionals WHERE id = p_professional_id;
  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;
  v_code := public.generate_pp_referral_code();
  UPDATE public.professionals SET referral_code = v_code, updated_at = now() WHERE id = p_professional_id;
  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_patente_from_points(p_points integer)
RETURNS public.pp_patente
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_settings public.pp_points_settings%ROWTYPE;
BEGIN
  SELECT * INTO v_settings FROM public.pp_points_settings ORDER BY updated_at DESC LIMIT 1;
  IF NOT FOUND THEN
    v_settings.bronze_threshold := 600;
    v_settings.prata_threshold := 800;
    v_settings.ouro_threshold := 1000;
  END IF;

  IF p_points >= v_settings.ouro_threshold THEN
    RETURN 'OURO'::public.pp_patente;
  ELSIF p_points >= v_settings.prata_threshold THEN
    RETURN 'PRATA'::public.pp_patente;
  ELSIF p_points >= v_settings.bronze_threshold THEN
    RETURN 'BRONZE'::public.pp_patente;
  END IF;
  RETURN 'ALUMINIO'::public.pp_patente;
END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_pp_patente(p_professional_id uuid)
RETURNS public.pp_patente
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_points integer;
  v_patente public.pp_patente;
  v_pp_class public.pp_class;
BEGIN
  SELECT points_total INTO v_points FROM public.professionals WHERE id = p_professional_id;
  v_patente := public.resolve_patente_from_points(v_points);

  v_pp_class := CASE v_patente
    WHEN 'OURO' THEN 'OURO'::public.pp_class
    WHEN 'PRATA' THEN 'PRATA'::public.pp_class
    WHEN 'BRONZE' THEN 'BRONZE'::public.pp_class
    ELSE 'BRONZE'::public.pp_class
  END;

  UPDATE public.professionals
  SET patente = v_patente, pp_class = v_pp_class, updated_at = now()
  WHERE id = p_professional_id;

  RETURN v_patente;
END;
$$;

CREATE OR REPLACE FUNCTION public.award_pp_points(
  p_professional_id uuid,
  p_rule_code text,
  p_reference_id uuid DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rule public.pp_points_rules%ROWTYPE;
  v_pro public.professionals%ROWTYPE;
  v_count integer;
  v_new_balance integer;
BEGIN
  SELECT * INTO v_rule FROM public.pp_points_rules WHERE rule_code = p_rule_code AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Regra de pontos não encontrada: %', p_rule_code;
  END IF;

  SELECT * INTO v_pro FROM public.professionals WHERE id = p_professional_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profissional não encontrado';
  END IF;

  IF v_rule.only_patente IS NOT NULL AND v_pro.patente <> v_rule.only_patente THEN
    RETURN v_pro.points_total;
  END IF;

  IF v_rule.max_applications IS NOT NULL THEN
    SELECT count(*)::integer INTO v_count
    FROM public.pp_points_ledger
    WHERE professional_id = p_professional_id AND rule_code = p_rule_code;
    IF v_count >= v_rule.max_applications THEN
      RETURN v_pro.points_total;
    END IF;
  END IF;

  IF p_reference_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.pp_points_ledger
    WHERE professional_id = p_professional_id
      AND rule_code = p_rule_code
      AND reference_id = p_reference_id
  ) THEN
    RETURN v_pro.points_total;
  END IF;

  v_new_balance := GREATEST(0, v_pro.points_total + v_rule.points_delta);

  INSERT INTO public.pp_points_ledger (
    professional_id, rule_code, points_delta, balance_after, reference_type, reference_id, notes
  ) VALUES (
    p_professional_id, p_rule_code, v_rule.points_delta, v_new_balance,
    CASE WHEN p_reference_id IS NOT NULL THEN p_rule_code ELSE NULL END,
    p_reference_id, p_notes
  );

  UPDATE public.professionals SET points_total = v_new_balance, updated_at = now()
  WHERE id = p_professional_id;

  IF p_rule_code = 'pp_referral' THEN
    UPDATE public.professionals
    SET referral_count_pre_bronze = referral_count_pre_bronze + 1, updated_at = now()
    WHERE id = p_professional_id;
  END IF;

  PERFORM public.recalculate_pp_patente(p_professional_id);

  SELECT points_total INTO v_new_balance FROM public.professionals WHERE id = p_professional_id;
  RETURN v_new_balance;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_pp_percent_from_patente(p_patente public.pp_patente)
RETURNS numeric
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT base_pp_percent FROM public.pp_patente_tiers WHERE patente = p_patente;
$$;

CREATE OR REPLACE FUNCTION public.resolve_cycle_split_percentages(p_cycle_id uuid)
RETURNS TABLE (
  pp_percent numeric,
  larsana_percent numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle public.care_cycles%ROWTYPE;
  v_pp public.professionals%ROWTYPE;
  v_pp_pct numeric;
  v_larsana_pct numeric;
  v_retention numeric;
  v_patente_pct numeric;
BEGIN
  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = p_cycle_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cycle not found: %', p_cycle_id;
  END IF;

  IF v_cycle.pp_percentage IS NOT NULL AND v_cycle.larsana_percentage IS NOT NULL THEN
    RETURN QUERY SELECT v_cycle.pp_percentage, v_cycle.larsana_percentage;
    RETURN;
  END IF;

  SELECT * INTO v_pp FROM public.professionals WHERE id = v_cycle.assigned_professional_id;

  IF v_cycle.is_first_month_capture OR v_cycle.cycle_number = 1 THEN
    SELECT fmr.larsana_percent INTO v_retention
    FROM public.first_month_retention_rules fmr
    WHERE fmr.version_id = v_cycle.pricing_version_id;

    IF v_retention IS NULL THEN
      v_retention := CASE WHEN v_pp.person_type = 'PJ' THEN 30 ELSE 40 END;
    END IF;

    IF v_pp.person_type = 'PJ' AND v_retention = 40 THEN
      v_retention := 30;
    END IF;

    v_pp_pct := 100 - v_retention;
    v_larsana_pct := v_retention;
  ELSE
    v_patente_pct := public.resolve_pp_percent_from_patente(COALESCE(v_pp.patente, 'ALUMINIO'::public.pp_patente));
    v_pp_pct := v_patente_pct;

    IF v_pp.person_type = 'PJ' THEN
      v_pp_pct := LEAST(v_pp_pct + 10, 95);
    END IF;

    v_larsana_pct := 100 - v_pp_pct;
  END IF;

  RETURN QUERY SELECT v_pp_pct, v_larsana_pct;
END;
$$;

CREATE OR REPLACE FUNCTION public.register_pp_referral_on_signup(
  p_referred_professional_id uuid,
  p_referral_code text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer public.professionals%ROWTYPE;
  v_ref_id uuid;
BEGIN
  IF p_referral_code IS NULL OR length(trim(p_referral_code)) = 0 THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_referrer
  FROM public.professionals
  WHERE upper(referral_code) = upper(trim(p_referral_code));

  IF NOT FOUND OR v_referrer.id = p_referred_professional_id THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.pp_referrals (referrer_professional_id, referred_professional_id, referral_code, status)
  VALUES (v_referrer.id, p_referred_professional_id, upper(trim(p_referral_code)), 'pendente')
  ON CONFLICT (referrer_professional_id, referred_professional_id) DO NOTHING
  RETURNING id INTO v_ref_id;

  RETURN v_ref_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_pp_referral_points(p_referred_professional_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref public.pp_referrals%ROWTYPE;
BEGIN
  SELECT * INTO v_ref
  FROM public.pp_referrals
  WHERE referred_professional_id = p_referred_professional_id
    AND status = 'pendente'::public.pp_referral_status
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  PERFORM public.award_pp_points(v_ref.referrer_professional_id, 'pp_referral', v_ref.id, 'Indicação confirmada');

  UPDATE public.pp_referrals
  SET status = 'confirmada'::public.pp_referral_status, points_awarded_at = now()
  WHERE id = v_ref.id;
END;
$$;

-- Grandfathering: PPs ativos existentes recebem Bronze
UPDATE public.professionals p
SET
  points_total = GREATEST(p.points_total, (SELECT bronze_threshold FROM public.pp_points_settings LIMIT 1)),
  patente = 'BRONZE'::public.pp_patente,
  pp_class = 'BRONZE'::public.pp_class,
  points_grandfathered = true,
  referral_code = COALESCE(p.referral_code, public.generate_pp_referral_code()),
  updated_at = now()
WHERE p.credentialing_status = 'ativo'
  AND p.points_grandfathered = false;

REVOKE ALL ON FUNCTION public.award_pp_points(uuid, text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_pp_points(uuid, text, uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.register_pp_referral_on_signup(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_pp_referral_on_signup(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.confirm_pp_referral_points(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_pp_referral_points(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.ensure_professional_referral_code(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_professional_referral_code(uuid) TO authenticated;
