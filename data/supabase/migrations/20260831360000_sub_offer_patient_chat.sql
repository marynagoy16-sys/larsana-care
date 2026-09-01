-- Oferta de substituto (SUB) no chat Sara + eco das respostas do paciente.

CREATE OR REPLACE FUNCTION public.push_sub_offer_to_patient_chat(
  p_request_id uuid,
  p_reason text DEFAULT 'pp_late'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.session_reschedule_requests%ROWTYPE;
  v_session public.care_sessions%ROWTYPE;
  v_pp_name text;
  v_responsible record;
  v_thread_id uuid;
  v_scheduled_label text;
  v_body text;
  v_count integer := 0;
BEGIN
  SELECT * INTO v_request
  FROM public.session_reschedule_requests
  WHERE id = p_request_id;

  IF NOT FOUND OR v_request.status <> 'sub_offered' THEN
    RETURN 0;
  END IF;

  SELECT * INTO v_session FROM public.care_sessions WHERE id = v_request.session_id;

  SELECT p.full_name INTO v_pp_name
  FROM public.professionals p
  WHERE p.id = v_request.responsible_professional_id;

  v_scheduled_label := to_char(
    v_request.original_scheduled_at AT TIME ZONE 'America/Sao_Paulo',
    'DD/MM/YYYY "às" HH24:MI'
  );

  v_body := CASE coalesce(p_reason, 'pp_late')
    WHEN 'reschedule_rejected' THEN format(
      'Como os horários propostos não funcionam para você, podemos oferecer um fisioterapeuta substituto no horário original (%s).%s'
      || E'\n\nO que prefere?',
      v_scheduled_label,
      CASE WHEN v_pp_name IS NOT NULL THEN E'\n\nSeu profissional parceiro é ' || v_pp_name || '.' ELSE '' END
    )
    ELSE format(
      'Seu profissional parceiro não pode atender no horário de %s.%s'
      || E'\n\nPodemos designar um fisioterapeuta substituto no mesmo horário. O que prefere?',
      v_scheduled_label,
      CASE WHEN v_pp_name IS NOT NULL THEN E'\n\nProfissional: ' || v_pp_name || '.' ELSE '' END
    )
  END;

  FOR v_responsible IN
    SELECT pr.user_id
    FROM public.patient_responsibles pr
    WHERE pr.patient_id = v_request.patient_id
      AND pr.user_id IS NOT NULL
  LOOP
    v_thread_id := public._patient_chat_ensure_thread(v_request.patient_id, v_responsible.user_id);

    IF EXISTS (
      SELECT 1
      FROM public.patient_chat_messages pcm
      WHERE pcm.thread_id = v_thread_id
        AND pcm.template_code = 'sub_offer'
        AND pcm.payload ->> 'request_id' = p_request_id::text
    ) THEN
      CONTINUE;
    END IF;

    INSERT INTO public.patient_chat_messages (thread_id, sender_role, template_code, body, payload)
    VALUES (
      v_thread_id,
      'sara',
      'sub_offer',
      v_body,
      jsonb_build_object(
        'request_id', p_request_id,
        'session_id', v_request.session_id,
        'original_scheduled_at', v_request.original_scheduled_at,
        'reason', coalesce(p_reason, 'pp_late')
      )
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.push_patient_sub_choice_to_chat(
  p_patient_id uuid,
  p_request_id uuid,
  p_body text,
  p_template_code text,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_responsible record;
  v_thread_id uuid;
BEGIN
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
      'paciente',
      p_template_code,
      p_body,
      coalesce(p_payload, '{}'::jsonb) || jsonb_build_object('request_id', p_request_id)
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.push_sub_confirmation_to_patient_chat(
  p_patient_id uuid,
  p_request_id uuid,
  p_session_id uuid,
  p_scheduled_at timestamptz,
  p_accepted boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_responsible record;
  v_thread_id uuid;
  v_scheduled_label text;
  v_body text;
BEGIN
  v_scheduled_label := to_char(
    p_scheduled_at AT TIME ZONE 'America/Sao_Paulo',
    'DD/MM/YYYY "às" HH24:MI'
  );

  v_body := CASE WHEN p_accepted THEN
    format(
      'Confirmamos o atendimento com fisioterapeuta substituto no horário %s. Seu profissional parceiro original também foi avisado.',
      v_scheduled_label
    )
  ELSE
    'Entendido. Seu profissional parceiro foi avisado e enviará novas opções de horário em breve.'
  END;

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
      CASE WHEN p_accepted THEN 'sub_accepted' ELSE 'sub_rejected' END,
      v_body,
      jsonb_build_object(
        'request_id', p_request_id,
        'session_id', p_session_id,
        'scheduled_at', p_scheduled_at
      )
    );
  END LOOP;
END;
$$;

-- PP remarcação <12h: SUB no chat
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
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sessão não encontrada';
  END IF;

  IF v_session.professional_id <> v_pp_id AND NOT public.is_staff() THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  IF v_session.status NOT IN ('prevista', 'remarcada') THEN
    RAISE EXCEPTION 'Sessão não pode ser remarcada neste status';
  END IF;

  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = v_session.cycle_id;

  v_hours := extract(epoch FROM (v_session.scheduled_at - now())) / 3600.0;
  v_deadline := v_session.scheduled_at + (v_settings.reschedule_max_days_ahead || ' days')::interval;

  IF v_hours >= v_settings.cancellation_min_hours_notice THEN
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

  PERFORM public.push_sub_offer_to_patient_chat(v_request_id, 'pp_late');

  PERFORM public.notify_patient_responsibles(
    v_cycle.patient_id,
    'sub_oferta'::public.notification_type,
    'Substituto disponível?',
    coalesce(v_patient_name, 'Paciente') || ': seu profissional não pode atender neste horário. Deseja um substituto no mesmo horário?',
    jsonb_build_object(
      'session_id', p_session_id,
      'request_id', v_request_id,
      'href', '/paciente/chat?request=' || v_request_id::text
    )
  );

  RETURN jsonb_build_object(
    'flow', 'sub_offer',
    'request_id', v_request_id,
    'status', 'sub_offered'
  );
END;
$$;

-- Recusa de remarcação → SUB no chat
CREATE OR REPLACE FUNCTION public.patient_respond_reschedule_proposal(
  p_proposal_id uuid,
  p_accept boolean,
  p_slot_id uuid DEFAULT NULL,
  p_choice_label text DEFAULT NULL
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
  v_choice_body text;
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

    v_choice_body := coalesce(
      nullif(trim(p_choice_label), ''),
      public.format_scheduling_slot_label_pt(v_slot.starts_at)
    );

    UPDATE public.scheduling_proposals
    SET status = 'confirmado', confirmed_slot_id = p_slot_id, updated_at = now()
    WHERE id = p_proposal_id;

    PERFORM public.finalize_session_reschedule(
      v_proposal.session_id,
      v_slot.starts_at,
      v_request.id,
      v_proposal.professional_id
    );

    PERFORM public.push_patient_scheduling_choice_to_chat(
      v_proposal.patient_id,
      p_proposal_id,
      v_choice_body,
      'patient_selected_slot',
      jsonb_build_object(
        'slot_id', p_slot_id,
        'slot_starts_at', v_slot.starts_at,
        'choice_label', v_choice_body
      )
    );

    PERFORM public.push_scheduling_confirmation_to_patient_chat(
      v_proposal.patient_id,
      p_proposal_id,
      v_slot.starts_at,
      v_proposal.session_id,
      'remarcacao'::public.scheduling_proposal_type
    );

    SELECT p.full_name INTO v_patient_name FROM public.patients p WHERE p.id = v_proposal.patient_id;

    PERFORM public.notify_professional_user(
      v_proposal.professional_id,
      'remarcacao'::public.notification_type,
      'Remarcação confirmada',
      coalesce(v_patient_name, 'Paciente') || ' confirmou o novo horário.',
      jsonb_build_object('proposal_id', p_proposal_id, 'session_id', v_proposal.session_id)
    );

    v_result := jsonb_build_object('status', 'completed', 'session_id', v_proposal.session_id);
    RETURN v_result;
  END IF;

  UPDATE public.scheduling_proposals
  SET status = 'recusado', updated_at = now()
  WHERE id = p_proposal_id;

  PERFORM public.push_patient_scheduling_choice_to_chat(
    v_proposal.patient_id,
    p_proposal_id,
    'Não posso neste horário — ver opção de substituto',
    'patient_rejected_reschedule',
    jsonb_build_object('session_id', v_proposal.session_id)
  );

  v_sub_id := public.match_substitute_professional(v_proposal.session_id);

  UPDATE public.session_reschedule_requests
  SET
    status = 'sub_offered',
    substitute_professional_id = v_sub_id,
    updated_at = now()
  WHERE id = v_request.id;

  PERFORM public.push_sub_offer_to_patient_chat(v_request.id, 'reschedule_rejected');

  SELECT p.full_name INTO v_patient_name FROM public.patients p WHERE p.id = v_proposal.patient_id;

  PERFORM public.notify_patient_responsibles(
    v_proposal.patient_id,
    'sub_oferta'::public.notification_type,
    'Prefere um substituto?',
    coalesce(v_patient_name, 'Paciente') || ': deseja um fisioterapeuta substituto no horário original?',
    jsonb_build_object(
      'session_id', v_proposal.session_id,
      'request_id', v_request.id,
      'href', '/paciente/chat?request=' || v_request.id::text
    )
  );

  RETURN jsonb_build_object('status', 'sub_offered', 'request_id', v_request.id);
END;
$$;

-- Eco no chat ao aceitar/recusar SUB
CREATE OR REPLACE FUNCTION public.patient_respond_sub_offer(
  p_request_id uuid,
  p_accept boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.session_reschedule_requests%ROWTYPE;
  v_session public.care_sessions%ROWTYPE;
  v_sub_id uuid;
  v_patient_name text;
BEGIN
  SELECT * INTO v_request FROM public.session_reschedule_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitação não encontrada';
  END IF;

  IF NOT (v_request.patient_id = ANY (public.current_patient_ids())) AND NOT public.is_staff() THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  IF v_request.status <> 'sub_offered' THEN
    RAISE EXCEPTION 'Oferta SUB não está ativa';
  END IF;

  SELECT * INTO v_session FROM public.care_sessions WHERE id = v_request.session_id FOR UPDATE;

  IF p_accept THEN
    v_sub_id := COALESCE(v_request.substitute_professional_id, public.match_substitute_professional(v_request.session_id));
    IF v_sub_id IS NULL THEN
      RAISE EXCEPTION 'Nenhum profissional substituto disponível no horário';
    END IF;

    PERFORM public.push_patient_sub_choice_to_chat(
      v_request.patient_id,
      p_request_id,
      'Aceito fisioterapeuta substituto',
      'patient_accepted_sub',
      jsonb_build_object('session_id', v_session.id)
    );

    UPDATE public.session_reschedule_requests
    SET
      status = 'sub_accepted',
      substitute_professional_id = v_sub_id,
      original_professional_id = v_session.professional_id,
      updated_at = now()
    WHERE id = p_request_id;

    UPDATE public.care_sessions
    SET professional_id = v_sub_id, updated_at = now()
    WHERE id = v_session.id;

    PERFORM public.push_sub_confirmation_to_patient_chat(
      v_request.patient_id,
      p_request_id,
      v_session.id,
      v_request.original_scheduled_at,
      true
    );

    SELECT p.full_name INTO v_patient_name FROM public.patients p WHERE p.id = v_request.patient_id;

    PERFORM public.notify_professional_user(
      v_sub_id,
      'sub_confirmado'::public.notification_type,
      'Atendimento como substituto',
      coalesce(v_patient_name, 'Paciente') || ': você foi designado como substituto neste atendimento.',
      jsonb_build_object('session_id', v_session.id, 'request_id', p_request_id)
    );

    PERFORM public.notify_professional_user(
      v_request.responsible_professional_id,
      'sub_confirmado'::public.notification_type,
      'Paciente aceitou substituto',
      'O paciente aceitou atendimento com substituto no horário original.',
      jsonb_build_object('session_id', v_session.id, 'request_id', p_request_id)
    );

    UPDATE public.session_reschedule_requests
    SET status = 'completed', updated_at = now()
    WHERE id = p_request_id;

    RETURN jsonb_build_object(
      'status', 'completed',
      'substitute_professional_id', v_sub_id,
      'session_id', v_session.id
    );
  END IF;

  PERFORM public.push_patient_sub_choice_to_chat(
    v_request.patient_id,
    p_request_id,
    'Prefiro remarcar com meu profissional',
    'patient_rejected_sub',
    jsonb_build_object('session_id', v_session.id)
  );

  UPDATE public.session_reschedule_requests
  SET status = 'pp_reschedule_window', updated_at = now()
  WHERE id = p_request_id;

  PERFORM public.push_sub_confirmation_to_patient_chat(
    v_request.patient_id,
    p_request_id,
    v_session.id,
    v_request.original_scheduled_at,
    false
  );

  PERFORM public.notify_professional_user(
    v_request.responsible_professional_id,
    'sub_recusado'::public.notification_type,
    'Paciente recusou substituto',
    'O paciente preferiu remarcar com você. Reposição permitida em até 14 dias.',
    jsonb_build_object('session_id', v_session.id, 'request_id', p_request_id)
  );

  RETURN jsonb_build_object('status', 'pp_reschedule_window', 'request_id', p_request_id);
END;
$$;

REVOKE ALL ON FUNCTION public.push_sub_offer_to_patient_chat(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.push_patient_sub_choice_to_chat(uuid, uuid, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.push_sub_confirmation_to_patient_chat(uuid, uuid, uuid, timestamptz, boolean) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.push_sub_offer_to_patient_chat(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.push_patient_sub_choice_to_chat(uuid, uuid, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.push_sub_confirmation_to_patient_chat(uuid, uuid, uuid, timestamptz, boolean) TO service_role;
