-- LarsanaCare: campos estruturados da proposta na avaliação inicial
-- Migration: 20260614140000_assessment_proposal_fields

ALTER TABLE public.initial_assessments
  ADD COLUMN IF NOT EXISTS suggested_weekly_frequency integer,
  ADD COLUMN IF NOT EXISTS proposed_weekly_frequency integer,
  ADD COLUMN IF NOT EXISTS proposed_session_count integer,
  ADD COLUMN IF NOT EXISTS suggested_patient_level public.patient_level,
  ADD COLUMN IF NOT EXISTS proposed_patient_level public.patient_level,
  ADD COLUMN IF NOT EXISTS patient_level_change_reason text,
  ADD COLUMN IF NOT EXISTS primary_diagnosis text,
  ADD COLUMN IF NOT EXISTS comorbidities text,
  ADD COLUMN IF NOT EXISTS mobility text;

ALTER TABLE public.initial_assessments
  DROP CONSTRAINT IF EXISTS initial_assessments_suggested_weekly_frequency_check,
  DROP CONSTRAINT IF EXISTS initial_assessments_proposed_weekly_frequency_check,
  DROP CONSTRAINT IF EXISTS initial_assessments_proposed_session_count_check,
  DROP CONSTRAINT IF EXISTS initial_assessments_level_change_reason_check;

ALTER TABLE public.initial_assessments
  ADD CONSTRAINT initial_assessments_suggested_weekly_frequency_check
    CHECK (suggested_weekly_frequency IS NULL OR suggested_weekly_frequency IN (1, 2, 3)),
  ADD CONSTRAINT initial_assessments_proposed_weekly_frequency_check
    CHECK (proposed_weekly_frequency IN (1, 2, 3)),
  ADD CONSTRAINT initial_assessments_proposed_session_count_check
    CHECK (proposed_session_count IN (4, 8, 12)),
  ADD CONSTRAINT initial_assessments_level_change_reason_check
    CHECK (
      proposed_patient_level IS NULL
      OR suggested_patient_level IS NULL
      OR proposed_patient_level = suggested_patient_level
      OR (
        patient_level_change_reason IS NOT NULL
        AND length(trim(patient_level_change_reason)) >= 10
      )
    );

-- Backfill registros existentes (se houver)
UPDATE public.initial_assessments ia
SET
  suggested_weekly_frequency = COALESCE(
    ia.suggested_weekly_frequency,
    LEAST(3, GREATEST(1, ROUND(p.suggested_weekly_frequency)::integer)),
    2
  ),
  proposed_weekly_frequency = COALESCE(
    ia.proposed_weekly_frequency,
    LEAST(3, GREATEST(1, ROUND(p.suggested_weekly_frequency)::integer)),
    2
  ),
  proposed_session_count = COALESCE(ia.proposed_session_count, 8),
  suggested_patient_level = COALESCE(
    ia.suggested_patient_level,
    CASE WHEN p.patient_level = 'VALOR_SOCIAL' THEN 'N1'::public.patient_level ELSE p.patient_level END
  ),
  proposed_patient_level = COALESCE(
    ia.proposed_patient_level,
    CASE WHEN p.patient_level = 'VALOR_SOCIAL' THEN 'N1'::public.patient_level ELSE p.patient_level END
  ),
  primary_diagnosis = COALESCE(
    ia.primary_diagnosis,
    NULLIF(trim(p.diagnostic_hypothesis), ''),
    NULLIF(trim(ia.clinical_content), ''),
    'Não informado'
  ),
  mobility = COALESCE(NULLIF(trim(ia.mobility), ''), 'Não informado')
FROM public.patients p
WHERE p.id = ia.patient_id
  AND (
    ia.proposed_weekly_frequency IS NULL
    OR ia.proposed_session_count IS NULL
    OR ia.suggested_patient_level IS NULL
    OR ia.proposed_patient_level IS NULL
    OR ia.primary_diagnosis IS NULL
    OR ia.mobility IS NULL
  );

ALTER TABLE public.initial_assessments
  ALTER COLUMN proposed_weekly_frequency SET NOT NULL,
  ALTER COLUMN proposed_session_count SET NOT NULL,
  ALTER COLUMN suggested_patient_level SET NOT NULL,
  ALTER COLUMN proposed_patient_level SET NOT NULL,
  ALTER COLUMN primary_diagnosis SET NOT NULL,
  ALTER COLUMN mobility SET NOT NULL;

CREATE OR REPLACE FUNCTION public.validate_assessment_proposal()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.proposed_patient_level IN ('VALOR_SOCIAL') THEN
    RAISE EXCEPTION 'Nível proposto deve ser N1, N2 ou N3';
  END IF;

  IF NEW.suggested_patient_level IS NOT NULL
    AND NEW.proposed_patient_level IS DISTINCT FROM NEW.suggested_patient_level
    AND (
      NEW.patient_level_change_reason IS NULL
      OR length(trim(NEW.patient_level_change_reason)) < 10
    )
  THEN
    RAISE EXCEPTION 'Justificativa obrigatória ao alterar o nível do paciente (mínimo 10 caracteres)';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_assessment_proposal ON public.initial_assessments;

CREATE TRIGGER trg_validate_assessment_proposal
  BEFORE INSERT OR UPDATE ON public.initial_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_assessment_proposal();

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
  WHERE id = NEW.patient_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_patient_from_assessment ON public.initial_assessments;

CREATE TRIGGER trg_sync_patient_from_assessment
  AFTER INSERT ON public.initial_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_patient_from_assessment();

COMMENT ON COLUMN public.initial_assessments.suggested_weekly_frequency IS 'Frequência sugerida no cadastro no momento da avaliação (1-3x/semana)';
COMMENT ON COLUMN public.initial_assessments.proposed_weekly_frequency IS 'Frequência semanal proposta pelo PP (1-3x/semana)';
COMMENT ON COLUMN public.initial_assessments.proposed_session_count IS 'Ciclo proposto: 4, 8 ou 12 sessões';
COMMENT ON COLUMN public.initial_assessments.suggested_patient_level IS 'Nível sugerido pelo sistema (cadastro) no momento da avaliação';
COMMENT ON COLUMN public.initial_assessments.proposed_patient_level IS 'Nível confirmado ou alterado pelo PP';
COMMENT ON COLUMN public.initial_assessments.patient_level_change_reason IS 'Obrigatório quando proposed_patient_level difere de suggested_patient_level';
