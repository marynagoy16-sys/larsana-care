-- Cria sessão de avaliação na agenda do PP ao confirmar horário (mesmo sem ciclo de tratamento).

CREATE OR REPLACE FUNCTION public.ensure_assessment_agenda_session(
  p_patient_id uuid,
  p_professional_id uuid,
  p_scheduled_at timestamptz,
  p_proposal_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient public.patients%ROWTYPE;
  v_cycle public.care_cycles%ROWTYPE;
  v_cycle_id uuid;
  v_session_id uuid;
  v_pricing_version_id uuid;
  v_unit_price integer;
  v_cycle_number integer;
  v_patient_level public.patient_level;
BEGIN
  SELECT * INTO v_patient FROM public.patients WHERE id = p_patient_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Paciente não encontrado';
  END IF;

  v_patient_level := COALESCE(v_patient.patient_level, 'N1'::public.patient_level);

  SELECT cc.* INTO v_cycle
  FROM public.care_cycles cc
  WHERE cc.patient_id = p_patient_id
    AND cc.assigned_professional_id = p_professional_id
    AND cc.status IN ('rascunho', 'ativo', 'aguardando_pagamento')
  ORDER BY cc.cycle_number DESC
  LIMIT 1;

  IF FOUND THEN
    v_cycle_id := v_cycle.id;
  ELSE
    SELECT id INTO v_pricing_version_id
    FROM public.pricing_matrix_versions
    WHERE is_active = true
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_pricing_version_id IS NULL THEN
      RAISE EXCEPTION 'Matriz de preços vigente não encontrada';
    END IF;

    SELECT e.session_price_cents INTO v_unit_price
    FROM public.pricing_matrix_entries e
    WHERE e.version_id = v_pricing_version_id
      AND e.region_id IS NOT DISTINCT FROM v_patient.region_id
      AND e.patient_level = v_patient_level
    LIMIT 1;

    IF v_unit_price IS NULL THEN
      SELECT e.session_price_cents INTO v_unit_price
      FROM public.pricing_matrix_entries e
      WHERE e.version_id = v_pricing_version_id
        AND e.patient_level = v_patient_level
      LIMIT 1;
    END IF;

    v_unit_price := COALESCE(v_unit_price, 0);

    SELECT COALESCE(max(cycle_number), 0) + 1 INTO v_cycle_number
    FROM public.care_cycles
    WHERE patient_id = p_patient_id;

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
      payment_status
    ) VALUES (
      p_patient_id,
      v_cycle_number,
      4,
      p_professional_id,
      v_pricing_version_id,
      v_patient.region_id,
      v_patient_level,
      v_unit_price,
      v_unit_price * 4,
      'rascunho',
      CASE
        WHEN public.patient_has_paid_assessment_fee(p_patient_id) THEN 'pago'::public.payment_status
        ELSE 'pendente'::public.payment_status
      END
    )
    RETURNING id INTO v_cycle_id;
  END IF;

  IF p_proposal_id IS NOT NULL THEN
    UPDATE public.scheduling_proposals
    SET cycle_id = v_cycle_id, updated_at = now()
    WHERE id = p_proposal_id;
  END IF;

  SELECT cs.id INTO v_session_id
  FROM public.care_sessions cs
  WHERE cs.cycle_id = v_cycle_id
    AND cs.is_assessment_session = true
  ORDER BY cs.session_number ASC
  LIMIT 1;

  IF v_session_id IS NULL THEN
    SELECT cs.id INTO v_session_id
    FROM public.care_sessions cs
    WHERE cs.cycle_id = v_cycle_id
    ORDER BY cs.session_number ASC
    LIMIT 1;
  END IF;

  IF v_session_id IS NOT NULL THEN
    UPDATE public.care_sessions
    SET
      scheduled_at = p_scheduled_at,
      status = 'prevista'::public.session_status,
      professional_id = p_professional_id,
      is_assessment_session = true,
      updated_at = now()
    WHERE id = v_session_id;
  ELSE
    INSERT INTO public.care_sessions (
      cycle_id,
      session_number,
      status,
      professional_id,
      scheduled_at,
      is_assessment_session
    ) VALUES (
      v_cycle_id,
      1,
      'prevista'::public.session_status,
      p_professional_id,
      p_scheduled_at,
      true
    )
    RETURNING id INTO v_session_id;
  END IF;

  RETURN v_session_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.patient_confirm_slot(
  p_proposal_id uuid,
  p_slot_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proposal public.scheduling_proposals%ROWTYPE;
  v_slot public.scheduling_proposal_slots%ROWTYPE;
  v_cycle public.care_cycles%ROWTYPE;
  v_session_id uuid;
  v_patient_name text;
BEGIN
  SELECT * INTO v_proposal FROM public.scheduling_proposals WHERE id = p_proposal_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proposta não encontrada';
  END IF;

  IF NOT (v_proposal.patient_id = ANY (public.current_patient_ids())) AND NOT public.is_staff() THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  IF v_proposal.status <> 'pendente' THEN
    RAISE EXCEPTION 'Proposta não está pendente';
  END IF;

  SELECT * INTO v_slot
  FROM public.scheduling_proposal_slots
  WHERE id = p_slot_id AND proposal_id = p_proposal_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Horário não encontrado nesta proposta';
  END IF;

  UPDATE public.scheduling_proposals
  SET status = 'confirmado', confirmed_slot_id = p_slot_id, updated_at = now()
  WHERE id = p_proposal_id;

  INSERT INTO public.scheduling_messages (proposal_id, sender_role, template_code, body)
  VALUES (
    p_proposal_id,
    'paciente',
    'patient_confirmed_slot',
    'Horário confirmado: ' || to_char(v_slot.starts_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI')
  );

  SELECT cc.* INTO v_cycle
  FROM public.care_cycles cc
  WHERE cc.patient_id = v_proposal.patient_id
    AND cc.assigned_professional_id = v_proposal.professional_id
    AND cc.status IN ('ativo', 'aguardando_pagamento', 'rascunho')
  ORDER BY cc.cycle_number DESC
  LIMIT 1;

  IF FOUND THEN
    SELECT cs.id INTO v_session_id
    FROM public.care_sessions cs
    WHERE cs.cycle_id = v_cycle.id
    ORDER BY cs.session_number ASC
    LIMIT 1;

    IF v_session_id IS NOT NULL THEN
      UPDATE public.care_sessions
      SET
        scheduled_at = v_slot.starts_at,
        status = 'prevista'::public.session_status,
        professional_id = v_proposal.professional_id,
        is_assessment_session = (v_proposal.proposal_type = 'avaliacao'),
        updated_at = now()
      WHERE id = v_session_id;

      IF v_proposal.proposal_type <> 'remarcacao' THEN
        PERFORM public.replicate_session_schedule(v_cycle.id, v_session_id);
      END IF;
    ELSE
      INSERT INTO public.care_sessions (
        cycle_id, session_number, status, professional_id, scheduled_at, is_assessment_session
      ) VALUES (
        v_cycle.id,
        1,
        'prevista'::public.session_status,
        v_proposal.professional_id,
        v_slot.starts_at,
        v_proposal.proposal_type = 'avaliacao'
      )
      RETURNING id INTO v_session_id;

      IF v_proposal.proposal_type <> 'remarcacao' THEN
        PERFORM public.replicate_session_schedule(v_cycle.id, v_session_id);
      END IF;
    END IF;

    UPDATE public.scheduling_proposals
    SET cycle_id = v_cycle.id, updated_at = now()
    WHERE id = p_proposal_id;
  ELSIF v_proposal.proposal_type = 'avaliacao' THEN
    v_session_id := public.ensure_assessment_agenda_session(
      v_proposal.patient_id,
      v_proposal.professional_id,
      v_slot.starts_at,
      p_proposal_id
    );
  END IF;

  SELECT p.full_name INTO v_patient_name FROM public.patients p WHERE id = v_proposal.patient_id;

  PERFORM public.notify_professional_user(
    v_proposal.professional_id,
    'agendamento_confirmado'::public.notification_type,
    'Horário confirmado pelo paciente',
    coalesce(v_patient_name, 'Paciente') || ' confirmou o horário de atendimento.',
    jsonb_build_object(
      'proposal_id', p_proposal_id,
      'slot_id', p_slot_id,
      'session_id', v_session_id,
      'href', '/profissional/agenda'
    )
  );

  RETURN jsonb_build_object(
    'proposal_id', p_proposal_id,
    'status', 'confirmado',
    'session_id', v_session_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_assessment_agenda_session(uuid, uuid, timestamptz, uuid) FROM PUBLIC;

COMMENT ON FUNCTION public.ensure_assessment_agenda_session(uuid, uuid, timestamptz, uuid) IS
  'Garante ciclo rascunho + sessão de avaliação na agenda do PP após confirmação do paciente.';
