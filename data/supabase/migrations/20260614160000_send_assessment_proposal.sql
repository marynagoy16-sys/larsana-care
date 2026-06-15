-- Disparo da proposta de tratamento à família (gestão)

CREATE OR REPLACE FUNCTION public.add_business_days_from_date(p_start date, p_days integer)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_current date := p_start;
  v_added integer := 0;
BEGIN
  IF p_days <= 0 THEN
    RETURN p_start;
  END IF;

  WHILE v_added < p_days LOOP
    v_current := v_current + 1;
    IF EXTRACT(DOW FROM v_current) NOT IN (0, 6) THEN
      v_added := v_added + 1;
    END IF;
  END LOOP;

  RETURN v_current;
END;
$$;

CREATE OR REPLACE FUNCTION public.send_assessment_proposal(p_assessment_id uuid)
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
  IF NOT public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]) THEN
    RAISE EXCEPTION 'Sem permissão para enviar proposta';
  END IF;

  SELECT * INTO v_assessment
  FROM public.initial_assessments
  WHERE id = p_assessment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Avaliação não encontrada';
  END IF;

  IF v_assessment.status <> 'avaliacao_feita' THEN
    RAISE EXCEPTION 'Proposta só pode ser enviada quando o status é avaliacao_feita';
  END IF;

  IF v_assessment.primary_diagnosis IS NULL OR btrim(v_assessment.primary_diagnosis) = '' THEN
    RAISE EXCEPTION 'Avaliação sem proposta clínica estruturada';
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

  RETURN jsonb_build_object(
    'assessment_id', p_assessment_id,
    'status', 'proposta_enviada',
    'proposal_sent_at', v_sent_at,
    'response_deadline_at', v_deadline
  );
END;
$$;

REVOKE ALL ON FUNCTION public.send_assessment_proposal(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_assessment_proposal(uuid) TO authenticated;

COMMENT ON FUNCTION public.send_assessment_proposal(uuid) IS
  'Gestão envia proposta à família: status proposta_enviada, prazo 5 dias úteis, notifica responsáveis.';
