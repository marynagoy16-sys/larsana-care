-- LarsanaCare: notificações ao PP nas transições da proposta de avaliação
-- Migration: 20260814130000_pp_assessment_workflow_notifications

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
    'proposal_sent_at', v_sent_at,
    'response_deadline_at', v_deadline
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.on_payment_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle public.care_cycles%ROWTYPE;
  v_patient_name text;
BEGIN
  IF NEW.payment_status = 'pago' AND OLD.payment_status IS DISTINCT FROM 'pago' THEN
    IF NEW.cycle_id IS NOT NULL THEN
      UPDATE public.care_cycles
      SET payment_status = 'pago',
          status = CASE WHEN status = 'aguardando_pagamento' THEN 'ativo' ELSE status END,
          started_at = COALESCE(started_at, now())
      WHERE id = NEW.cycle_id;

      PERFORM public.freeze_cycle_split_percentages(NEW.cycle_id);

      SELECT * INTO v_cycle FROM public.care_cycles WHERE id = NEW.cycle_id;
      SELECT p.full_name INTO v_patient_name
      FROM public.patients p
      WHERE p.id = v_cycle.patient_id;

      IF v_cycle.assigned_professional_id IS NOT NULL THEN
        PERFORM public.notify_professional_user(
          v_cycle.assigned_professional_id,
          'avaliacao_resposta'::public.notification_type,
          'Tratamento iniciado',
          coalesce(v_patient_name, 'Paciente')
            || ': pagamento confirmado. O ciclo de tratamento está ativo.',
          jsonb_build_object(
            'patient_id', v_cycle.patient_id,
            'cycle_id', v_cycle.id,
            'status', 'ativo'
          )
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_assessment_proposal(
  p_assessment_id uuid,
  p_response public.family_response,
  p_chosen_weekly_frequency integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assessment public.initial_assessments%ROWTYPE;
  v_patient public.patients%ROWTYPE;
  v_pricing_version_id uuid;
  v_unit_price integer;
  v_total integer;
  v_cycle_id uuid;
  v_charge_id uuid;
  v_cycle_number integer;
  v_now timestamptz := now();
  v_due_date date;
  v_pp_pct numeric;
  v_larsana_pct numeric;
  v_pp public.professionals%ROWTYPE;
  v_retention numeric;
BEGIN
  SELECT * INTO v_assessment
  FROM public.initial_assessments
  WHERE id = p_assessment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Avaliação não encontrada';
  END IF;

  IF NOT (v_assessment.patient_id = ANY (public.current_patient_ids())) THEN
    RAISE EXCEPTION 'Sem permissão para responder esta proposta';
  END IF;

  IF v_assessment.family_response IS NOT NULL THEN
    RAISE EXCEPTION 'Esta proposta já foi respondida';
  END IF;

  IF v_assessment.status NOT IN ('proposta_enviada', 'em_analise') THEN
    RAISE EXCEPTION 'Proposta não está aguardando resposta';
  END IF;

  IF v_assessment.response_deadline_at IS NOT NULL AND v_now > v_assessment.response_deadline_at THEN
    RAISE EXCEPTION 'Prazo para resposta encerrado';
  END IF;

  SELECT * INTO v_patient
  FROM public.patients
  WHERE id = v_assessment.patient_id;

  IF p_response = 'SIM' THEN
    IF p_chosen_weekly_frequency IS NULL OR p_chosen_weekly_frequency NOT IN (1, 2, 3) THEN
      RAISE EXCEPTION 'Informe a frequência semanal desejada (1, 2 ou 3)';
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.care_cycles cc
      WHERE cc.patient_id = v_assessment.patient_id
    ) THEN
      RAISE EXCEPTION 'Paciente já possui ciclo de tratamento';
    END IF;

    SELECT id INTO v_pricing_version_id
    FROM public.pricing_matrix_versions
    WHERE is_active = true
    LIMIT 1;

    IF v_pricing_version_id IS NULL THEN
      RAISE EXCEPTION 'Matriz de preços vigente não encontrada';
    END IF;

    SELECT e.session_price_cents INTO v_unit_price
    FROM public.pricing_matrix_entries e
    WHERE e.version_id = v_pricing_version_id
      AND e.region_id = v_patient.region_id
      AND e.patient_level = v_assessment.proposed_patient_level
    LIMIT 1;

    IF v_unit_price IS NULL THEN
      RAISE EXCEPTION 'Preço não configurado para região e nível do paciente';
    END IF;

    SELECT * INTO v_pp
    FROM public.professionals
    WHERE id = v_assessment.evaluator_professional_id;

    SELECT fmr.larsana_percent INTO v_retention
    FROM public.first_month_retention_rules fmr
    WHERE fmr.version_id = v_pricing_version_id;

    v_retention := COALESCE(v_retention, CASE WHEN v_pp.person_type = 'PJ' THEN 30 ELSE 40 END);
    IF v_pp.person_type = 'PJ' AND v_retention = 40 THEN
      v_retention := 30;
    END IF;

    v_pp_pct := 100 - v_retention;
    v_larsana_pct := v_retention;

    v_total := v_unit_price * v_assessment.proposed_session_count;
    v_cycle_number := 1;
    v_due_date := (v_now + interval '7 days')::date;

    UPDATE public.initial_assessments
    SET
      family_response = 'SIM',
      accepted_weekly_frequency = p_chosen_weekly_frequency,
      responded_at = v_now,
      responded_by_user_id = auth.uid(),
      status = 'respondida_sim',
      updated_at = v_now
    WHERE id = p_assessment_id;

    UPDATE public.patients
    SET
      suggested_weekly_frequency = p_chosen_weekly_frequency,
      patient_level = v_assessment.proposed_patient_level,
      updated_at = v_now
    WHERE id = v_assessment.patient_id;

    INSERT INTO public.care_cycles (
      patient_id,
      cycle_number,
      session_count,
      assigned_professional_id,
      pricing_version_id,
      region_id,
      patient_level,
      session_unit_price_cents,
      total_amount_cents,
      status,
      payment_status,
      is_first_month_capture,
      pp_percentage,
      larsana_percentage
    ) VALUES (
      v_assessment.patient_id,
      v_cycle_number,
      v_assessment.proposed_session_count,
      v_assessment.evaluator_professional_id,
      v_pricing_version_id,
      v_patient.region_id,
      v_assessment.proposed_patient_level,
      v_unit_price,
      v_total,
      'aguardando_pagamento',
      'pendente',
      true,
      v_pp_pct,
      v_larsana_pct
    )
    RETURNING id INTO v_cycle_id;

    INSERT INTO public.charges (
      patient_id,
      cycle_id,
      assessment_id,
      amount_cents,
      payment_method,
      payment_status,
      due_date,
      description
    ) VALUES (
      v_assessment.patient_id,
      v_cycle_id,
      p_assessment_id,
      v_total,
      'PIX',
      'pendente',
      v_due_date,
      format('Pagamento ciclo 1 — %s sessões', v_assessment.proposed_session_count)
    )
    RETURNING id INTO v_charge_id;

    PERFORM public.notify_professional_user(
      v_assessment.evaluator_professional_id,
      'avaliacao_resposta'::public.notification_type,
      'Família aceitou a proposta',
      coalesce(v_patient.full_name, 'Paciente')
        || ' respondeu SIM. Aguardando pagamento para iniciar o tratamento.',
      jsonb_build_object(
        'assessment_id', p_assessment_id,
        'patient_id', v_assessment.patient_id,
        'family_response', 'SIM',
        'cycle_id', v_cycle_id
      )
    );

    RETURN jsonb_build_object(
      'assessment_id', p_assessment_id,
      'family_response', 'SIM',
      'cycle_id', v_cycle_id,
      'charge_id', v_charge_id,
      'pp_percentage', v_pp_pct,
      'larsana_percentage', v_larsana_pct
    );
  END IF;

  IF p_response = 'NAO' THEN
    v_due_date := (v_now + interval '30 days')::date;

    UPDATE public.initial_assessments
    SET
      family_response = 'NAO',
      accepted_weekly_frequency = NULL,
      responded_at = v_now,
      responded_by_user_id = auth.uid(),
      status = 'respondida_nao',
      updated_at = v_now
    WHERE id = p_assessment_id;

    INSERT INTO public.charges (
      patient_id,
      assessment_id,
      amount_cents,
      payment_method,
      payment_status,
      due_date,
      description
    ) VALUES (
      v_assessment.patient_id,
      p_assessment_id,
      5000,
      'PIX',
      'pendente',
      v_due_date,
      'Taxa de avaliação domiciliar'
    )
    RETURNING id INTO v_charge_id;

    INSERT INTO public.assessment_charges (assessment_id, charge_id)
    VALUES (p_assessment_id, v_charge_id)
    ON CONFLICT (assessment_id) DO UPDATE SET charge_id = EXCLUDED.charge_id;

    PERFORM public.notify_professional_user(
      v_assessment.evaluator_professional_id,
      'avaliacao_resposta'::public.notification_type,
      'Família recusou a proposta',
      coalesce(v_patient.full_name, 'Paciente')
        || ' respondeu NÃO à proposta de tratamento.',
      jsonb_build_object(
        'assessment_id', p_assessment_id,
        'patient_id', v_assessment.patient_id,
        'family_response', 'NAO'
      )
    );

    RETURN jsonb_build_object(
      'assessment_id', p_assessment_id,
      'family_response', 'NAO',
      'charge_id', v_charge_id
    );
  END IF;

  RAISE EXCEPTION 'Resposta inválida';
END;
$$;

COMMENT ON FUNCTION public.send_assessment_proposal(uuid) IS
  'Gestão envia proposta à família e notifica responsáveis + PP alocado.';

COMMENT ON FUNCTION public.accept_assessment_proposal(uuid, public.family_response, integer) IS
  'Família responde proposta; notifica PP sobre SIM/NAO; SIM cria ciclo 1 + cobrança.';
