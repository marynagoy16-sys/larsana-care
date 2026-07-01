-- LarsanaCare: categorias técnicas PP + habilitação Cardiorrespiratória
-- Migration: 20260630150000_pp_technical_categories

CREATE TYPE public.pp_technical_category AS ENUM (
  'ortopedico',
  'pos_operatorio',
  'neurologico',
  'idoso_gerontologia',
  'funcional_condicionamento',
  'pediatrico_geral',
  'cardiorrespiratoria'
);

CREATE TYPE public.cardiorrespiratory_habilitation_status AS ENUM (
  'nao_solicitado',
  'em_analise',
  'habilitado',
  'nao_habilitado',
  'suspenso'
);

CREATE TYPE public.cardiorrespiratory_request_basis AS ENUM (
  'certificado',
  'experiencia',
  'certificado_e_experiencia',
  'analise_larsana'
);

ALTER TYPE public.professional_document_type ADD VALUE IF NOT EXISTS 'CARDIO_CERTIFICATE';
ALTER TYPE public.professional_document_type ADD VALUE IF NOT EXISTS 'CARDIO_EXPERIENCE_PROOF';
ALTER TYPE public.professional_document_type ADD VALUE IF NOT EXISTS 'CARDIO_CV';
ALTER TYPE public.professional_document_type ADD VALUE IF NOT EXISTS 'CARDIO_PROFESSIONAL_DECLARATION';
ALTER TYPE public.professional_document_type ADD VALUE IF NOT EXISTS 'CARDIO_OTHER';

ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS technical_categories public.pp_technical_category[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cardiorrespiratory_habilitation_status public.cardiorrespiratory_habilitation_status NOT NULL DEFAULT 'nao_solicitado',
  ADD COLUMN IF NOT EXISTS cardiorrespiratory_request_basis public.cardiorrespiratory_request_basis,
  ADD COLUMN IF NOT EXISTS cardiorrespiratory_experience_description text;

CREATE INDEX IF NOT EXISTS idx_professionals_technical_categories
  ON public.professionals USING gin (technical_categories);

CREATE INDEX IF NOT EXISTS idx_professionals_cardio_habilitation
  ON public.professionals (cardiorrespiratory_habilitation_status);

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS technical_category public.pp_technical_category;

CREATE INDEX IF NOT EXISTS idx_patients_technical_category
  ON public.patients (technical_category);

ALTER TABLE public.demands
  ADD COLUMN IF NOT EXISTS technical_category public.pp_technical_category;

CREATE INDEX IF NOT EXISTS idx_demands_technical_category
  ON public.demands (technical_category);

CREATE TABLE IF NOT EXISTS public.cardiorrespiratory_habilitation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals (id) ON DELETE CASCADE,
  from_status public.cardiorrespiratory_habilitation_status,
  to_status public.cardiorrespiratory_habilitation_status NOT NULL,
  changed_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cardio_habilitation_log_pp
  ON public.cardiorrespiratory_habilitation_log (professional_id, created_at DESC);

ALTER TABLE public.cardiorrespiratory_habilitation_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cardio_habilitation_log_staff_read ON public.cardiorrespiratory_habilitation_log;
DROP POLICY IF EXISTS cardio_habilitation_log_staff_insert ON public.cardiorrespiratory_habilitation_log;

CREATE POLICY cardio_habilitation_log_staff_read ON public.cardiorrespiratory_habilitation_log
  FOR SELECT TO authenticated
  USING (
    public.is_staff()
    OR professional_id = public.current_professional_id()
  );

CREATE POLICY cardio_habilitation_log_staff_insert ON public.cardiorrespiratory_habilitation_log
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff());

CREATE OR REPLACE FUNCTION public.pp_passes_academy_gate_for_professional(
  p_professional_id uuid,
  p_gate_target public.academy_gate_target
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings public.academy_platform_settings%ROWTYPE;
  v_rule public.academy_gate_rules%ROWTYPE;
  v_enrollment_id uuid;
  v_required_lessons int;
  v_completed_lessons int;
  v_now timestamptz := now();
BEGIN
  IF p_professional_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT * INTO v_settings FROM public.academy_platform_settings LIMIT 1;

  IF v_settings IS NULL OR NOT v_settings.gates_master_enabled THEN
    RETURN true;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.pp_academy_exemptions e
    WHERE e.professional_id = p_professional_id
      AND (e.gate_target IS NULL OR e.gate_target = p_gate_target)
      AND (e.expires_at IS NULL OR e.expires_at > v_now)
  ) THEN
    RETURN true;
  END IF;

  SELECT * INTO v_rule
  FROM public.academy_gate_rules r
  WHERE r.gate_target = p_gate_target;

  IF v_rule IS NULL OR NOT v_rule.is_enabled THEN
    RETURN true;
  END IF;

  IF v_rule.effective_from IS NOT NULL AND v_now < v_rule.effective_from THEN
    RETURN true;
  END IF;

  IF v_rule.effective_until IS NOT NULL AND v_now > v_rule.effective_until THEN
    RETURN true;
  END IF;

  IF v_rule.requirement_type = 'none' OR v_rule.course_id IS NULL THEN
    RETURN true;
  END IF;

  SELECT e.id INTO v_enrollment_id
  FROM public.academy_enrollments e
  WHERE e.professional_id = p_professional_id
    AND e.course_id = v_rule.course_id;

  IF v_enrollment_id IS NULL THEN
    RETURN false;
  END IF;

  IF v_rule.requirement_type = 'full_course' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.academy_enrollments e
      WHERE e.id = v_enrollment_id AND e.status = 'completed'
    );
  END IF;

  IF v_rule.requirement_type = 'modules' AND cardinality(v_rule.required_module_ids) > 0 THEN
    SELECT count(*) INTO v_required_lessons
    FROM public.academy_lessons l
    JOIN public.academy_modules m ON m.id = l.module_id
    WHERE m.id = ANY (v_rule.required_module_ids)
      AND l.is_published = true;

    SELECT count(*) INTO v_completed_lessons
    FROM public.academy_lesson_progress lp
    JOIN public.academy_lessons l ON l.id = lp.lesson_id
    JOIN public.academy_modules m ON m.id = l.module_id
    WHERE lp.enrollment_id = v_enrollment_id
      AND lp.completed_at IS NOT NULL
      AND m.id = ANY (v_rule.required_module_ids);

    RETURN v_required_lessons > 0 AND v_completed_lessons >= v_required_lessons;
  END IF;

  IF v_rule.requirement_type = 'lessons' AND cardinality(v_rule.required_lesson_ids) > 0 THEN
    SELECT cardinality(v_rule.required_lesson_ids) INTO v_required_lessons;

    SELECT count(*) INTO v_completed_lessons
    FROM public.academy_lesson_progress lp
    WHERE lp.enrollment_id = v_enrollment_id
      AND lp.lesson_id = ANY (v_rule.required_lesson_ids)
      AND lp.completed_at IS NOT NULL;

    RETURN v_required_lessons > 0 AND v_completed_lessons >= v_required_lessons;
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.pp_passes_academy_gate(p_gate_target public.academy_gate_target)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.current_user_role() IS DISTINCT FROM 'pp' THEN
    RETURN true;
  END IF;

  RETURN public.pp_passes_academy_gate_for_professional(
    public.current_professional_id(),
    p_gate_target
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.pp_is_operational_regular(p_professional_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prof public.professionals%ROWTYPE;
  v_doc_count integer;
BEGIN
  IF p_professional_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT * INTO v_prof
  FROM public.professionals
  WHERE id = p_professional_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_prof.credentialing_status <> 'ativo' OR NOT v_prof.is_active THEN
    RETURN false;
  END IF;

  IF v_prof.cardiorrespiratory_habilitation_status = 'suspenso' THEN
    RETURN false;
  END IF;

  IF NOT v_prof.flag_assinado THEN
    RETURN false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.professional_councils pc
    WHERE pc.professional_id = p_professional_id
      AND pc.registration_number IS NOT NULL
      AND trim(pc.registration_number) <> ''
  ) THEN
    RETURN false;
  END IF;

  SELECT count(*)::integer INTO v_doc_count
  FROM public.professional_documents pd
  WHERE pd.professional_id = p_professional_id
    AND pd.document_type IN ('RG_CNH', 'COUNCIL_CARD', 'CRIMINAL_BACKGROUND');

  IF v_doc_count < 3 THEN
    RETURN false;
  END IF;

  RETURN public.pp_passes_academy_gate_for_professional(p_professional_id, 'demands'::public.academy_gate_target);
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_demand_technical_category(p_demand_id uuid)
RETURNS public.pp_technical_category
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(d.technical_category, p.technical_category)
  FROM public.demands d
  JOIN public.patients p ON p.id = d.patient_id
  WHERE d.id = p_demand_id;
$$;

CREATE OR REPLACE FUNCTION public.pp_can_see_demand(p_professional_id uuid, p_demand_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category public.pp_technical_category;
  v_status public.cardiorrespiratory_habilitation_status;
BEGIN
  IF NOT public.pp_is_operational_regular(p_professional_id) THEN
    RETURN false;
  END IF;

  v_category := public.resolve_demand_technical_category(p_demand_id);

  IF v_category IS NULL OR v_category <> 'cardiorrespiratoria' THEN
    RETURN true;
  END IF;

  SELECT p.cardiorrespiratory_habilitation_status INTO v_status
  FROM public.professionals p
  WHERE p.id = p_professional_id;

  RETURN v_status = 'habilitado';
END;
$$;

CREATE OR REPLACE FUNCTION public.set_demand_technical_category_from_patient()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.technical_category IS NULL THEN
    SELECT p.technical_category INTO NEW.technical_category
    FROM public.patients p
    WHERE p.id = NEW.patient_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_demand_technical_category ON public.demands;

CREATE TRIGGER trg_set_demand_technical_category
  BEFORE INSERT ON public.demands
  FOR EACH ROW
  EXECUTE FUNCTION public.set_demand_technical_category_from_patient();
