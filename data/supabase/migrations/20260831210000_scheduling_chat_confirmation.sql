-- Mensagem da Sara no chat após confirmar ou recusar horário proposto

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
  v_kind text;
BEGIN
  v_slot_label := to_char(p_slot_starts_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY "às" HH24:MI');

  v_kind := CASE p_proposal_type
    WHEN 'avaliacao' THEN 'avaliação domiciliar'
    WHEN 'continuidade' THEN 'sessão de tratamento'
    ELSE 'atendimento'
  END;

  v_body := format(
    'Perfeito! Confirmamos sua %s para %s. Seu profissional parceiro já foi avisado e o atendimento entrou na agenda dele.',
    v_kind,
    v_slot_label
  );

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
      'patient_confirmed_slot',
      v_body,
      jsonb_build_object(
        'proposal_id', p_proposal_id,
        'slot_starts_at', p_slot_starts_at,
        'session_id', p_session_id
      )
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.push_scheduling_rejection_to_patient_chat(
  p_patient_id uuid,
  p_proposal_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_responsible record;
  v_thread_id uuid;
  v_body text := 'Entendi. Vou avisar seu profissional parceiro para enviar novas opções de horário assim que possível.';
BEGIN
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
      CONTINUE;
    END IF;

    INSERT INTO public.patient_chat_messages (thread_id, sender_role, template_code, body, payload)
    VALUES (
      v_thread_id,
      'sara',
      'patient_rejected_slots',
      v_body,
      jsonb_build_object(
        'proposal_id', p_proposal_id,
        'reason', p_reason
      )
    );
  END LOOP;
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

CREATE OR REPLACE FUNCTION public.patient_reject_slot(
  p_proposal_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proposal public.scheduling_proposals%ROWTYPE;
  v_patient_name text;
BEGIN
  SELECT * INTO v_proposal FROM public.scheduling_proposals WHERE id = p_proposal_id FOR UPDATE;

  IF NOT FOUND OR NOT (v_proposal.patient_id = ANY (public.current_patient_ids())) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  IF v_proposal.status <> 'pendente' THEN
    RAISE EXCEPTION 'Proposta não está pendente';
  END IF;

  UPDATE public.scheduling_proposals
  SET status = 'recusado', rejection_reason = p_reason, updated_at = now()
  WHERE id = p_proposal_id;

  INSERT INTO public.scheduling_messages (proposal_id, sender_role, template_code, body)
  VALUES (
    p_proposal_id,
    'paciente',
    'patient_rejected_slots',
    COALESCE(p_reason, 'Nenhum dos horários propostos funciona para mim. Por favor, envie novas opções.')
  );

  PERFORM public.push_scheduling_rejection_to_patient_chat(
    v_proposal.patient_id,
    p_proposal_id,
    p_reason
  );

  SELECT p.full_name INTO v_patient_name FROM public.patients p WHERE p.id = v_proposal.patient_id;

  PERFORM public.notify_professional_user(
    v_proposal.professional_id,
    'agendamento'::public.notification_type,
    'Horários recusados pelo paciente',
    coalesce(v_patient_name, 'Paciente') || ' não confirmou os horários propostos.',
    jsonb_build_object('proposal_id', p_proposal_id)
  );

  RETURN jsonb_build_object('proposal_id', p_proposal_id, 'status', 'recusado');
END;
$$;

GRANT EXECUTE ON FUNCTION public.push_scheduling_confirmation_to_patient_chat(uuid, uuid, timestamptz, uuid, public.scheduling_proposal_type) TO service_role;
GRANT EXECUTE ON FUNCTION public.push_scheduling_rejection_to_patient_chat(uuid, uuid, text) TO service_role;

-- Backfill: confirmações já feitas sem mensagem da Sara no chat
DO $$
DECLARE
  v_row record;
  v_session_id uuid;
BEGIN
  FOR v_row IN
    SELECT
      sp.id AS proposal_id,
      sp.patient_id,
      sp.proposal_type,
      sps.starts_at
    FROM public.scheduling_proposals sp
    JOIN public.scheduling_proposal_slots sps ON sps.id = sp.confirmed_slot_id
    WHERE sp.status = 'confirmado'
      AND NOT EXISTS (
        SELECT 1
        FROM public.patient_chat_messages pcm
        WHERE pcm.template_code = 'patient_confirmed_slot'
          AND pcm.payload ->> 'proposal_id' = sp.id::text
      )
  LOOP
    SELECT cs.id INTO v_session_id
    FROM public.care_sessions cs
    JOIN public.care_cycles cc ON cc.id = cs.cycle_id
    WHERE cc.patient_id = v_row.patient_id
      AND cs.scheduled_at = v_row.starts_at
    ORDER BY cs.updated_at DESC NULLS LAST
    LIMIT 1;

    PERFORM public.push_scheduling_confirmation_to_patient_chat(
      v_row.patient_id,
      v_row.proposal_id,
      v_row.starts_at,
      v_session_id,
      v_row.proposal_type
    );
  END LOOP;
END $$;
