-- Substituição deixa de designar um profissional sozinha.
-- O aceite do paciente abre uma demanda do tipo substituicao.
-- Se ninguém assumir até o horário, a sessão permanece com o responsável.

ALTER TABLE public.demands
  ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.care_sessions (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reschedule_request_id uuid REFERENCES public.session_reschedule_requests (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.demands.session_id IS
  'Sessão coberta por uma demanda de substituição. O horário não é renegociado.';

COMMENT ON COLUMN public.demands.reschedule_request_id IS
  'Pedido de remarcação que originou a busca de substituto.';

CREATE INDEX IF NOT EXISTS idx_demands_session
  ON public.demands (session_id)
  WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_demands_reschedule_request
  ON public.demands (reschedule_request_id)
  WHERE reschedule_request_id IS NOT NULL;

-- Paciente em tratamento já tem demanda ativa de avaliação/continuidade.
-- A busca de um atendimento pontual pode coexistir com ela.
DROP INDEX IF EXISTS public.idx_demands_one_active_per_patient;

CREATE UNIQUE INDEX idx_demands_one_active_per_patient
  ON public.demands (patient_id)
  WHERE status IN ('aberta', 'alocada')
    AND demand_type IS DISTINCT FROM 'substituicao';

CREATE UNIQUE INDEX IF NOT EXISTS idx_demands_one_open_substitution_per_request
  ON public.demands (reschedule_request_id)
  WHERE demand_type = 'substituicao'
    AND status IN ('aberta', 'alocada')
    AND reschedule_request_id IS NOT NULL;

COMMENT ON COLUMN public.demands.demand_type IS
  'avaliacao = primeiro contato; continuidade = troca de responsável; substituicao = um atendimento já marcado.';

CREATE OR REPLACE FUNCTION public.set_demand_type_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.demand_type = 'substituicao' THEN
    RETURN NEW;
  END IF;

  NEW.demand_type := public.resolve_demand_type(NEW.patient_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.pp_can_see_demand(p_professional_id uuid, p_demand_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category public.pp_technical_category;
  v_status public.cardiorrespiratory_habilitation_status;
BEGIN
  IF NOT public.pp_is_operational_regular(p_professional_id) THEN
    RETURN false;
  END IF;

  -- O responsável da sessão não assume a própria substituição.
  IF EXISTS (
    SELECT 1
    FROM public.demands d
    JOIN public.session_reschedule_requests srr ON srr.id = d.reschedule_request_id
    WHERE d.id = p_demand_id
      AND d.demand_type = 'substituicao'
      AND (
        srr.responsible_professional_id = p_professional_id
        OR srr.original_professional_id = p_professional_id
      )
  ) THEN
    RETURN false;
  END IF;

  v_category := public.resolve_demand_technical_category(p_demand_id);

  IF v_category IS NULL OR v_category <> 'cardiorrespiratoria' THEN
    RETURN true;
  END IF;

  SELECT p.cardiorrespiratory_habilitation_status INTO v_status
  FROM public.professionals p
  WHERE p.id = p_professional_id;

  RETURN v_status = 'habilitado';
END;
$$;

DROP POLICY IF EXISTS demands_pp_read ON public.demands;

CREATE POLICY demands_pp_read ON public.demands
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() = 'pp'
    AND status = 'aberta'
    AND EXISTS (
      SELECT 1
      FROM public.professionals p
      WHERE p.user_id = auth.uid()
        AND public.pp_can_see_demand(p.id, demands.id)
    )
    AND (
      demands.demand_type IS DISTINCT FROM 'substituicao'
      OR NOT EXISTS (
        SELECT 1
        FROM public.care_sessions cs
        WHERE cs.id = demands.session_id
          AND cs.scheduled_at <= now()
      )
    )
  );

CREATE OR REPLACE FUNCTION public.push_substitute_notice_to_patient_chat(
  p_patient_id uuid,
  p_request_id uuid,
  p_session_id uuid,
  p_body text,
  p_template_code text
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

    IF EXISTS (
      SELECT 1
      FROM public.patient_chat_messages pcm
      WHERE pcm.thread_id = v_thread_id
        AND pcm.template_code = p_template_code
        AND pcm.payload ->> 'request_id' = p_request_id::text
    ) THEN
      CONTINUE;
    END IF;

    INSERT INTO public.patient_chat_messages (thread_id, sender_role, template_code, body, payload)
    VALUES (
      v_thread_id,
      'sara',
      p_template_code,
      p_body,
      jsonb_build_object(
        'request_id', p_request_id,
        'session_id', p_session_id
      )
    );
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.push_substitute_notice_to_patient_chat(uuid, uuid, uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.push_substitute_notice_to_patient_chat(uuid, uuid, uuid, text, text) TO service_role;

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

  SELECT p.full_name INTO v_pp_name
  FROM public.professionals p
  WHERE p.id = v_request.responsible_professional_id;

  v_scheduled_label := to_char(
    v_request.original_scheduled_at AT TIME ZONE 'America/Sao_Paulo',
    'DD/MM/YYYY "às" HH24:MI'
  );

  v_body := format(
    'Podemos buscar um fisioterapeuta substituto para o atendimento de %s. Se você aceitar e ninguém assumir até esse horário, o atendimento volta para %s. O que prefere?',
    v_scheduled_label,
    coalesce(v_pp_name, 'o profissional responsável')
  );

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

  UPDATE public.session_reschedule_requests
  SET
    status = 'sub_offered',
    substitute_professional_id = NULL,
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
  v_patient public.patients%ROWTYPE;
  v_patient_name text;
  v_pp_name text;
  v_address_id uuid;
  v_region_id uuid;
  v_demand_id uuid;
  v_scheduled_label text;
  v_body text;
BEGIN
  SELECT * INTO v_request
  FROM public.session_reschedule_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitação não encontrada';
  END IF;

  IF NOT (v_request.patient_id = ANY (public.current_patient_ids())) AND NOT public.is_staff() THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  SELECT * INTO v_session
  FROM public.care_sessions
  WHERE id = v_request.session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sessão não encontrada';
  END IF;

  IF p_accept AND v_request.status = 'sub_accepted' THEN
    SELECT d.id INTO v_demand_id
    FROM public.demands d
    WHERE d.reschedule_request_id = p_request_id
      AND d.demand_type = 'substituicao'
      AND d.status = 'aberta'
    ORDER BY d.created_at DESC
    LIMIT 1;

    IF v_demand_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'status', 'sub_accepted',
        'demand_id', v_demand_id,
        'session_id', v_session.id
      );
    END IF;
  END IF;

  IF v_request.status <> 'sub_offered' THEN
    RAISE EXCEPTION 'Oferta SUB não está ativa';
  END IF;

  IF NOT p_accept THEN
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
      jsonb_build_object(
        'session_id', v_session.id,
        'request_id', p_request_id,
        'href', '/profissional/agenda'
      )
    );

    RETURN jsonb_build_object('status', 'pp_reschedule_window', 'request_id', p_request_id);
  END IF;

  IF v_session.scheduled_at IS NULL OR v_session.scheduled_at <= now() THEN
    RAISE EXCEPTION 'O horário deste atendimento já passou e ele permanece com o profissional responsável';
  END IF;

  IF v_session.status NOT IN ('prevista', 'remarcada') THEN
    RAISE EXCEPTION 'Esta sessão não está disponível para substituição';
  END IF;

  SELECT * INTO v_patient FROM public.patients WHERE id = v_request.patient_id;
  v_patient_name := v_patient.full_name;

  SELECT p.full_name INTO v_pp_name
  FROM public.professionals p
  WHERE p.id = v_request.responsible_professional_id;

  SELECT pa.id INTO v_address_id
  FROM public.patient_addresses pa
  WHERE pa.patient_id = v_request.patient_id
  ORDER BY pa.is_primary DESC, pa.created_at ASC
  LIMIT 1;

  SELECT COALESCE(cc.region_id, v_patient.region_id) INTO v_region_id
  FROM public.care_cycles cc
  WHERE cc.id = v_request.cycle_id;

  v_scheduled_label := to_char(
    v_session.scheduled_at AT TIME ZONE 'America/Sao_Paulo',
    'DD/MM/YYYY "às" HH24:MI'
  );

  SELECT d.id INTO v_demand_id
  FROM public.demands d
  WHERE d.reschedule_request_id = p_request_id
    AND d.demand_type = 'substituicao'
    AND d.status = 'aberta'
  LIMIT 1;

  IF v_demand_id IS NULL THEN
    INSERT INTO public.demands (
      patient_id,
      address_id,
      region_id,
      status,
      demand_type,
      request_source,
      technical_category,
      cycle_id,
      session_id,
      reschedule_request_id,
      notes
    ) VALUES (
      v_request.patient_id,
      v_address_id,
      v_region_id,
      'aberta',
      'substituicao',
      'paciente_app',
      v_patient.technical_category,
      v_request.cycle_id,
      v_session.id,
      p_request_id,
      format(
        'Substituição do atendimento de %s. O horário já está definido. Se ninguém assumir até esse horário, a sessão volta para %s.',
        v_scheduled_label,
        coalesce(v_pp_name, 'o profissional responsável')
      )
    )
    RETURNING id INTO v_demand_id;
  END IF;

  UPDATE public.session_reschedule_requests
  SET
    status = 'sub_accepted',
    substitute_professional_id = NULL,
    original_professional_id = COALESCE(original_professional_id, v_session.professional_id),
    updated_at = now()
  WHERE id = p_request_id;

  PERFORM public.push_patient_sub_choice_to_chat(
    v_request.patient_id,
    p_request_id,
    'Aceito fisioterapeuta substituto',
    'patient_accepted_sub',
    jsonb_build_object('session_id', v_session.id, 'demand_id', v_demand_id)
  );

  v_body := format(
    'Estou buscando um fisioterapeuta substituto para o atendimento de %s. Se ninguém assumir até esse horário, o atendimento volta para %s.',
    v_scheduled_label,
    coalesce(v_pp_name, 'o profissional responsável')
  );

  PERFORM public.push_substitute_notice_to_patient_chat(
    v_request.patient_id,
    p_request_id,
    v_session.id,
    v_body,
    'sub_search'
  );

  PERFORM public.notify_professional_user(
    v_request.responsible_professional_id,
    'sub_oferta'::public.notification_type,
    'Paciente aceitou substituto',
    coalesce(v_patient_name, 'Paciente')
      || ' aceitou um substituto em '
      || v_scheduled_label
      || '. A vaga está na tela de demandas dos outros profissionais. Se ninguém assumir até o horário, o atendimento continua com você.',
    jsonb_build_object(
      'session_id', v_session.id,
      'request_id', p_request_id,
      'href', '/profissional/agenda'
    )
  );

  RETURN jsonb_build_object(
    'status', 'sub_accepted',
    'demand_id', v_demand_id,
    'session_id', v_session.id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_demand(p_demand_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pp_id uuid;
  v_demand public.demands%ROWTYPE;
  v_patient_name text;
  v_assessment_repasse_id uuid;
  v_session public.care_sessions%ROWTYPE;
  v_request public.session_reschedule_requests%ROWTYPE;
  v_scheduled_label text;
  v_sub_name text;
BEGIN
  v_pp_id := public.current_professional_id();
  IF v_pp_id IS NULL THEN
    RAISE EXCEPTION 'Profissional não encontrado';
  END IF;

  IF NOT public.pp_is_operational_regular(v_pp_id) THEN
    RAISE EXCEPTION 'Credenciamento inativo ou incompleto';
  END IF;

  IF NOT public.pp_can_see_demand(v_pp_id, p_demand_id) THEN
    RAISE EXCEPTION 'Você não está habilitado para demandas Cardiorrespiratórias';
  END IF;

  SELECT * INTO v_demand
  FROM public.demands
  WHERE id = p_demand_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demanda não encontrada';
  END IF;

  IF v_demand.status <> 'aberta' THEN
    RAISE EXCEPTION 'Demanda não está aberta';
  END IF;

  IF v_demand.demand_type = 'substituicao' THEN
    IF v_demand.session_id IS NULL OR v_demand.reschedule_request_id IS NULL THEN
      RAISE EXCEPTION 'Demanda de substituição incompleta';
    END IF;

    SELECT * INTO v_request
    FROM public.session_reschedule_requests
    WHERE id = v_demand.reschedule_request_id
    FOR UPDATE;

    IF NOT FOUND OR v_request.status <> 'sub_accepted' THEN
      RAISE EXCEPTION 'A busca de substituto não está mais aberta';
    END IF;

    SELECT * INTO v_session
    FROM public.care_sessions
    WHERE id = v_demand.session_id
    FOR UPDATE;

    IF NOT FOUND OR v_session.scheduled_at IS NULL OR v_session.scheduled_at <= now() THEN
      RAISE EXCEPTION 'O horário deste atendimento já passou';
    END IF;

    IF v_session.status NOT IN ('prevista', 'remarcada') THEN
      RAISE EXCEPTION 'Esta sessão não está mais disponível para substituição';
    END IF;

    IF v_pp_id = v_request.responsible_professional_id
      OR v_pp_id = v_session.professional_id
      OR v_pp_id = v_request.original_professional_id
    THEN
      RAISE EXCEPTION 'O profissional responsável não assume a própria substituição';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.care_sessions cs
      WHERE cs.professional_id = v_pp_id
        AND cs.id <> v_session.id
        AND cs.status IN ('prevista', 'remarcada')
        AND cs.scheduled_at IS NOT NULL
        AND cs.scheduled_at < v_session.scheduled_at + interval '1 hour'
        AND cs.scheduled_at + interval '1 hour' > v_session.scheduled_at
    ) THEN
      RAISE EXCEPTION 'Você já tem atendimento neste horário';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.demand_responses dr
      WHERE dr.demand_id = p_demand_id
        AND dr.professional_id = v_pp_id
    ) THEN
      RAISE EXCEPTION 'Você já respondeu esta demanda';
    END IF;

    INSERT INTO public.demand_responses (demand_id, professional_id, response)
    VALUES (p_demand_id, v_pp_id, 'accepted');

    UPDATE public.demands
    SET status = 'alocada', assigned_professional_id = v_pp_id, updated_at = now()
    WHERE id = p_demand_id;

    UPDATE public.care_sessions
    SET professional_id = v_pp_id, updated_at = now()
    WHERE id = v_session.id;

    UPDATE public.session_reschedule_requests
    SET
      status = 'completed',
      substitute_professional_id = v_pp_id,
      original_professional_id = COALESCE(original_professional_id, v_request.responsible_professional_id),
      updated_at = now()
    WHERE id = v_request.id;

    SELECT p.full_name INTO v_patient_name FROM public.patients p WHERE p.id = v_demand.patient_id;
    SELECT p.full_name INTO v_sub_name FROM public.professionals p WHERE p.id = v_pp_id;

    v_scheduled_label := to_char(
      v_session.scheduled_at AT TIME ZONE 'America/Sao_Paulo',
      'DD/MM/YYYY "às" HH24:MI'
    );

    PERFORM public.push_sub_confirmation_to_patient_chat(
      v_demand.patient_id,
      v_request.id,
      v_session.id,
      v_session.scheduled_at,
      true
    );

    PERFORM public.notify_professional_user(
      v_pp_id,
      'sub_confirmado'::public.notification_type,
      'Atendimento como substituto',
      coalesce(v_patient_name, 'Paciente') || ': você assumiu o atendimento de ' || v_scheduled_label || '.',
      jsonb_build_object(
        'session_id', v_session.id,
        'request_id', v_request.id,
        'href', '/profissional/agenda'
      )
    );

    PERFORM public.notify_professional_user(
      v_request.responsible_professional_id,
      'sub_confirmado'::public.notification_type,
      'Substituto assumiu o atendimento',
      coalesce(v_sub_name, 'Um profissional')
        || ' assumiu o atendimento de '
        || coalesce(v_patient_name, 'paciente')
        || ' em '
        || v_scheduled_label
        || '.',
      jsonb_build_object(
        'session_id', v_session.id,
        'request_id', v_request.id,
        'href', '/profissional/agenda'
      )
    );

    INSERT INTO public.operational_alerts (
      alert_type, entity_type, entity_id, severity, title, message
    ) VALUES (
      'demanda_alocada', 'demand', p_demand_id, 'info',
      'Substituição assumida',
      coalesce(v_patient_name, 'Paciente') || ' — atendimento de ' || v_scheduled_label || ' assumido por substituto.'
    );

    RETURN jsonb_build_object(
      'demand_id', p_demand_id,
      'patient_id', v_demand.patient_id,
      'demand_type', v_demand.demand_type,
      'session_id', v_session.id
    );
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.demand_responses dr
    WHERE dr.demand_id = p_demand_id
      AND dr.professional_id = v_pp_id
      AND dr.response = 'accepted'
  ) THEN
    IF v_demand.status = 'alocada' AND v_demand.assigned_professional_id = v_pp_id THEN
      RETURN jsonb_build_object(
        'demand_id', p_demand_id,
        'patient_id', v_demand.patient_id,
        'demand_type', v_demand.demand_type
      );
    END IF;

    UPDATE public.demands
    SET status = 'alocada', assigned_professional_id = v_pp_id, updated_at = now()
    WHERE id = p_demand_id;

    UPDATE public.patients
    SET allocated_professional_id = v_pp_id, updated_at = now()
    WHERE id = v_demand.patient_id;

    v_assessment_repasse_id := public.ensure_assessment_pp_repasse(p_demand_id, v_pp_id);

    RETURN jsonb_build_object(
      'demand_id', p_demand_id,
      'patient_id', v_demand.patient_id,
      'demand_type', v_demand.demand_type,
      'assessment_repasse_id', v_assessment_repasse_id
    );
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.demand_responses dr
    WHERE dr.demand_id = p_demand_id AND dr.professional_id = v_pp_id
  ) THEN
    RAISE EXCEPTION 'Você já respondeu esta demanda';
  END IF;

  INSERT INTO public.demand_responses (demand_id, professional_id, response)
  VALUES (p_demand_id, v_pp_id, 'accepted');

  UPDATE public.demands
  SET status = 'alocada', assigned_professional_id = v_pp_id, updated_at = now()
  WHERE id = p_demand_id;

  UPDATE public.patients
  SET allocated_professional_id = v_pp_id, updated_at = now()
  WHERE id = v_demand.patient_id;

  v_assessment_repasse_id := public.ensure_assessment_pp_repasse(p_demand_id, v_pp_id);

  SELECT p.full_name INTO v_patient_name FROM public.patients p WHERE p.id = v_demand.patient_id;

  INSERT INTO public.operational_alerts (
    alert_type, entity_type, entity_id, severity, title, message
  ) VALUES (
    'demanda_alocada', 'demand', p_demand_id, 'info',
    'Demanda alocada a profissional',
    coalesce(v_patient_name, 'Paciente') || ' — demanda assumida pelo profissional parceiro.'
  );

  RETURN jsonb_build_object(
    'demand_id', p_demand_id,
    'patient_id', v_demand.patient_id,
    'demand_type', v_demand.demand_type,
    'assessment_repasse_id', v_assessment_repasse_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.revert_unclaimed_substitute_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row record;
  v_owner uuid;
  v_owner_name text;
  v_scheduled_label text;
  v_count integer := 0;
BEGIN
  FOR v_row IN
    SELECT
      d.id AS demand_id,
      srr.id AS request_id,
      srr.session_id,
      srr.patient_id,
      srr.responsible_professional_id,
      srr.original_professional_id,
      srr.original_scheduled_at
    FROM public.demands d
    JOIN public.session_reschedule_requests srr ON srr.id = d.reschedule_request_id
    JOIN public.care_sessions cs ON cs.id = d.session_id
    WHERE d.demand_type = 'substituicao'
      AND d.status = 'aberta'
      AND srr.status = 'sub_accepted'
      AND cs.scheduled_at IS NOT NULL
      AND cs.scheduled_at <= now()
    ORDER BY d.id
    FOR UPDATE OF d SKIP LOCKED
  LOOP
    v_owner := coalesce(v_row.original_professional_id, v_row.responsible_professional_id);

    UPDATE public.care_sessions
    SET professional_id = v_owner, updated_at = now()
    WHERE id = v_row.session_id
      AND professional_id IS DISTINCT FROM v_owner;

    UPDATE public.demands
    SET status = 'cancelada', updated_at = now()
    WHERE id = v_row.demand_id
      AND status = 'aberta';

    UPDATE public.session_reschedule_requests
    SET status = 'expired', substitute_professional_id = NULL, updated_at = now()
    WHERE id = v_row.request_id
      AND status = 'sub_accepted';

    SELECT p.full_name INTO v_owner_name
    FROM public.professionals p
    WHERE p.id = v_owner;

    v_scheduled_label := to_char(
      v_row.original_scheduled_at AT TIME ZONE 'America/Sao_Paulo',
      'DD/MM/YYYY "às" HH24:MI'
    );

    PERFORM public.push_substitute_notice_to_patient_chat(
      v_row.patient_id,
      v_row.request_id,
      v_row.session_id,
      format(
        'Ninguém assumiu o atendimento de %s. Ele volta para %s.',
        v_scheduled_label,
        coalesce(v_owner_name, 'o profissional responsável')
      ),
      'sub_unclaimed'
    );

    PERFORM public.notify_professional_user(
      v_owner,
      'sub_recusado'::public.notification_type,
      'Substituição não assumida',
      'Ninguém assumiu o atendimento de ' || v_scheduled_label || '. Ele continua com você.',
      jsonb_build_object(
        'session_id', v_row.session_id,
        'request_id', v_row.request_id,
        'href', '/profissional/agenda'
      )
    );

    v_count := v_count + 1;
  END LOOP;

  FOR v_row IN
    SELECT srr.id, srr.session_id, srr.responsible_professional_id, srr.original_professional_id
    FROM public.session_reschedule_requests srr
    JOIN public.care_sessions cs ON cs.id = srr.session_id
    WHERE srr.status = 'sub_offered'
      AND cs.scheduled_at IS NOT NULL
      AND cs.scheduled_at <= now()
    FOR UPDATE OF srr SKIP LOCKED
  LOOP
    v_owner := coalesce(v_row.original_professional_id, v_row.responsible_professional_id);

    UPDATE public.care_sessions
    SET professional_id = v_owner, updated_at = now()
    WHERE id = v_row.session_id
      AND professional_id IS DISTINCT FROM v_owner;

    UPDATE public.demands
    SET status = 'cancelada', updated_at = now()
    WHERE reschedule_request_id = v_row.id
      AND demand_type = 'substituicao'
      AND status = 'aberta';

    UPDATE public.session_reschedule_requests
    SET status = 'expired', updated_at = now()
    WHERE id = v_row.id
      AND status = 'sub_offered';

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

DO $$
DECLARE
  v_job_id bigint;
BEGIN
  SELECT jobid INTO v_job_id
  FROM cron.job
  WHERE jobname = 'revert_unclaimed_substitute_sessions';

  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
  END IF;

  PERFORM cron.schedule(
    'revert_unclaimed_substitute_sessions',
    '*/5 * * * *',
    $cmd$SELECT public.revert_unclaimed_substitute_sessions();$cmd$
  );
END;
$$;

COMMENT ON FUNCTION public.revert_unclaimed_substitute_sessions() IS
  'Cancela a demanda de substituição e devolve a sessão ao responsável quando o horário chega sem aceite. Também expira ofertas que o paciente não respondeu.';
