-- Confirmação da Sara: texto correto para primeira terapia do ciclo + proposal_type quando demanda tem cycle_id.

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
  v_effective_type public.scheduling_proposal_type;
BEGIN
  SELECT CASE
    WHEN sp.cycle_id IS NOT NULL THEN 'continuidade'::public.scheduling_proposal_type
    ELSE sp.proposal_type
  END
  INTO v_effective_type
  FROM public.scheduling_proposals sp
  WHERE sp.id = p_proposal_id;

  v_effective_type := coalesce(v_effective_type, p_proposal_type);

  v_slot_label := to_char(p_slot_starts_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY "às" HH24:MI');

  v_kind := CASE v_effective_type
    WHEN 'avaliacao' THEN 'avaliação domiciliar'
    WHEN 'continuidade' THEN 'primeira terapia do ciclo'
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
        'session_id', p_session_id,
        'proposal_type', v_effective_type
      )
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
  v_proposal_type public.scheduling_proposal_type;
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

  v_proposal_type := CASE
    WHEN v_demand.cycle_id IS NOT NULL THEN 'continuidade'::public.scheduling_proposal_type
    ELSE v_demand.demand_type::text::public.scheduling_proposal_type
  END;

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
    v_proposal_type,
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

  v_message_body := CASE v_proposal_type
    WHEN 'continuidade' THEN
      'Seu profissional parceiro enviou opções de horário para a primeira terapia do ciclo. Escolha a que melhor se encaixa na sua rotina.'
    ELSE
      'Seu profissional parceiro enviou opções de horário para o atendimento. Escolha a que melhor se encaixa na sua rotina.'
  END;

  v_notification_title := CASE v_proposal_type
    WHEN 'continuidade' THEN 'Escolha o horário da primeira terapia'
    ELSE 'Horários disponíveis para atendimento'
  END;

  v_notification_body := CASE v_proposal_type
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

GRANT EXECUTE ON FUNCTION public.push_scheduling_confirmation_to_patient_chat(uuid, uuid, timestamptz, uuid, public.scheduling_proposal_type) TO service_role;
GRANT EXECUTE ON FUNCTION public.submit_pp_availability(uuid, jsonb) TO authenticated;

-- Corrige mensagens já gravadas com texto de avaliação para propostas de continuidade confirmadas.
UPDATE public.patient_chat_messages pcm
SET body = replace(
  pcm.body,
  'Confirmamos sua avaliação domiciliar para',
  'Confirmamos sua primeira terapia do ciclo para'
)
WHERE pcm.template_code = 'patient_confirmed_slot'
  AND pcm.body LIKE '%Confirmamos sua avaliação domiciliar para%'
  AND EXISTS (
    SELECT 1
    FROM public.scheduling_proposals sp
    WHERE sp.id = (pcm.payload ->> 'proposal_id')::uuid
      AND (sp.proposal_type = 'continuidade' OR sp.cycle_id IS NOT NULL)
  );
