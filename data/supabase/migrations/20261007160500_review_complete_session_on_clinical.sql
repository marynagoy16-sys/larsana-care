-- A sessão vira realizada quando a evolução (ou a avaliação) é salva, desde que haja check-in.
-- O gatilho existente notify_patient_nps_after_session dispara o NPS nessa transição.

CREATE OR REPLACE FUNCTION public.complete_checked_in_session(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.care_sessions
  SET status = 'realizada'::public.session_status, updated_at = now()
  WHERE id = p_session_id
    AND check_in_at IS NOT NULL
    AND status IS DISTINCT FROM 'realizada'::public.session_status;

  IF FOUND THEN
    PERFORM public.ensure_sub_pp_repasse(p_session_id);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_complete_session_on_evolution()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.session_id IS NOT NULL AND NEW.record_type = 'evolucao' THEN
    PERFORM public.complete_checked_in_session(NEW.session_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS medical_records_complete_session ON public.medical_records;
CREATE TRIGGER medical_records_complete_session
  AFTER INSERT ON public.medical_records
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_complete_session_on_evolution();

CREATE OR REPLACE FUNCTION public.trg_complete_assessment_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id uuid;
BEGIN
  IF NEW.status IS DISTINCT FROM 'avaliacao_feita'::public.assessment_status THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT cs.id INTO v_session_id
  FROM public.care_sessions cs
  JOIN public.care_cycles cc ON cc.id = cs.cycle_id
  WHERE cc.patient_id = NEW.patient_id
    AND cs.is_assessment_session = true
    AND cs.check_in_at IS NOT NULL
    AND cs.status IS DISTINCT FROM 'realizada'::public.session_status
  ORDER BY cs.check_in_at DESC
  LIMIT 1;

  IF v_session_id IS NOT NULL THEN
    PERFORM public.complete_checked_in_session(v_session_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS initial_assessments_complete_session ON public.initial_assessments;
CREATE TRIGGER initial_assessments_complete_session
  AFTER INSERT OR UPDATE OF status ON public.initial_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_complete_assessment_session();

CREATE OR REPLACE FUNCTION public.pp_session_check_in(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pp uuid := public.current_professional_id();
  v_session public.care_sessions%ROWTYPE;
BEGIN
  IF v_pp IS NULL THEN RAISE EXCEPTION 'Profissional não identificado'; END IF;

  UPDATE public.care_sessions
  SET check_in_at = now(), updated_at = now()
  WHERE id = p_session_id AND professional_id = v_pp AND check_in_at IS NULL
  RETURNING * INTO v_session;

  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão não encontrada ou check-in já realizado'; END IF;

  IF v_session.is_assessment_session AND EXISTS (
    SELECT 1
    FROM public.initial_assessments ia
    JOIN public.care_cycles cc ON cc.id = v_session.cycle_id
    WHERE ia.patient_id = cc.patient_id
      AND ia.status = 'avaliacao_feita'::public.assessment_status
  ) THEN
    PERFORM public.complete_checked_in_session(p_session_id);
  END IF;

  RETURN jsonb_build_object('session_id', p_session_id, 'check_in_at', v_session.check_in_at);
END;
$$;
