-- Geolocalização ao vivo do PP + envio condicional de proposta clínica

ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS last_lat numeric(10, 7),
  ADD COLUMN IF NOT EXISTS last_lng numeric(10, 7),
  ADD COLUMN IF NOT EXISTS location_updated_at timestamptz;

CREATE OR REPLACE FUNCTION public.pp_update_live_location(
  p_lat numeric,
  p_lng numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_professional_id uuid;
BEGIN
  IF p_lat IS NULL OR p_lng IS NULL THEN
    RAISE EXCEPTION 'Coordenadas inválidas';
  END IF;

  IF p_lat < -90 OR p_lat > 90 OR p_lng < -180 OR p_lng > 180 THEN
    RAISE EXCEPTION 'Coordenadas fora do intervalo';
  END IF;

  v_professional_id := public.current_professional_id();
  IF v_professional_id IS NULL THEN
    RAISE EXCEPTION 'Profissional não encontrado';
  END IF;

  UPDATE public.professionals
  SET
    last_lat = p_lat,
    last_lng = p_lng,
    location_updated_at = now(),
    updated_at = now()
  WHERE id = v_professional_id;
END;
$$;

REVOKE ALL ON FUNCTION public.pp_update_live_location(numeric, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pp_update_live_location(numeric, numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.pp_finalize_assessment(p_assessment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assessment public.initial_assessments%ROWTYPE;
  v_patient_name text;
  v_sent_at timestamptz := now();
  v_deadline date;
BEGIN
  SELECT * INTO v_assessment
  FROM public.initial_assessments
  WHERE id = p_assessment_id
    AND evaluator_professional_id = public.current_professional_id()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Avaliação não encontrada';
  END IF;

  IF v_assessment.status <> 'avaliacao_feita' THEN
    RAISE EXCEPTION 'Avaliação ainda não registrada';
  END IF;

  IF v_assessment.level_confirmed = false
     AND v_assessment.level_change_review_status = 'pendente'::public.assessment_level_review_status THEN
    UPDATE public.initial_assessments
    SET status = 'em_analise', updated_at = now()
    WHERE id = p_assessment_id;

    RETURN jsonb_build_object(
      'assessment_id', p_assessment_id,
      'status', 'em_analise',
      'requires_admin_review', true
    );
  END IF;

  v_deadline := public.add_business_days_from_date(v_sent_at::date, 5);

  UPDATE public.initial_assessments
  SET
    status = 'proposta_enviada',
    proposal_sent_at = v_sent_at,
    response_deadline_at = v_deadline::timestamptz,
    updated_at = now()
  WHERE id = p_assessment_id;

  SELECT p.full_name INTO v_patient_name
  FROM public.patients p
  WHERE p.id = v_assessment.patient_id;

  INSERT INTO public.notifications (user_id, type, title, body, payload)
  SELECT
    pr.user_id,
    'proposta'::public.notification_type,
    'Proposta de tratamento disponível',
    coalesce(v_patient_name, 'Paciente')
      || ': analise a proposta de tratamento domiciliar. Você tem até 5 dias úteis para responder.',
    jsonb_build_object(
      'assessment_id', p_assessment_id,
      'patient_id', v_assessment.patient_id,
      'response_deadline_at', v_deadline
    )
  FROM public.patient_responsibles pr
  WHERE pr.patient_id = v_assessment.patient_id
    AND pr.user_id IS NOT NULL;

  PERFORM public.notify_professional_user(
    v_assessment.evaluator_professional_id,
    'proposta'::public.notification_type,
    'Proposta enviada à família',
    coalesce(v_patient_name, 'Paciente')
      || ': a proposta foi enviada. Acompanhe a resposta da família (até 5 dias úteis).',
    jsonb_build_object(
      'assessment_id', p_assessment_id,
      'patient_id', v_assessment.patient_id,
      'status', 'proposta_enviada',
      'response_deadline_at', v_deadline
    )
  );

  RETURN jsonb_build_object(
    'assessment_id', p_assessment_id,
    'status', 'proposta_enviada',
    'requires_admin_review', false,
    'proposal_sent_at', v_sent_at,
    'response_deadline_at', v_deadline
  );
END;
$$;

REVOKE ALL ON FUNCTION public.pp_finalize_assessment(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pp_finalize_assessment(uuid) TO authenticated;

COMMENT ON FUNCTION public.pp_finalize_assessment(uuid) IS
  'PP finaliza avaliação: envia proposta direto se nível confirmado; senão em_analise para revisão admin.';
