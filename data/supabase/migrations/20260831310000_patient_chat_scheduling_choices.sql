-- Espelha no chat Sara as escolhas do paciente (confirmar/recusar horário).

CREATE OR REPLACE FUNCTION public.push_patient_scheduling_choice_to_chat(
  p_patient_id uuid,
  p_proposal_id uuid,
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
    SELECT t.id INTO v_thread_id
    FROM public.patient_chat_threads t
    WHERE t.patient_id = p_patient_id
      AND t.user_id = v_responsible.user_id;

    IF v_thread_id IS NULL THEN
      INSERT INTO public.patient_chat_threads (patient_id, user_id)
      VALUES (p_patient_id, v_responsible.user_id)
      RETURNING id INTO v_thread_id;
    END IF;

    INSERT INTO public.patient_chat_messages (thread_id, sender_role, template_code, body, payload)
    VALUES (
      v_thread_id,
      'paciente',
      p_template_code,
      p_body,
      coalesce(p_payload, '{}'::jsonb) || jsonb_build_object('proposal_id', p_proposal_id)
    );
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.push_patient_scheduling_choice_to_chat(uuid, uuid, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.push_patient_scheduling_choice_to_chat(uuid, uuid, text, text, jsonb) TO service_role;

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
  v_slot_label text;
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

  v_slot_label := to_char(v_slot.starts_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY "às" HH24:MI');

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

  PERFORM public.push_patient_scheduling_choice_to_chat(
    v_proposal.patient_id,
    p_proposal_id,
    'Escolhi o horário: ' || v_slot_label,
    'patient_selected_slot',
    jsonb_build_object(
      'slot_id', p_slot_id,
      'slot_starts_at', v_slot.starts_at
    )
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
  v_body text;
BEGIN
  SELECT * INTO v_proposal FROM public.scheduling_proposals WHERE id = p_proposal_id FOR UPDATE;

  IF NOT FOUND OR NOT (v_proposal.patient_id = ANY (public.current_patient_ids())) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  IF v_proposal.status <> 'pendente' THEN
    RAISE EXCEPTION 'Proposta não está pendente';
  END IF;

  v_body := COALESCE(
    nullif(trim(p_reason), ''),
    'Nenhum horário funciona — pedir novas opções'
  );

  UPDATE public.scheduling_proposals
  SET status = 'recusado', rejection_reason = p_reason, updated_at = now()
  WHERE id = p_proposal_id;

  INSERT INTO public.scheduling_messages (proposal_id, sender_role, template_code, body)
  VALUES (
    p_proposal_id,
    'paciente',
    'patient_rejected_slots',
    v_body
  );

  PERFORM public.push_patient_scheduling_choice_to_chat(
    v_proposal.patient_id,
    p_proposal_id,
    v_body,
    'patient_rejected_slots',
    jsonb_build_object('reason', p_reason)
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

GRANT EXECUTE ON FUNCTION public.patient_confirm_slot(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.patient_reject_slot(uuid, text) TO authenticated;

-- Backfill: escolhas já registradas em scheduling_messages.
INSERT INTO public.patient_chat_messages (thread_id, sender_role, template_code, body, payload, created_at)
SELECT
  t.id,
  'paciente',
  CASE sm.template_code
    WHEN 'patient_confirmed_slot' THEN 'patient_selected_slot'
    ELSE sm.template_code
  END,
  CASE sm.template_code
    WHEN 'patient_confirmed_slot' THEN
      'Escolhi o horário: ' || to_char(sps.starts_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY "às" HH24:MI')
    ELSE sm.body
  END,
  jsonb_build_object(
    'proposal_id', sp.id,
    'slot_id', sp.confirmed_slot_id,
    'slot_starts_at', sps.starts_at
  ),
  sm.created_at
FROM public.scheduling_messages sm
INNER JOIN public.scheduling_proposals sp ON sp.id = sm.proposal_id
LEFT JOIN public.scheduling_proposal_slots sps ON sps.id = sp.confirmed_slot_id
INNER JOIN public.patient_responsibles pr ON pr.patient_id = sp.patient_id AND pr.user_id IS NOT NULL
INNER JOIN public.patient_chat_threads t ON t.patient_id = sp.patient_id AND t.user_id = pr.user_id
WHERE sm.sender_role = 'paciente'
  AND sm.template_code IN ('patient_confirmed_slot', 'patient_rejected_slots')
  AND NOT EXISTS (
    SELECT 1
    FROM public.patient_chat_messages pcm
    WHERE pcm.thread_id = t.id
      AND pcm.sender_role = 'paciente'
      AND pcm.payload ->> 'proposal_id' = sp.id::text
      AND pcm.template_code IN ('patient_selected_slot', 'patient_rejected_slots')
  );

-- Garante ordem cronológica: escolha do paciente antes da confirmação da Sara.
UPDATE public.patient_chat_messages pcm_patient
SET created_at = pcm_sara.created_at - interval '1 second'
FROM public.patient_chat_messages pcm_sara
WHERE pcm_patient.sender_role = 'paciente'
  AND pcm_patient.template_code = 'patient_selected_slot'
  AND pcm_sara.sender_role = 'sara'
  AND pcm_sara.template_code = 'patient_confirmed_slot'
  AND pcm_patient.payload ->> 'proposal_id' = pcm_sara.payload ->> 'proposal_id'
  AND pcm_patient.thread_id = pcm_sara.thread_id
  AND pcm_patient.created_at >= pcm_sara.created_at;
