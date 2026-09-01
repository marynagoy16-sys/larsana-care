-- Rótulo da escolha do paciente no chat = mesmo texto do botão (ex.: quarta-feira, 2 de setembro · 10:00).

CREATE OR REPLACE FUNCTION public.format_scheduling_slot_label_pt(p_starts_at timestamptz)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_local timestamp;
  v_dow integer;
  v_day integer;
  v_month integer;
  v_days text[] := ARRAY[
    'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
    'quinta-feira', 'sexta-feira', 'sábado'
  ];
  v_months text[] := ARRAY[
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
BEGIN
  v_local := p_starts_at AT TIME ZONE 'America/Sao_Paulo';
  v_dow := extract(dow from v_local)::integer;
  v_day := extract(day from v_local)::integer;
  v_month := extract(month from v_local)::integer;

  RETURN v_days[v_dow + 1] || ', ' || v_day::text || ' de ' || v_months[v_month] || ' · ' ||
    to_char(v_local, 'HH24:MI');
END;
$$;

CREATE OR REPLACE FUNCTION public.patient_confirm_slot(
  p_proposal_id uuid,
  p_slot_id uuid,
  p_choice_label text DEFAULT NULL
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
  v_choice_body text;
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

  v_choice_body := coalesce(
    nullif(trim(p_choice_label), ''),
    public.format_scheduling_slot_label_pt(v_slot.starts_at)
  );

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
    v_choice_body,
    'patient_selected_slot',
    jsonb_build_object(
      'slot_id', p_slot_id,
      'slot_starts_at', v_slot.starts_at,
      'choice_label', v_choice_body
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

GRANT EXECUTE ON FUNCTION public.patient_confirm_slot(uuid, uuid, text) TO authenticated;

UPDATE public.patient_chat_messages pcm
SET
  body = public.format_scheduling_slot_label_pt((pcm.payload ->> 'slot_starts_at')::timestamptz),
  payload = pcm.payload || jsonb_build_object(
    'choice_label',
    public.format_scheduling_slot_label_pt((pcm.payload ->> 'slot_starts_at')::timestamptz)
  )
WHERE pcm.template_code = 'patient_selected_slot'
  AND pcm.payload ? 'slot_starts_at'
  AND (
    pcm.body LIKE 'Escolhi o horário:%'
    OR pcm.body ~ '^\d{2}/\d{2}/\d{4}'
  );
