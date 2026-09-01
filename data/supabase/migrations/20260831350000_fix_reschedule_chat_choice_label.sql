-- Mensagem do paciente no chat = só o rótulo do botão (sem "Escolhi o horário:").

CREATE OR REPLACE FUNCTION public.push_scheduling_confirmation_to_patient_chat(
  p_patient_id uuid,
  p_proposal_id uuid,
  p_slot_starts_at timestamptz,
  p_session_id uuid DEFAULT NULL,
  p_proposal_type public.scheduling_proposal_type DEFAULT 'avaliacao'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_responsible record;
  v_thread_id uuid;
  v_slot_label text;
  v_body text;
  v_effective_type public.scheduling_proposal_type;
BEGIN
  SELECT CASE
    WHEN sp.proposal_type = 'remarcacao' THEN 'remarcacao'::public.scheduling_proposal_type
    WHEN sp.cycle_id IS NOT NULL THEN 'continuidade'::public.scheduling_proposal_type
    ELSE sp.proposal_type
  END
  INTO v_effective_type
  FROM public.scheduling_proposals sp
  WHERE sp.id = p_proposal_id;

  v_effective_type := coalesce(v_effective_type, p_proposal_type);

  v_slot_label := public.format_scheduling_slot_label_pt(p_slot_starts_at);

  v_body := CASE v_effective_type
    WHEN 'continuidade' THEN format(
      'Confirmamos sua terapia para %s. O profissional parceiro já foi avisado e o atendimento entrou na agenda dele.',
      v_slot_label
    )
    WHEN 'remarcacao' THEN format(
      'Confirmamos sua terapia para %s. O profissional parceiro já foi avisado e o atendimento entrou na agenda dele.',
      v_slot_label
    )
    WHEN 'avaliacao' THEN format(
      'Confirmamos sua avaliação domiciliar para %s. O profissional parceiro já foi avisado e o atendimento entrou na agenda dele.',
      v_slot_label
    )
    ELSE format(
      'Confirmamos seu atendimento para %s. O profissional parceiro já foi avisado e o atendimento entrou na agenda dele.',
      v_slot_label
    )
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
      'patient_confirmed_slot',
      v_body,
      jsonb_build_object(
        'proposal_id', p_proposal_id,
        'slot_starts_at', p_slot_starts_at,
        'session_id', p_session_id,
        'proposal_type', v_effective_type
      )
    );
  END LOOP;
END;
$$;

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

GRANT EXECUTE ON FUNCTION public.patient_respond_reschedule_proposal(uuid, boolean, uuid, text) TO authenticated;

UPDATE public.patient_chat_messages pcm
SET
  body = coalesce(
    nullif(pcm.payload ->> 'choice_label', ''),
    public.format_scheduling_slot_label_pt((pcm.payload ->> 'slot_starts_at')::timestamptz)
  ),
  payload = pcm.payload || jsonb_build_object(
    'choice_label',
    coalesce(
      nullif(pcm.payload ->> 'choice_label', ''),
      public.format_scheduling_slot_label_pt((pcm.payload ->> 'slot_starts_at')::timestamptz)
    )
  )
WHERE pcm.template_code = 'patient_selected_slot'
  AND pcm.payload ? 'slot_starts_at'
  AND (
    pcm.body LIKE 'Escolhi o horário:%'
    OR pcm.body ~ '^\d{2}/\d{2}/\d{4}'
  );
