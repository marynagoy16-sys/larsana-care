-- Patente: saldo permanente e variável, tempo na patente e pontos por curso.

ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS points_permanent integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points_variable integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS patente_earned_at timestamptz;

UPDATE public.professionals
SET
  points_permanent = points_total,
  points_variable = 0,
  patente_earned_at = coalesce(patente_earned_at, created_at, now())
WHERE patente_earned_at IS NULL;

ALTER TABLE public.pp_points_settings
  ADD COLUMN IF NOT EXISTS bronze_months integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS prata_months integer NOT NULL DEFAULT 9,
  ADD COLUMN IF NOT EXISTS ouro_months integer NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS nps_9_10 integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS nps_7_8 integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS nps_5_6 integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nps_3_4 integer NOT NULL DEFAULT -1,
  ADD COLUMN IF NOT EXISTS nps_0_2 integer NOT NULL DEFAULT -2;

UPDATE public.pp_points_settings
SET bronze_threshold = 1000, prata_threshold = 4000, ouro_threshold = 8000, updated_at = now();

UPDATE public.pp_points_rules
SET points_delta = 100, max_applications = 3, only_patente = 'ALUMINIO'::public.pp_patente, updated_at = now()
WHERE rule_code = 'pp_referral';

UPDATE public.pp_points_rules
SET is_active = false, points_delta = 0, updated_at = now()
WHERE rule_code IN ('complete_course', 'complete_lesson');

ALTER TABLE public.academy_courses
  ADD COLUMN IF NOT EXISTS points_award integer NOT NULL DEFAULT 200;

ALTER TABLE public.pp_points_ledger
  ADD COLUMN IF NOT EXISTS balance_kind text NOT NULL DEFAULT 'permanent';

CREATE OR REPLACE FUNCTION public.nps_score_points(p_score integer)
RETURNS integer
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v public.pp_points_settings%ROWTYPE;
BEGIN
  SELECT * INTO v FROM public.pp_points_settings ORDER BY updated_at DESC LIMIT 1;
  IF p_score >= 9 THEN RETURN coalesce(v.nps_9_10, 2);
  ELSIF p_score >= 7 THEN RETURN coalesce(v.nps_7_8, 1);
  ELSIF p_score >= 5 THEN RETURN coalesce(v.nps_5_6, 0);
  ELSIF p_score >= 3 THEN RETURN coalesce(v.nps_3_4, -1);
  ELSE RETURN coalesce(v.nps_0_2, -2);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_pp_patente(p_professional_id uuid)
RETURNS public.pp_patente
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pro public.professionals%ROWTYPE;
  v_settings public.pp_points_settings%ROWTYPE;
  v_total integer;
  v_next public.pp_patente;
  v_threshold integer;
  v_months integer;
  v_pp_class public.pp_class;
BEGIN
  SELECT * INTO v_pro FROM public.professionals WHERE id = p_professional_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profissional não encontrado';
  END IF;

  SELECT * INTO v_settings FROM public.pp_points_settings ORDER BY updated_at DESC LIMIT 1;
  v_total := coalesce(v_pro.points_permanent, 0) + coalesce(v_pro.points_variable, 0);

  UPDATE public.professionals
  SET points_total = v_total, updated_at = now()
  WHERE id = p_professional_id;

  v_next := CASE v_pro.patente
    WHEN 'ALUMINIO' THEN 'BRONZE'::public.pp_patente
    WHEN 'BRONZE' THEN 'PRATA'::public.pp_patente
    WHEN 'PRATA' THEN 'OURO'::public.pp_patente
    ELSE NULL
  END;

  IF v_next IS NULL THEN
    RETURN v_pro.patente;
  END IF;

  v_threshold := CASE v_next
    WHEN 'BRONZE' THEN v_settings.bronze_threshold
    WHEN 'PRATA' THEN v_settings.prata_threshold
    ELSE v_settings.ouro_threshold
  END;
  v_months := CASE v_next
    WHEN 'BRONZE' THEN v_settings.bronze_months
    WHEN 'PRATA' THEN v_settings.prata_months
    ELSE v_settings.ouro_months
  END;

  IF v_total < v_threshold THEN
    RETURN v_pro.patente;
  END IF;

  IF coalesce(v_pro.patente_earned_at, v_pro.created_at, now()) + make_interval(months => v_months) > now() THEN
    RETURN v_pro.patente;
  END IF;

  v_pp_class := CASE v_next
    WHEN 'OURO' THEN 'OURO'::public.pp_class
    WHEN 'PRATA' THEN 'PRATA'::public.pp_class
    ELSE 'BRONZE'::public.pp_class
  END;

  UPDATE public.professionals
  SET patente = v_next, pp_class = v_pp_class, patente_earned_at = now(), updated_at = now()
  WHERE id = p_professional_id;

  RETURN v_next;
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
  v_kind text;
  v_balance integer;
BEGIN
  SELECT * INTO v_rule FROM public.pp_points_rules WHERE rule_code = p_rule_code AND is_active = true;
  IF NOT FOUND OR v_rule.points_delta = 0 THEN
    SELECT points_total INTO v_balance FROM public.professionals WHERE id = p_professional_id;
    RETURN coalesce(v_balance, 0);
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

  v_kind := CASE WHEN p_rule_code LIKE 'nps%' THEN 'variable' ELSE 'permanent' END;

  IF v_kind = 'variable' THEN
    UPDATE public.professionals
    SET points_variable = points_variable + v_rule.points_delta, updated_at = now()
    WHERE id = p_professional_id;
  ELSE
    UPDATE public.professionals
    SET points_permanent = points_permanent + v_rule.points_delta, updated_at = now()
    WHERE id = p_professional_id;
  END IF;

  SELECT points_permanent + points_variable INTO v_balance
  FROM public.professionals WHERE id = p_professional_id;

  INSERT INTO public.pp_points_ledger (
    professional_id, rule_code, points_delta, balance_after, reference_type, reference_id, notes, balance_kind
  ) VALUES (
    p_professional_id, p_rule_code, v_rule.points_delta, v_balance,
    CASE WHEN p_reference_id IS NOT NULL THEN p_rule_code ELSE NULL END,
    p_reference_id, p_notes, v_kind
  );

  IF p_rule_code = 'pp_referral' THEN
    UPDATE public.professionals
    SET referral_count_pre_bronze = referral_count_pre_bronze + 1, updated_at = now()
    WHERE id = p_professional_id;
  END IF;

  PERFORM public.recalculate_pp_patente(p_professional_id);
  SELECT points_total INTO v_balance FROM public.professionals WHERE id = p_professional_id;
  RETURN v_balance;
END;
$$;

CREATE OR REPLACE FUNCTION public.credit_lesson_course_points(
  p_professional_id uuid,
  p_lesson_id uuid,
  p_progress_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course_id uuid;
  v_points integer;
  v_count integer;
  v_index integer;
  v_delta integer;
  v_balance integer;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.pp_points_ledger
    WHERE professional_id = p_professional_id
      AND rule_code = 'complete_lesson'
      AND reference_id = p_progress_id
  ) THEN
    RETURN;
  END IF;

  SELECT m.course_id, coalesce(c.points_award, 200)
  INTO v_course_id, v_points
  FROM public.academy_lessons l
  JOIN public.academy_modules m ON m.id = l.module_id
  JOIN public.academy_courses c ON c.id = m.course_id
  WHERE l.id = p_lesson_id;

  IF v_course_id IS NULL OR v_points <= 0 THEN
    RETURN;
  END IF;

  SELECT count(*)::integer INTO v_count
  FROM public.academy_lessons l
  JOIN public.academy_modules m ON m.id = l.module_id
  WHERE m.course_id = v_course_id;

  IF v_count <= 0 THEN
    RETURN;
  END IF;

  SELECT ordinality - 1 INTO v_index
  FROM (
    SELECT l.id, row_number() OVER (ORDER BY m.sort_order, l.sort_order, l.id) AS ordinality
    FROM public.academy_lessons l
    JOIN public.academy_modules m ON m.id = l.module_id
    WHERE m.course_id = v_course_id
  ) ordered
  WHERE id = p_lesson_id;

  v_delta := (v_points / v_count) + CASE WHEN coalesce(v_index, 0) < (v_points % v_count) THEN 1 ELSE 0 END;
  IF v_delta = 0 THEN
    RETURN;
  END IF;

  UPDATE public.professionals
  SET points_permanent = points_permanent + v_delta, updated_at = now()
  WHERE id = p_professional_id
  RETURNING points_permanent + points_variable INTO v_balance;

  INSERT INTO public.pp_points_ledger (
    professional_id, rule_code, points_delta, balance_after, reference_type, reference_id, notes, balance_kind
  ) VALUES (
    p_professional_id, 'complete_lesson', v_delta, v_balance, 'complete_lesson', p_progress_id,
    'Fração do curso', 'permanent'
  );

  PERFORM public.recalculate_pp_patente(p_professional_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_award_points_on_enrollment_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_award_points_on_lesson_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_professional_id uuid;
BEGIN
  IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
    SELECT e.professional_id INTO v_professional_id
    FROM public.academy_enrollments e
    WHERE e.id = NEW.enrollment_id;

    IF v_professional_id IS NOT NULL THEN
      PERFORM public.credit_lesson_course_points(v_professional_id, NEW.lesson_id, NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_apply_nps_variable_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_delta integer;
  v_balance integer;
BEGIN
  IF NEW.rated_entity_type IS DISTINCT FROM 'professional'::public.nps_rated_entity_type
     OR NEW.rated_entity_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_delta := public.nps_score_points(NEW.score);
  IF v_delta = 0 THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.pp_points_ledger
    WHERE rule_code = 'nps_variable' AND reference_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  UPDATE public.professionals
  SET points_variable = points_variable + v_delta, updated_at = now()
  WHERE id = NEW.rated_entity_id
  RETURNING points_permanent + points_variable INTO v_balance;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.pp_points_ledger (
    professional_id, rule_code, points_delta, balance_after, reference_type, reference_id, notes, balance_kind
  ) VALUES (
    NEW.rated_entity_id, 'nps_variable', v_delta, v_balance, 'nps_variable', NEW.id,
    'Avaliação do paciente', 'variable'
  );

  PERFORM public.recalculate_pp_patente(NEW.rated_entity_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS nps_surveys_variable_points ON public.nps_surveys;
CREATE TRIGGER nps_surveys_variable_points
  AFTER INSERT ON public.nps_surveys
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_apply_nps_variable_points();
