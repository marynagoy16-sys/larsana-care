-- Lembrete 24h no chat Sara (Confirmar / Remarcar) + remarcação via chat

ALTER TABLE public.care_sessions
  ADD COLUMN IF NOT EXISTS session_reminder_chat_sent_at timestamptz;

COMMENT ON COLUMN public.care_sessions.session_reminder_chat_sent_at IS
  'Quando a Sara enviou lembrete 24h no chat do paciente.';

ALTER TYPE public.reschedule_request_status ADD VALUE IF NOT EXISTS 'awaiting_pp_slots';

-- ===== Helpers =====

CREATE OR REPLACE FUNCTION public.assert_no_active_reschedule_request(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.session_reschedule_requests r
    WHERE r.session_id = p_session_id
      AND r.status IN (
        'pending_patient',
        'sub_offered',
        'pp_reschedule_window',
        'awaiting_pp_slots'
      )
  ) THEN
    RAISE EXCEPTION 'Já existe solicitação de remarcação ativa para esta sessão';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public._patient_chat_ensure_thread(
  p_patient_id uuid,
  p_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_thread_id uuid;
BEGIN
  SELECT t.id INTO v_thread_id
  FROM public.patient_chat_threads t
  WHERE t.patient_id = p_patient_id
    AND t.user_id = p_user_id;

  IF v_thread_id IS NULL THEN
    INSERT INTO public.patient_chat_threads (patient_id, user_id)
    VALUES (p_patient_id, p_user_id)
    RETURNING id INTO v_thread_id;

    INSERT INTO public.patient_chat_messages (thread_id, sender_role, template_code, body)
    VALUES (
      v_thread_id,
      'sara',
      'welcome',
      'Oi! Meu nome é Sara. Sou assistente da Larsana e estou aqui para te ajudar com confirmações de horário, lembretes e orientações sobre seu tratamento.'
    );
  END IF;

  RETURN v_thread_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.push_session_reminder_to_patient_chat(p_session_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.care_sessions%ROWTYPE;
  v_cycle public.care_cycles%ROWTYPE;
  v_pp_name text;
  v_responsible record;
  v_thread_id uuid;
  v_body text;
  v_scheduled_label text;
  v_count integer := 0;
BEGIN
  SELECT * INTO v_session FROM public.care_sessions WHERE id = p_session_id;
  IF NOT FOUND OR v_session.scheduled_at IS NULL THEN
    RETURN 0;
  END IF;

  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = v_session.cycle_id;

  SELECT p.full_name INTO v_pp_name
  FROM public.professionals p
  WHERE p.id = v_session.professional_id;

  v_scheduled_label := to_char(
    v_session.scheduled_at AT TIME ZONE 'America/Sao_Paulo',
    'DD/MM/YYYY "às" HH24:MI'
  );

  v_body := format(
    'Lembrete: sua terapia %s está marcada para %s com %s.%s'
    || E'\n\nConfirme sua presença ou, se precisar, solicite remarcação.'
    || E'\n\nRegra de remarcação: com 12 horas ou mais de antecedência você pode remarcar sem taxa.'
    || ' Com menos de 12 horas, é necessário atestado médico e há cobrança de 50%% do valor da terapia.'
    || ' O novo horário deve ser em até 14 dias, sempre com o mesmo profissional.',
    CASE WHEN v_session.is_assessment_session THEN 'de avaliação' ELSE '#' || v_session.session_number::text END,
    v_scheduled_label,
    coalesce(v_pp_name, 'seu profissional parceiro'),
    CASE WHEN v_cycle.cycle_number IS NOT NULL AND NOT v_session.is_assessment_session
      THEN ' (Ciclo ' || v_cycle.cycle_number || ').'
      ELSE '.'
    END
  );

  FOR v_responsible IN
    SELECT pr.user_id
    FROM public.patient_responsibles pr
    WHERE pr.patient_id = v_cycle.patient_id
      AND pr.user_id IS NOT NULL
  LOOP
    v_thread_id := public._patient_chat_ensure_thread(v_cycle.patient_id, v_responsible.user_id);

    INSERT INTO public.patient_chat_messages (thread_id, sender_role, template_code, body, payload)
    VALUES (
      v_thread_id,
      'sara',
      'session_reminder_24h',
      v_body,
      jsonb_build_object(
        'session_id', p_session_id,
        'scheduled_at', v_session.scheduled_at,
        'cycle_number', v_cycle.cycle_number,
        'session_number', v_session.session_number,
        'professional_name', v_pp_name,
        'is_assessment', v_session.is_assessment_session
      )
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_session_24h_chat_reminders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row record;
  v_count integer := 0;
BEGIN
  FOR v_row IN
    SELECT cs.id
    FROM public.care_sessions cs
    JOIN public.care_cycles cc ON cc.id = cs.cycle_id
    WHERE cs.status IN ('prevista', 'remarcada')
      AND cs.scheduled_at BETWEEN now() + interval '23 hours' AND now() + interval '25 hours'
      AND cs.session_reminder_chat_sent_at IS NULL
      AND cc.payment_status = 'pago'
      AND cc.status = 'ativo'
  LOOP
    PERFORM public.push_session_reminder_to_patient_chat(v_row.id);
    UPDATE public.care_sessions
    SET session_reminder_chat_sent_at = now()
    WHERE id = v_row.id;
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ===== Patient actions from chat =====

CREATE OR REPLACE FUNCTION public.patient_chat_confirm_presence(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.care_sessions%ROWTYPE;
  v_cycle public.care_cycles%ROWTYPE;
  v_result jsonb;
  v_responsible record;
  v_thread_id uuid;
  v_scheduled_label text;
BEGIN
  v_result := public.patient_confirm_session_presence(p_session_id);

  SELECT * INTO v_session FROM public.care_sessions WHERE id = p_session_id;
  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = v_session.cycle_id;

  v_scheduled_label := to_char(
    v_session.scheduled_at AT TIME ZONE 'America/Sao_Paulo',
    'DD/MM/YYYY "às" HH24:MI'
  );

  FOR v_responsible IN
    SELECT pr.user_id
    FROM public.patient_responsibles pr
    WHERE pr.patient_id = v_cycle.patient_id
      AND pr.user_id IS NOT NULL
  LOOP
    IF v_responsible.user_id = auth.uid() OR public.is_staff() THEN
      v_thread_id := public._patient_chat_ensure_thread(v_cycle.patient_id, v_responsible.user_id);

      INSERT INTO public.patient_chat_messages (thread_id, sender_role, template_code, body, payload)
      VALUES (
        v_thread_id,
        'paciente',
        'patient_confirmed_presence',
        'Confirmo presença para ' || v_scheduled_label || '.',
        jsonb_build_object('session_id', p_session_id)
      );

      INSERT INTO public.patient_chat_messages (thread_id, sender_role, template_code, body, payload)
      VALUES (
        v_thread_id,
        'sara',
        'presence_confirmed',
        'Presença confirmada! Te esperamos em ' || v_scheduled_label || '. O profissional parceiro já foi avisado.',
        jsonb_build_object('session_id', p_session_id, 'scheduled_at', v_session.scheduled_at)
      );
    END IF;
  END LOOP;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.patient_chat_request_reschedule(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.care_sessions%ROWTYPE;
  v_cycle public.care_cycles%ROWTYPE;
  v_settings public.platform_operational_settings%ROWTYPE;
  v_request_id uuid;
  v_deadline timestamptz;
  v_patient_name text;
  v_pp_user_id uuid;
  v_responsible record;
  v_thread_id uuid;
  v_scheduled_label text;
BEGIN
  SELECT * INTO v_settings FROM public.get_operational_settings();
  IF NOT FOUND THEN
    v_settings.reschedule_max_days_ahead := 14;
  END IF;

  SELECT * INTO v_session FROM public.care_sessions WHERE id = p_session_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sessão não encontrada';
  END IF;

  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = v_session.cycle_id;
  IF NOT (v_cycle.patient_id = ANY (public.current_patient_ids())) AND NOT public.is_staff() THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  IF v_session.status NOT IN ('prevista', 'remarcada') OR v_session.scheduled_at IS NULL THEN
    RAISE EXCEPTION 'Terapia não pode ser remarcada';
  END IF;

  PERFORM public.assert_no_active_reschedule_request(p_session_id);

  v_deadline := now() + make_interval(days => v_settings.reschedule_max_days_ahead);

  INSERT INTO public.session_reschedule_requests (
    session_id,
    cycle_id,
    patient_id,
    responsible_professional_id,
    initiated_by,
    window_type,
    status,
    original_scheduled_at,
    proposed_scheduled_at,
    reschedule_deadline,
    created_by
  ) VALUES (
    p_session_id,
    v_cycle.id,
    v_cycle.patient_id,
    v_session.professional_id,
    'paciente',
    CASE
      WHEN public.session_hours_until(v_session.scheduled_at) < coalesce(v_settings.cancellation_min_hours_notice, 12)
      THEN 'late'::public.reschedule_window_type
      ELSE 'on_time'::public.reschedule_window_type
    END,
    'awaiting_pp_slots',
    v_session.scheduled_at,
    NULL,
    v_deadline,
    auth.uid()
  )
  RETURNING id INTO v_request_id;

  SELECT p.full_name INTO v_patient_name FROM public.patients p WHERE p.id = v_cycle.patient_id;

  SELECT pr.user_id INTO v_pp_user_id
  FROM public.professionals pr
  WHERE pr.id = v_session.professional_id;

  IF v_pp_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, payload)
    VALUES (
      v_pp_user_id,
      'remarcacao'::public.notification_type,
      'Paciente solicitou remarcação',
      coalesce(v_patient_name, 'Paciente') || ' pediu novos horários para a terapia '
        || to_char(v_session.scheduled_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') || '.',
      jsonb_build_object(
        'session_id', p_session_id,
        'request_id', v_request_id,
        'href', '/profissional/agenda/' || p_session_id::text
      )
    );
  END IF;

  v_scheduled_label := to_char(
    v_session.scheduled_at AT TIME ZONE 'America/Sao_Paulo',
    'DD/MM/YYYY "às" HH24:MI'
  );

  FOR v_responsible IN
    SELECT pr.user_id
    FROM public.patient_responsibles pr
    WHERE pr.patient_id = v_cycle.patient_id
      AND pr.user_id IS NOT NULL
  LOOP
    IF v_responsible.user_id = auth.uid() OR public.is_staff() THEN
      v_thread_id := public._patient_chat_ensure_thread(v_cycle.patient_id, v_responsible.user_id);

      INSERT INTO public.patient_chat_messages (thread_id, sender_role, template_code, body, payload)
      VALUES (
        v_thread_id,
        'paciente',
        'patient_requested_reschedule',
        'Gostaria de remarcar a terapia de ' || v_scheduled_label || '.',
        jsonb_build_object('session_id', p_session_id, 'request_id', v_request_id)
      );

      INSERT INTO public.patient_chat_messages (thread_id, sender_role, template_code, body, payload)
      VALUES (
        v_thread_id,
        'sara',
        'reschedule_requested',
        'Entendi. Solicitei novos horários ao seu profissional parceiro. Assim que ele enviar as opções, elas aparecerão aqui para você escolher.',
        jsonb_build_object('session_id', p_session_id, 'request_id', v_request_id)
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'request_id', v_request_id,
    'status', 'awaiting_pp_slots',
    'session_id', p_session_id
  );
END;
$$;

-- ===== PP sends slots after patient request =====

CREATE OR REPLACE FUNCTION public.pp_submit_reschedule_availability(
  p_request_id uuid,
  p_slots jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pp_id uuid;
  v_request public.session_reschedule_requests%ROWTYPE;
  v_proposal_id uuid;
  v_slot jsonb;
  v_sort integer := 0;
  v_expires timestamptz;
BEGIN
  SELECT p.id INTO v_pp_id FROM public.professionals p WHERE p.user_id = auth.uid();
  IF v_pp_id IS NULL THEN
    RAISE EXCEPTION 'Profissional não encontrado';
  END IF;

  SELECT * INTO v_request
  FROM public.session_reschedule_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND OR v_request.responsible_professional_id <> v_pp_id THEN
    RAISE EXCEPTION 'Solicitação não encontrada ou não pertence a você';
  END IF;

  IF v_request.status <> 'awaiting_pp_slots' THEN
    RAISE EXCEPTION 'Solicitação não está aguardando horários';
  END IF;

  IF jsonb_typeof(p_slots) <> 'array' OR jsonb_array_length(p_slots) < 1 THEN
    RAISE EXCEPTION 'Informe ao menos um horário disponível';
  END IF;

  v_expires := coalesce(v_request.reschedule_deadline, now() + interval '7 days');

  INSERT INTO public.scheduling_proposals (
    patient_id,
    professional_id,
    cycle_id,
    session_id,
    proposal_type,
    status,
    expires_at
  ) VALUES (
    v_request.patient_id,
    v_pp_id,
    v_request.cycle_id,
    v_request.session_id,
    'remarcacao',
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

  UPDATE public.session_reschedule_requests
  SET
    status = 'pending_patient',
    scheduling_proposal_id = v_proposal_id,
    updated_at = now()
  WHERE id = p_request_id;

  PERFORM public.push_scheduling_proposal_to_patient_chat(v_request.patient_id, v_proposal_id);

  RETURN jsonb_build_object('proposal_id', v_proposal_id, 'status', 'pending_patient');
END;
$$;

-- ===== Push remarcacao proposals to chat (incl. PP-initiated) =====

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
    WHEN 'remarcacao' THEN
      'Seu profissional parceiro enviou opções para remarcar o atendimento. Escolha o horário que melhor se encaixa na sua rotina.'
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
    v_thread_id := public._patient_chat_ensure_thread(p_patient_id, v_responsible.user_id);

    INSERT INTO public.patient_chat_messages (thread_id, sender_role, template_code, body, payload)
    VALUES (
      v_thread_id,
      'sara',
      'pp_slots_offered',
      v_body,
      jsonb_build_object(
        'proposal_id', p_proposal_id,
        'proposal_type', v_proposal.proposal_type,
        'slots', v_slots
      )
    );
  END LOOP;
END;
$$;

-- ===== PP-initiated reschedule also goes to chat =====

CREATE OR REPLACE FUNCTION public.pp_request_reschedule(
  p_session_id uuid,
  p_new_scheduled_at timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pp_id uuid;
  v_session public.care_sessions%ROWTYPE;
  v_cycle public.care_cycles%ROWTYPE;
  v_settings public.platform_operational_settings%ROWTYPE;
  v_hours numeric;
  v_proposal_id uuid;
  v_request_id uuid;
  v_patient_name text;
  v_deadline timestamptz;
  v_result jsonb;
BEGIN
  SELECT p.id INTO v_pp_id FROM public.professionals p WHERE p.user_id = auth.uid();
  IF v_pp_id IS NULL THEN
    RAISE EXCEPTION 'Profissional não encontrado';
  END IF;

  SELECT * INTO v_settings FROM public.get_operational_settings();
  IF NOT FOUND THEN
    v_settings.cancellation_min_hours_notice := 12;
    v_settings.reschedule_max_days_ahead := 14;
  END IF;

  SELECT * INTO v_session FROM public.care_sessions WHERE id = p_session_id FOR UPDATE;
  IF NOT FOUND OR v_session.professional_id <> v_pp_id THEN
    RAISE EXCEPTION 'Sessão não encontrada ou não alocada a você';
  END IF;

  IF v_session.status NOT IN ('prevista', 'remarcada') OR v_session.scheduled_at IS NULL THEN
    RAISE EXCEPTION 'Sessão não pode ser remarcada';
  END IF;

  PERFORM public.assert_no_active_reschedule_request(p_session_id);

  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = v_session.cycle_id;
  v_hours := public.session_hours_until(v_session.scheduled_at);
  v_deadline := now() + make_interval(days => v_settings.reschedule_max_days_ahead);

  IF v_hours >= v_settings.cancellation_min_hours_notice THEN
    PERFORM public.assert_reschedule_date_window(
      p_new_scheduled_at,
      now(),
      v_settings.reschedule_max_days_ahead
    );

    INSERT INTO public.scheduling_proposals (
      patient_id,
      professional_id,
      cycle_id,
      session_id,
      proposal_type,
      status,
      expires_at
    ) VALUES (
      v_cycle.patient_id,
      v_pp_id,
      v_cycle.id,
      p_session_id,
      'remarcacao',
      'pendente',
      v_deadline
    )
    RETURNING id INTO v_proposal_id;

    INSERT INTO public.scheduling_proposal_slots (proposal_id, starts_at, ends_at, sort_order)
    VALUES (
      v_proposal_id,
      p_new_scheduled_at,
      p_new_scheduled_at + interval '1 hour',
      1
    );

    INSERT INTO public.session_reschedule_requests (
      session_id,
      cycle_id,
      patient_id,
      responsible_professional_id,
      initiated_by,
      window_type,
      status,
      original_scheduled_at,
      proposed_scheduled_at,
      reschedule_deadline,
      scheduling_proposal_id,
      created_by
    ) VALUES (
      p_session_id,
      v_cycle.id,
      v_cycle.patient_id,
      v_pp_id,
      'pp',
      'on_time',
      'pending_patient',
      v_session.scheduled_at,
      p_new_scheduled_at,
      v_deadline,
      v_proposal_id,
      auth.uid()
    )
    RETURNING id INTO v_request_id;

    PERFORM public.push_scheduling_proposal_to_patient_chat(v_cycle.patient_id, v_proposal_id);

    SELECT p.full_name INTO v_patient_name FROM public.patients p WHERE p.id = v_cycle.patient_id;

    PERFORM public.notify_patient_responsibles(
      v_cycle.patient_id,
      'remarcacao_pendente_aceite'::public.notification_type,
      'Confirme a remarcação',
      coalesce(v_patient_name, 'Paciente') || ': seu profissional propôs remarcar o atendimento para '
        || to_char(p_new_scheduled_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') || '.',
      jsonb_build_object(
        'session_id', p_session_id,
        'proposal_id', v_proposal_id,
        'request_id', v_request_id,
        'href', '/paciente/chat?proposal=' || v_proposal_id::text
      )
    );

    RETURN jsonb_build_object(
      'flow', 'patient_acceptance',
      'proposal_id', v_proposal_id,
      'request_id', v_request_id,
      'status', 'pending_patient'
    );
  END IF;

  INSERT INTO public.session_reschedule_requests (
    session_id,
    cycle_id,
    patient_id,
    responsible_professional_id,
    initiated_by,
    window_type,
    status,
    original_scheduled_at,
    proposed_scheduled_at,
    reschedule_deadline,
    created_by
  ) VALUES (
    p_session_id,
    v_cycle.id,
    v_cycle.patient_id,
    v_pp_id,
    'pp',
    'late',
    'sub_offered',
    v_session.scheduled_at,
    v_session.scheduled_at,
    v_deadline,
    auth.uid()
  )
  RETURNING id INTO v_request_id;

  SELECT p.full_name INTO v_patient_name FROM public.patients p WHERE p.id = v_cycle.patient_id;

  PERFORM public.notify_patient_responsibles(
    v_cycle.patient_id,
    'sub_oferta'::public.notification_type,
    'Substituto disponível?',
    coalesce(v_patient_name, 'Paciente') || ': seu profissional não pode atender neste horário. Deseja um substituto no mesmo horário?',
    jsonb_build_object(
      'session_id', p_session_id,
      'request_id', v_request_id,
      'href', '/paciente/agendamento'
    )
  );

  RETURN jsonb_build_object(
    'flow', 'sub_offer',
    'request_id', v_request_id,
    'status', 'sub_offered'
  );
END;
$$;

-- ===== Chat echo when patient accepts remarcacao =====

CREATE OR REPLACE FUNCTION public.patient_respond_reschedule_proposal(
  p_proposal_id uuid,
  p_accept boolean,
  p_slot_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proposal public.scheduling_proposals%ROWTYPE;
  v_request public.session_reschedule_requests%ROWTYPE;
  v_slot public.scheduling_proposal_slots%ROWTYPE;
  v_patient_name text;
  v_sub_id uuid;
  v_responsible record;
  v_thread_id uuid;
  v_slot_label text;
  v_result jsonb;
BEGIN
  SELECT * INTO v_proposal FROM public.scheduling_proposals WHERE id = p_proposal_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proposta não encontrada';
  END IF;

  IF v_proposal.proposal_type <> 'remarcacao' THEN
    RAISE EXCEPTION 'Use patient_confirm_slot para propostas de agendamento inicial';
  END IF;

  IF NOT (v_proposal.patient_id = ANY (public.current_patient_ids())) AND NOT public.is_staff() THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  IF v_proposal.status <> 'pendente' THEN
    RAISE EXCEPTION 'Proposta não está pendente';
  END IF;

  SELECT * INTO v_request
  FROM public.session_reschedule_requests
  WHERE scheduling_proposal_id = p_proposal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitação de remarcação não encontrada';
  END IF;

  IF p_accept THEN
    IF p_slot_id IS NULL THEN
      RAISE EXCEPTION 'Informe o horário confirmado';
    END IF;

    SELECT * INTO v_slot
    FROM public.scheduling_proposal_slots
    WHERE id = p_slot_id AND proposal_id = p_proposal_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Horário não encontrado nesta proposta';
    END IF;

    v_slot_label := to_char(v_slot.starts_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY "às" HH24:MI');

    UPDATE public.scheduling_proposals
    SET status = 'confirmado', confirmed_slot_id = p_slot_id, updated_at = now()
    WHERE id = p_proposal_id;

    PERFORM public.finalize_session_reschedule(
      v_proposal.session_id,
      v_slot.starts_at,
      v_request.id,
      v_proposal.professional_id
    );

    SELECT p.full_name INTO v_patient_name FROM public.patients p WHERE p.id = v_proposal.patient_id;

    PERFORM public.notify_professional_user(
      v_proposal.professional_id,
      'remarcacao'::public.notification_type,
      'Remarcação confirmada',
      coalesce(v_patient_name, 'Paciente') || ' confirmou o novo horário.',
      jsonb_build_object('proposal_id', p_proposal_id, 'session_id', v_proposal.session_id)
    );

    FOR v_responsible IN
      SELECT pr.user_id
      FROM public.patient_responsibles pr
      WHERE pr.patient_id = v_proposal.patient_id
        AND pr.user_id IS NOT NULL
    LOOP
      IF v_responsible.user_id = auth.uid() OR public.is_staff() THEN
        v_thread_id := public._patient_chat_ensure_thread(v_proposal.patient_id, v_responsible.user_id);

        INSERT INTO public.patient_chat_messages (thread_id, sender_role, template_code, body, payload)
        VALUES (
          v_thread_id,
          'paciente',
          'patient_selected_slot',
          'Escolhi o horário: ' || v_slot_label,
          jsonb_build_object(
            'proposal_id', p_proposal_id,
            'slot_id', p_slot_id,
            'slot_starts_at', v_slot.starts_at
          )
        );

        INSERT INTO public.patient_chat_messages (thread_id, sender_role, template_code, body, payload)
        VALUES (
          v_thread_id,
          'sara',
          'patient_confirmed_slot',
          'Confirmamos sua terapia para ' || v_slot_label || '. O profissional parceiro já foi avisado e o atendimento entrou na agenda dele.',
          jsonb_build_object(
            'proposal_id', p_proposal_id,
            'slot_starts_at', v_slot.starts_at,
            'session_id', v_proposal.session_id,
            'proposal_type', 'remarcacao'
          )
        );
      END IF;
    END LOOP;

    v_result := jsonb_build_object('status', 'completed', 'session_id', v_proposal.session_id);
    RETURN v_result;
  END IF;

  UPDATE public.scheduling_proposals
  SET status = 'recusado', updated_at = now()
  WHERE id = p_proposal_id;

  v_sub_id := public.match_substitute_professional(v_proposal.session_id);

  UPDATE public.session_reschedule_requests
  SET
    status = 'sub_offered',
    substitute_professional_id = v_sub_id,
    updated_at = now()
  WHERE id = v_request.id;

  SELECT p.full_name INTO v_patient_name FROM public.patients p WHERE p.id = v_proposal.patient_id;

  PERFORM public.notify_patient_responsibles(
    v_proposal.patient_id,
    'sub_oferta'::public.notification_type,
    'Prefere um substituto?',
    coalesce(v_patient_name, 'Paciente') || ': deseja um fisioterapeuta substituto no horário original?',
    jsonb_build_object('session_id', v_proposal.session_id, 'request_id', v_request.id, 'href', '/paciente/agendamento')
  );

  RETURN jsonb_build_object('status', 'sub_offered', 'request_id', v_request.id);
END;
$$;

-- ===== 12h reminder: skip push if Sara 24h already sent =====

CREATE OR REPLACE FUNCTION public.process_session_presence_reminders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row record;
  v_count integer := 0;
BEGIN
  FOR v_row IN
    SELECT cs.id, cs.scheduled_at, cc.patient_id, cs.professional_id, p.full_name AS patient_name
    FROM public.care_sessions cs
    JOIN public.care_cycles cc ON cc.id = cs.cycle_id
    JOIN public.patients p ON p.id = cc.patient_id
    WHERE cs.status = 'prevista'
      AND cs.scheduled_at BETWEEN now() + interval '11 hours' AND now() + interval '13 hours'
      AND cs.presence_confirmed_at IS NULL
      AND cs.presence_reminder_sent_at IS NULL
      AND cs.session_reminder_chat_sent_at IS NULL
  LOOP
    PERFORM public.notify_patient_responsibles(
      v_row.patient_id, 'geral', 'Confirme sua sessão',
      'Você tem fisioterapia agendada. Confirme sua presença no aplicativo.',
      jsonb_build_object('session_id', v_row.id, 'href', '/paciente/chat')
    );
    UPDATE public.care_sessions SET presence_reminder_sent_at = now() WHERE id = v_row.id;
    v_count := v_count + 1;
  END LOOP;

  FOR v_row IN
    SELECT cs.id, pr.user_id AS pp_user_id, p.full_name AS patient_name
    FROM public.care_sessions cs
    JOIN public.care_cycles cc ON cc.id = cs.cycle_id
    JOIN public.patients p ON p.id = cc.patient_id
    JOIN public.professionals pr ON pr.id = cs.professional_id
    WHERE cs.status = 'prevista'
      AND cs.scheduled_at BETWEEN now() AND now() + interval '12 hours'
      AND cs.presence_confirmed_at IS NULL
      AND cs.pp_unconfirmed_alert_sent_at IS NULL
      AND pr.user_id IS NOT NULL
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, payload)
    VALUES (
      v_row.pp_user_id, 'geral', 'Paciente ainda não confirmou',
      v_row.patient_name || ' ainda não confirmou presença. Verifique com o paciente (WhatsApp).',
      jsonb_build_object('session_id', v_row.id, 'href', '/profissional/agenda')
    );
    UPDATE public.care_sessions SET pp_unconfirmed_alert_sent_at = now() WHERE id = v_row.id;
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ===== Grants =====

REVOKE ALL ON FUNCTION public._patient_chat_ensure_thread(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.push_session_reminder_to_patient_chat(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_session_24h_chat_reminders() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.patient_chat_confirm_presence(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.patient_chat_request_reschedule(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pp_submit_reschedule_availability(uuid, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.patient_chat_confirm_presence(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.patient_chat_request_reschedule(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pp_submit_reschedule_availability(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_session_24h_chat_reminders() TO service_role;

-- ===== Cron 24h =====

DO $$
DECLARE
  v_job_id bigint;
BEGIN
  SELECT jobid INTO v_job_id
  FROM cron.job
  WHERE jobname = 'process_session_24h_chat_reminders';

  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
  END IF;

  PERFORM cron.schedule(
    'process_session_24h_chat_reminders',
    '*/15 * * * *',
    $cmd$SELECT public.process_session_24h_chat_reminders();$cmd$
  );
END;
$$;

COMMENT ON FUNCTION public.process_session_24h_chat_reminders() IS
  'Envia lembrete Sara 24h antes (chat) com opções Confirmar/Remarcar.';
