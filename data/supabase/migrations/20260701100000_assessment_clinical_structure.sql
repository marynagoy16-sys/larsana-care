-- LarsanaCare: estrutura clínica da avaliação + confirmação de nível
-- Migration: 20260701100000_assessment_clinical_structure

CREATE TYPE public.assessment_level_review_status AS ENUM (
  'nao_aplicavel',
  'pendente',
  'aprovado',
  'rejeitado'
);

ALTER TABLE public.initial_assessments
  ADD COLUMN IF NOT EXISTS functionality text,
  ADD COLUMN IF NOT EXISTS prior_conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS surgeries jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS level_confirmed boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS requested_patient_level public.patient_level,
  ADD COLUMN IF NOT EXISTS level_change_review_status public.assessment_level_review_status NOT NULL DEFAULT 'nao_aplicavel';

UPDATE public.initial_assessments
SET functionality = COALESCE(NULLIF(trim(functionality), ''), NULLIF(trim(mobility), ''), 'Não informado')
WHERE functionality IS NULL;

ALTER TABLE public.initial_assessments
  ALTER COLUMN functionality SET DEFAULT 'Não informado';

UPDATE public.initial_assessments
SET functionality = 'Não informado'
WHERE functionality IS NULL;

ALTER TABLE public.initial_assessments
  ALTER COLUMN functionality SET NOT NULL;

UPDATE public.initial_assessments ia
SET
  level_confirmed = (ia.proposed_patient_level = ia.suggested_patient_level),
  level_change_review_status = CASE
    WHEN ia.proposed_patient_level IS DISTINCT FROM ia.suggested_patient_level THEN 'pendente'::public.assessment_level_review_status
    ELSE 'nao_aplicavel'::public.assessment_level_review_status
  END,
  requested_patient_level = CASE
    WHEN ia.proposed_patient_level IS DISTINCT FROM ia.suggested_patient_level THEN ia.proposed_patient_level
    ELSE NULL
  END,
  proposed_patient_level = ia.suggested_patient_level
WHERE ia.proposed_patient_level IS DISTINCT FROM ia.suggested_patient_level;

CREATE TABLE IF NOT EXISTS public.assessment_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.initial_assessments (id) ON DELETE CASCADE,
  file_name text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  uploaded_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessment_attachments_assessment
  ON public.assessment_attachments (assessment_id);

ALTER TABLE public.assessment_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS assessment_attachments_staff ON public.assessment_attachments;
CREATE POLICY assessment_attachments_staff ON public.assessment_attachments
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS assessment_attachments_pp ON public.assessment_attachments;
CREATE POLICY assessment_attachments_pp ON public.assessment_attachments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.initial_assessments ia
      WHERE ia.id = assessment_id
        AND ia.evaluator_professional_id = public.current_professional_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.initial_assessments ia
      WHERE ia.id = assessment_id
        AND ia.evaluator_professional_id = public.current_professional_id()
    )
  );

CREATE OR REPLACE FUNCTION public.validate_assessment_proposal()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.proposed_patient_level IN ('VALOR_SOCIAL') THEN
    RAISE EXCEPTION 'Nível confirmado deve ser N1, N2 ou N3';
  END IF;

  IF NEW.level_confirmed = false THEN
    IF NEW.patient_level_change_reason IS NULL OR length(trim(NEW.patient_level_change_reason)) < 10 THEN
      RAISE EXCEPTION 'Justificativa obrigatória quando o nível não é confirmado (mínimo 10 caracteres)';
    END IF;
    NEW.proposed_patient_level := NEW.suggested_patient_level;
    NEW.level_change_review_status := COALESCE(NEW.level_change_review_status, 'pendente'::public.assessment_level_review_status);
  ELSE
    NEW.proposed_patient_level := NEW.suggested_patient_level;
    NEW.requested_patient_level := NULL;
    NEW.level_change_review_status := 'nao_aplicavel'::public.assessment_level_review_status;
    NEW.patient_level_change_reason := NULL;
  END IF;

  IF NEW.functionality IS NULL OR length(trim(NEW.functionality)) < 3 THEN
    RAISE EXCEPTION 'Descreva a funcionalidade do paciente (mínimo 3 caracteres)';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_patient_from_assessment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.patients
  SET
    patient_level = NEW.proposed_patient_level,
    suggested_weekly_frequency = NEW.proposed_weekly_frequency,
    diagnostic_hypothesis = NEW.primary_diagnosis,
    updated_at = now()
  WHERE id = NEW.patient_id
    AND (
      NEW.level_confirmed = true
      OR NEW.level_change_review_status = 'aprovado'::public.assessment_level_review_status
    );

  IF NEW.level_confirmed = false AND NEW.level_change_review_status = 'pendente'::public.assessment_level_review_status THEN
    UPDATE public.patients
    SET
      suggested_weekly_frequency = NEW.proposed_weekly_frequency,
      diagnostic_hypothesis = NEW.primary_diagnosis,
      updated_at = now()
    WHERE id = NEW.patient_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_assessment_level_change(
  p_assessment_id uuid,
  p_decision public.assessment_level_review_status,
  p_admin_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assessment public.initial_assessments%ROWTYPE;
BEGIN
  IF NOT public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  IF p_decision NOT IN ('aprovado', 'rejeitado') THEN
    RAISE EXCEPTION 'Decisão inválida';
  END IF;

  SELECT * INTO v_assessment FROM public.initial_assessments WHERE id = p_assessment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Avaliação não encontrada';
  END IF;

  IF v_assessment.level_change_review_status <> 'pendente'::public.assessment_level_review_status THEN
    RAISE EXCEPTION 'Avaliação não está pendente de revisão de nível';
  END IF;

  UPDATE public.initial_assessments
  SET
    level_change_review_status = p_decision,
    proposed_patient_level = CASE
      WHEN p_decision = 'aprovado'::public.assessment_level_review_status
        THEN COALESCE(v_assessment.requested_patient_level, v_assessment.suggested_patient_level)
      ELSE v_assessment.suggested_patient_level
    END,
    updated_at = now()
  WHERE id = p_assessment_id;

  IF p_decision = 'aprovado'::public.assessment_level_review_status THEN
    UPDATE public.patients
    SET
      patient_level = COALESCE(v_assessment.requested_patient_level, v_assessment.suggested_patient_level),
      updated_at = now()
    WHERE id = v_assessment.patient_id;
  END IF;

  INSERT INTO public.assessment_status_history (assessment_id, from_status, to_status, changed_by, notes)
  VALUES (
    p_assessment_id,
    v_assessment.status,
    v_assessment.status,
    auth.uid(),
    COALESCE(p_admin_notes, 'Revisão de nível: ' || p_decision::text)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.review_assessment_level_change(uuid, public.assessment_level_review_status, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_assessment_level_change(uuid, public.assessment_level_review_status, text) TO authenticated;

COMMENT ON COLUMN public.initial_assessments.functionality IS 'Funcionalidade do paciente (ex-f mobilidade)';
COMMENT ON COLUMN public.initial_assessments.prior_conditions IS 'Doenças prévias estruturadas (JSON)';
COMMENT ON COLUMN public.initial_assessments.surgeries IS 'Cirurgias prévias [{name, year}]';
COMMENT ON COLUMN public.initial_assessments.level_confirmed IS 'PP confirmou o nível sugerido pela Larsana';
