-- Segundo momento de agendamento: após pagamento do ciclo, PP envia horários da 1ª terapia
-- e o paciente confirma; o horário replica para todo o ciclo.

ALTER TABLE public.demands
  ADD COLUMN IF NOT EXISTS cycle_id uuid REFERENCES public.care_cycles (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_demands_cycle ON public.demands (cycle_id)
  WHERE cycle_id IS NOT NULL;

COMMENT ON COLUMN public.demands.cycle_id IS
  'Quando preenchido, demanda interna de agendamento do início do ciclo (não aparece no marketplace).';

CREATE OR REPLACE FUNCTION public.ensure_cycle_start_scheduling_demand(p_cycle_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle public.care_cycles%ROWTYPE;
  v_patient public.patients%ROWTYPE;
  v_demand_id uuid;
  v_address_id uuid;
  v_pp_user_id uuid;
  v_patient_name text;
BEGIN
  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = p_cycle_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ciclo não encontrado';
  END IF;

  IF v_cycle.assigned_professional_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_demand_id
  FROM public.demands d
  WHERE d.cycle_id = p_cycle_id
    AND d.status = 'alocada'
  ORDER BY d.created_at DESC
  LIMIT 1;

  IF v_demand_id IS NOT NULL THEN
    RETURN v_demand_id;
  END IF;

  SELECT * INTO v_patient FROM public.patients WHERE id = v_cycle.patient_id;

  SELECT pa.id INTO v_address_id
  FROM public.patient_addresses pa
  WHERE pa.patient_id = v_cycle.patient_id
  ORDER BY pa.is_primary DESC, pa.created_at ASC
  LIMIT 1;

  INSERT INTO public.demands (
    patient_id,
    address_id,
    region_id,
    status,
    assigned_professional_id,
    demand_type,
    request_source,
    cycle_id
  ) VALUES (
    v_cycle.patient_id,
    v_address_id,
    COALESCE(v_cycle.region_id, v_patient.region_id),
    'alocada',
    v_cycle.assigned_professional_id,
    'continuidade',
    'gestao',
    p_cycle_id
  )
  RETURNING id INTO v_demand_id;

  SELECT p.full_name INTO v_patient_name FROM public.patients p WHERE p.id = v_cycle.patient_id;

  SELECT pr.user_id INTO v_pp_user_id
  FROM public.professionals pr
  WHERE pr.id = v_cycle.assigned_professional_id;

  IF v_pp_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, payload)
    VALUES (
      v_pp_user_id,
      'agendamento'::public.notification_type,
      'Envie horários da primeira terapia',
      coalesce(v_patient_name, 'Paciente')
        || ' confirmou o pagamento. Envie opções de horário para a primeira sessão do ciclo.',
      jsonb_build_object(
        'patient_id', v_cycle.patient_id,
        'cycle_id', p_cycle_id,
        'demand_id', v_demand_id,
        'href', '/profissional/pacientes/' || v_cycle.patient_id::text
      )
    );
  END IF;

  RETURN v_demand_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_charge_payment(p_charge_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_charge public.charges%ROWTYPE;
  v_cycle public.care_cycles%ROWTYPE;
  v_i integer;
  v_assessment_at timestamptz;
  v_sessions_before integer;
  v_sessions_after integer;
  v_patient_name text;
  v_finalize jsonb;
  v_scheduling_demand_id uuid := NULL;
BEGIN
  SELECT * INTO v_charge FROM public.charges WHERE id = p_charge_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cobrança não encontrada';
  END IF;

  IF v_charge.payment_status = 'pago' THEN
    IF v_charge.charge_kind = 'assessment_request' THEN
      v_finalize := public.patient_finalize_service_request_after_payment(p_charge_id);
      RETURN v_finalize || jsonb_build_object('charge_id', p_charge_id, 'already_paid', true);
    END IF;

    SELECT count(*) INTO v_sessions_after FROM public.care_sessions WHERE cycle_id = v_charge.cycle_id;
    RETURN jsonb_build_object(
      'charge_id', p_charge_id,
      'cycle_id', v_charge.cycle_id,
      'already_paid', true,
      'sessions_count', v_sessions_after
    );
  END IF;

  IF v_charge.payment_status NOT IN ('pendente', 'vencido') THEN
    RAISE EXCEPTION 'Cobrança não pode ser confirmada no status atual';
  END IF;

  UPDATE public.charges
  SET payment_status = 'pago', paid_at = now(), updated_at = now()
  WHERE id = p_charge_id;

  IF v_charge.charge_kind = 'assessment_request' THEN
    v_finalize := public.patient_finalize_service_request_after_payment(p_charge_id);

    SELECT p.full_name INTO v_patient_name FROM public.patients p WHERE p.id = v_charge.patient_id;

    PERFORM public.notify_patient_responsibles(
      v_charge.patient_id,
      'geral'::public.notification_type,
      'Pagamento da avaliação confirmado',
      coalesce(v_patient_name, 'Paciente') || ': estamos procurando um profissional parceiro para sua avaliação.',
      jsonb_build_object('charge_id', p_charge_id, 'href', '/paciente/solicitar')
    );

    RETURN v_finalize || jsonb_build_object('charge_id', p_charge_id, 'already_paid', false);
  END IF;

  IF v_charge.cycle_id IS NOT NULL THEN
    SELECT * INTO v_cycle FROM public.care_cycles WHERE id = v_charge.cycle_id;

    UPDATE public.care_cycles
    SET status = 'ativo', payment_status = 'pago', updated_at = now()
    WHERE id = v_cycle.id;

    SELECT count(*) INTO v_sessions_before FROM public.care_sessions WHERE cycle_id = v_cycle.id;

    IF v_sessions_before = 0 THEN
      SELECT ia.created_at INTO v_assessment_at
      FROM public.initial_assessments ia
      WHERE ia.patient_id = v_cycle.patient_id
      ORDER BY ia.created_at DESC
      LIMIT 1;

      FOR v_i IN 1..v_cycle.session_count LOOP
        INSERT INTO public.care_sessions (
          cycle_id, session_number, status, professional_id,
          is_assessment_session, scheduled_at
        ) VALUES (
          v_cycle.id,
          v_i,
          CASE
            WHEN v_i = 1 AND v_cycle.cycle_number = 1 THEN 'realizada'::public.session_status
            ELSE 'prevista'::public.session_status
          END,
          v_cycle.assigned_professional_id,
          v_i = 1 AND v_cycle.cycle_number = 1,
          CASE
            WHEN v_i = 1 AND v_cycle.cycle_number = 1 THEN COALESCE(v_assessment_at, now() - interval '7 days')
            ELSE NULL
          END
        );
      END LOOP;
    END IF;

    SELECT pr.full_name INTO v_patient_name FROM public.patients pr WHERE pr.id = v_cycle.patient_id;

    v_scheduling_demand_id := public.ensure_cycle_start_scheduling_demand(v_cycle.id);

    PERFORM public.notify_patient_responsibles(
      v_charge.patient_id,
      'cobranca'::public.notification_type,
      'Pagamento confirmado',
      coalesce(v_patient_name, 'Paciente')
        || ': pagamento confirmado. Seu profissional parceiro enviará opções de horário para a primeira terapia em breve.',
      jsonb_build_object(
        'charge_id', p_charge_id,
        'cycle_id', v_charge.cycle_id,
        'href', '/paciente/solicitar'
      )
    );
  END IF;

  SELECT count(*) INTO v_sessions_after FROM public.care_sessions WHERE cycle_id = v_charge.cycle_id;

  RETURN jsonb_build_object(
    'charge_id', p_charge_id,
    'cycle_id', v_charge.cycle_id,
    'sessions_count', coalesce(v_sessions_after, 0),
    'scheduling_demand_id', v_scheduling_demand_id,
    'already_paid', false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.push_scheduling_proposal_to_patient_chat(
  p_patient_id uuid,
  p_proposal_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_responsible record;
  v_thread_id uuid;
  v_slots jsonb;
  v_body text;
  v_proposal public.scheduling_proposals%ROWTYPE;
BEGIN
  SELECT * INTO v_proposal FROM public.scheduling_proposals WHERE id = p_proposal_id;

  v_body := CASE v_proposal.proposal_type
    WHEN 'continuidade' THEN
      'Seu profissional parceiro enviou opções de horário para a primeira terapia do ciclo. Escolha a que melhor se encaixa na sua rotina.'
    ELSE
      'Seu profissional parceiro enviou opções de horário para o atendimento. Escolha a que melhor se encaixa na sua rotina.'
  END;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', sps.id,
        'starts_at', sps.starts_at,
        'ends_at', sps.ends_at,
        'sort_order', sps.sort_order
      )
      ORDER BY sps.sort_order
    ),
    '[]'::jsonb
  )
  INTO v_slots
  FROM public.scheduling_proposal_slots sps
  WHERE sps.proposal_id = p_proposal_id;

  FOR v_responsible IN
    SELECT pr.user_id
    FROM public.patient_responsibles pr
    WHERE pr.patient_id = p_patient_id
      AND pr.user_id IS NOT NULL
  LOOP
    SELECT t.id INTO v_thread_id
    FROM public.patient_chat_threads t
    WHERE t.patient_id = p_patient_id
      AND t.user_id = v_responsible.user_id;

    IF v_thread_id IS NULL THEN
      INSERT INTO public.patient_chat_threads (patient_id, user_id)
      VALUES (p_patient_id, v_responsible.user_id)
      RETURNING id INTO v_thread_id;

      INSERT INTO public.patient_chat_messages (thread_id, sender_role, template_code, body)
      VALUES (
        v_thread_id,
        'sara',
        'welcome',
        'Oi! Meu nome é Sara. Sou assistente da Larsana e estou aqui para te ajudar com confirmações de horário, lembretes e orientações sobre seu tratamento.'
      );
    END IF;

    INSERT INTO public.patient_chat_messages (thread_id, sender_role, template_code, body, payload)
    VALUES (
      v_thread_id,
      'sara',
      'pp_slots_offered',
      v_body,
      jsonb_build_object('proposal_id', p_proposal_id, 'slots', v_slots)
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_pp_availability(
  p_demand_id uuid,
  p_slots jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pp_id uuid;
  v_demand public.demands%ROWTYPE;
  v_proposal_id uuid;
  v_slot jsonb;
  v_sort integer := 0;
  v_patient_name text;
  v_expires timestamptz;
  v_notification_title text;
  v_notification_body text;
  v_message_body text;
BEGIN
  SELECT p.id INTO v_pp_id
  FROM public.professionals p
  WHERE p.user_id = auth.uid();

  IF v_pp_id IS NULL THEN
    RAISE EXCEPTION 'Profissional não encontrado';
  END IF;

  SELECT * INTO v_demand FROM public.demands WHERE id = p_demand_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demanda não encontrada';
  END IF;

  IF v_demand.assigned_professional_id IS DISTINCT FROM v_pp_id
     AND v_demand.status NOT IN ('aberta', 'alocada') THEN
    RAISE EXCEPTION 'Demanda não disponível para agendamento';
  END IF;

  IF jsonb_typeof(p_slots) <> 'array' OR jsonb_array_length(p_slots) < 1 THEN
    RAISE EXCEPTION 'Informe ao menos um horário disponível';
  END IF;

  v_expires := now() + interval '7 days';

  INSERT INTO public.scheduling_proposals (
    demand_id,
    patient_id,
    professional_id,
    cycle_id,
    proposal_type,
    status,
    expires_at
  ) VALUES (
    p_demand_id,
    v_demand.patient_id,
    v_pp_id,
    v_demand.cycle_id,
    v_demand.demand_type::text::public.scheduling_proposal_type,
    'pendente',
    v_expires
  )
  RETURNING id INTO v_proposal_id;

  FOR v_slot IN SELECT * FROM jsonb_array_elements(p_slots) LOOP
    v_sort := v_sort + 1;
    INSERT INTO public.scheduling_proposal_slots (proposal_id, starts_at, ends_at, sort_order)
    VALUES (
      v_proposal_id,
      (v_slot ->> 'starts_at')::timestamptz,
      COALESCE((v_slot ->> 'ends_at')::timestamptz, (v_slot ->> 'starts_at')::timestamptz + interval '1 hour'),
      v_sort
    );
  END LOOP;

  v_message_body := CASE v_demand.demand_type
    WHEN 'continuidade' THEN
      'Seu profissional parceiro enviou opções de horário para a primeira terapia do ciclo. Escolha a que melhor se encaixa na sua rotina.'
    ELSE
      'Seu profissional parceiro enviou opções de horário para o atendimento. Escolha a que melhor se encaixa na sua rotina.'
  END;

  v_notification_title := CASE v_demand.demand_type
    WHEN 'continuidade' THEN 'Escolha o horário da primeira terapia'
    ELSE 'Horários disponíveis para atendimento'
  END;

  v_notification_body := CASE v_demand.demand_type
    WHEN 'continuidade' THEN
      coalesce((SELECT p.full_name FROM public.patients p WHERE p.id = v_demand.patient_id), 'Paciente')
        || ': escolha o horário da primeira sessão do tratamento.'
    ELSE
      coalesce((SELECT p.full_name FROM public.patients p WHERE p.id = v_demand.patient_id), 'Paciente')
        || ': escolha um horário proposto pelo profissional.'
  END;

  INSERT INTO public.scheduling_messages (proposal_id, sender_role, template_code, body)
  VALUES (
    v_proposal_id,
    'sistema',
    'pp_slots_offered',
    v_message_body
  );

  PERFORM public.push_scheduling_proposal_to_patient_chat(v_demand.patient_id, v_proposal_id);

  PERFORM public.notify_patient_responsibles(
    v_demand.patient_id,
    'agendamento'::public.notification_type,
    v_notification_title,
    v_notification_body,
    jsonb_build_object(
      'proposal_id', v_proposal_id,
      'demand_id', p_demand_id,
      'href', '/paciente/chat?proposal=' || v_proposal_id::text
    )
  );

  RETURN jsonb_build_object('proposal_id', v_proposal_id, 'status', 'pendente');
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
  v_cycle_id uuid;
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

  IF v_proposal.proposal_type = 'remarcacao' THEN
    RAISE EXCEPTION 'Use patient_respond_reschedule_proposal para remarcações';
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

  IF v_proposal.proposal_type = 'avaliacao' THEN
    v_session_id := public.ensure_assessment_agenda_session(
      v_proposal.patient_id,
      v_proposal.professional_id,
      v_slot.starts_at,
      p_proposal_id
    );
  ELSIF v_proposal.proposal_type = 'continuidade' THEN
    v_cycle_id := v_proposal.cycle_id;

    IF v_cycle_id IS NULL AND v_proposal.demand_id IS NOT NULL THEN
      SELECT d.cycle_id INTO v_cycle_id FROM public.demands d WHERE d.id = v_proposal.demand_id;
    END IF;

    IF v_cycle_id IS NULL THEN
      SELECT cc.id INTO v_cycle_id
      FROM public.care_cycles cc
      WHERE cc.patient_id = v_proposal.patient_id
        AND cc.assigned_professional_id = v_proposal.professional_id
        AND cc.status = 'ativo'
      ORDER BY cc.cycle_number DESC
      LIMIT 1;
    END IF;

    IF v_cycle_id IS NULL THEN
      RAISE EXCEPTION 'Ciclo de tratamento ativo não encontrado';
    END IF;

    SELECT * INTO v_cycle FROM public.care_cycles WHERE id = v_cycle_id;

    SELECT cs.id INTO v_session_id
    FROM public.care_sessions cs
    WHERE cs.cycle_id = v_cycle.id
      AND cs.is_assessment_session = false
      AND cs.status NOT IN ('realizada', 'cancelada_sem_justificativa')
      AND cs.scheduled_at IS NULL
    ORDER BY cs.session_number ASC
    LIMIT 1;

    IF v_session_id IS NULL THEN
      SELECT cs.id INTO v_session_id
      FROM public.care_sessions cs
      WHERE cs.cycle_id = v_cycle.id
        AND cs.is_assessment_session = false
        AND cs.status = 'prevista'::public.session_status
      ORDER BY cs.session_number ASC
      LIMIT 1;
    END IF;

    IF v_session_id IS NULL THEN
      RAISE EXCEPTION 'Nenhuma sessão de tratamento disponível para agendar neste ciclo';
    END IF;

    UPDATE public.care_sessions
    SET
      scheduled_at = v_slot.starts_at,
      status = 'prevista'::public.session_status,
      professional_id = v_proposal.professional_id,
      updated_at = now()
    WHERE id = v_session_id;

    PERFORM public.replicate_session_schedule(v_cycle.id, v_session_id);

    UPDATE public.care_cycles
    SET started_at = COALESCE(started_at, v_slot.starts_at), updated_at = now()
    WHERE id = v_cycle.id;

    UPDATE public.scheduling_proposals
    SET cycle_id = v_cycle.id, updated_at = now()
    WHERE id = p_proposal_id;
  END IF;

  PERFORM public.push_scheduling_confirmation_to_patient_chat(
    v_proposal.patient_id,
    p_proposal_id,
    v_slot.starts_at,
    v_session_id,
    v_proposal.proposal_type
  );

  SELECT p.full_name INTO v_patient_name FROM public.patients p WHERE p.id = v_proposal.patient_id;

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

REVOKE ALL ON FUNCTION public.ensure_cycle_start_scheduling_demand(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_cycle_start_scheduling_demand(uuid) TO service_role;

-- Ciclos já pagos sem demanda de agendamento: criar demanda se ainda houver sessões sem horário
DO $$
DECLARE
  v_cycle record;
  v_unscheduled integer;
BEGIN
  FOR v_cycle IN
    SELECT cc.id
    FROM public.care_cycles cc
    WHERE cc.status = 'ativo'
      AND cc.payment_status = 'pago'
      AND cc.assigned_professional_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.demands d
        WHERE d.cycle_id = cc.id AND d.status = 'alocada'
      )
  LOOP
    SELECT count(*) INTO v_unscheduled
    FROM public.care_sessions cs
    WHERE cs.cycle_id = v_cycle.id
      AND cs.is_assessment_session = false
      AND cs.scheduled_at IS NULL
      AND cs.status = 'prevista'::public.session_status;

    IF v_unscheduled > 0 THEN
      PERFORM public.ensure_cycle_start_scheduling_demand(v_cycle.id);
    END IF;
  END LOOP;
END $$;
