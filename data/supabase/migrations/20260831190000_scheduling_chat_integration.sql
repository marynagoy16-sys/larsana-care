-- Horários de agendamento no Chat Sara + listagem confiável para o paciente

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
  v_body text := 'Seu profissional parceiro enviou opções de horário para o atendimento. Escolha a que melhor se encaixa na sua rotina.';
BEGIN
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

CREATE OR REPLACE FUNCTION public.patient_list_pending_scheduling_proposals(
  p_demand_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_ids uuid[];
BEGIN
  IF public.current_user_role() <> 'paciente'::public.user_role AND NOT public.is_staff() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  v_patient_ids := public.current_patient_ids();
  IF cardinality(v_patient_ids) = 0 THEN
    RETURN '[]'::jsonb;
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(row_data ORDER BY (row_data ->> 'created_at') DESC)
    FROM (
      SELECT jsonb_build_object(
        'id', sp.id,
        'demand_id', sp.demand_id,
        'patient_id', sp.patient_id,
        'professional_id', sp.professional_id,
        'proposal_type', sp.proposal_type,
        'status', sp.status,
        'expires_at', sp.expires_at,
        'confirmed_slot_id', sp.confirmed_slot_id,
        'rejection_reason', sp.rejection_reason,
        'created_at', sp.created_at,
        'scheduling_proposal_slots', (
          SELECT COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'id', sps.id,
                'proposal_id', sps.proposal_id,
                'starts_at', sps.starts_at,
                'ends_at', sps.ends_at,
                'sort_order', sps.sort_order
              )
              ORDER BY sps.sort_order
            ),
            '[]'::jsonb
          )
          FROM public.scheduling_proposal_slots sps
          WHERE sps.proposal_id = sp.id
        ),
        'scheduling_messages', (
          SELECT COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'id', sm.id,
                'proposal_id', sm.proposal_id,
                'sender_role', sm.sender_role,
                'template_code', sm.template_code,
                'body', sm.body,
                'created_at', sm.created_at
              )
              ORDER BY sm.created_at
            ),
            '[]'::jsonb
          )
          FROM public.scheduling_messages sm
          WHERE sm.proposal_id = sp.id
        )
      ) AS row_data
      FROM public.scheduling_proposals sp
      WHERE sp.patient_id = ANY (v_patient_ids)
        AND sp.status = 'pendente'
        AND (p_demand_id IS NULL OR sp.demand_id = p_demand_id)
    ) sub
  ), '[]'::jsonb);
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
    proposal_type,
    status,
    expires_at
  ) VALUES (
    p_demand_id,
    v_demand.patient_id,
    v_pp_id,
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

  SELECT p.full_name INTO v_patient_name FROM public.patients p WHERE p.id = v_demand.patient_id;

  INSERT INTO public.scheduling_messages (proposal_id, sender_role, template_code, body)
  VALUES (
    v_proposal_id,
    'sistema',
    'pp_slots_offered',
    'Seu profissional parceiro enviou opções de horário para o atendimento. Escolha a que melhor se encaixa na sua rotina.'
  );

  PERFORM public.push_scheduling_proposal_to_patient_chat(v_demand.patient_id, v_proposal_id);

  PERFORM public.notify_patient_responsibles(
    v_demand.patient_id,
    'agendamento'::public.notification_type,
    'Horários disponíveis para atendimento',
    coalesce(v_patient_name, 'Paciente') || ': escolha um horário proposto pelo profissional.',
    jsonb_build_object(
      'proposal_id', v_proposal_id,
      'demand_id', p_demand_id,
      'href', '/paciente/chat?proposal=' || v_proposal_id::text
    )
  );

  RETURN jsonb_build_object('proposal_id', v_proposal_id, 'status', 'pendente');
END;
$$;

GRANT EXECUTE ON FUNCTION public.patient_list_pending_scheduling_proposals(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.push_scheduling_proposal_to_patient_chat(uuid, uuid) TO service_role;

-- Backfill: propostas pendentes sem mensagem no chat
DO $$
DECLARE
  v_row record;
BEGIN
  FOR v_row IN
    SELECT sp.id AS proposal_id, sp.patient_id
    FROM public.scheduling_proposals sp
    WHERE sp.status = 'pendente'
      AND sp.proposal_type <> 'remarcacao'
      AND NOT EXISTS (
        SELECT 1
        FROM public.patient_chat_messages pcm
        WHERE pcm.template_code = 'pp_slots_offered'
          AND pcm.payload ->> 'proposal_id' = sp.id::text
      )
  LOOP
    PERFORM public.push_scheduling_proposal_to_patient_chat(v_row.patient_id, v_row.proposal_id);
  END LOOP;
END $$;
