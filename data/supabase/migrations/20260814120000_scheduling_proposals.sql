-- LarsanaCare: propostas de agendamento, mensagens estruturadas e recorrência
-- Migration: 20260814120000_scheduling_proposals

ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'agendamento';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'remarcacao';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'agendamento_confirmado';

CREATE TYPE public.scheduling_proposal_status AS ENUM (
  'pendente',
  'confirmado',
  'recusado',
  'expirado'
);

CREATE TYPE public.scheduling_proposal_type AS ENUM (
  'avaliacao',
  'continuidade',
  'remarcacao'
);

CREATE TABLE public.scheduling_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id uuid REFERENCES public.demands (id) ON DELETE SET NULL,
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE RESTRICT,
  professional_id uuid NOT NULL REFERENCES public.professionals (id) ON DELETE RESTRICT,
  cycle_id uuid REFERENCES public.care_cycles (id) ON DELETE SET NULL,
  session_id uuid REFERENCES public.care_sessions (id) ON DELETE SET NULL,
  proposal_type public.scheduling_proposal_type NOT NULL,
  status public.scheduling_proposal_status NOT NULL DEFAULT 'pendente',
  expires_at timestamptz,
  confirmed_slot_id uuid,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_scheduling_proposals_patient ON public.scheduling_proposals (patient_id, status);
CREATE INDEX idx_scheduling_proposals_pp ON public.scheduling_proposals (professional_id, status);
CREATE INDEX idx_scheduling_proposals_demand ON public.scheduling_proposals (demand_id);

CREATE TABLE public.scheduling_proposal_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.scheduling_proposals (id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_scheduling_proposal_slots_proposal ON public.scheduling_proposal_slots (proposal_id, sort_order);

CREATE TABLE public.scheduling_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.scheduling_proposals (id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('pp', 'paciente', 'sistema')),
  template_code text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_scheduling_messages_proposal ON public.scheduling_messages (proposal_id, created_at);

ALTER TABLE public.scheduling_proposals
  ADD CONSTRAINT scheduling_proposals_confirmed_slot_fkey
  FOREIGN KEY (confirmed_slot_id) REFERENCES public.scheduling_proposal_slots (id) ON DELETE SET NULL;

-- ===== Helpers =====

CREATE OR REPLACE FUNCTION public.notify_patient_responsibles(
  p_patient_id uuid,
  p_type public.notification_type,
  p_title text,
  p_body text,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, payload)
  SELECT pr.user_id, p_type, p_title, p_body, p_payload
  FROM public.patient_responsibles pr
  WHERE pr.patient_id = p_patient_id
    AND pr.user_id IS NOT NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_professional_user(
  p_professional_id uuid,
  p_type public.notification_type,
  p_title text,
  p_body text,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT p.user_id INTO v_user_id
  FROM public.professionals p
  WHERE p.id = p_professional_id;

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, payload)
    VALUES (v_user_id, p_type, p_title, p_body, p_payload);
  END IF;
END;
$$;

-- ===== Replicate session schedule =====

CREATE OR REPLACE FUNCTION public.replicate_session_schedule(
  p_cycle_id uuid,
  p_anchor_session_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_anchor public.care_sessions%ROWTYPE;
  v_cycle public.care_cycles%ROWTYPE;
  v_weekly_freq integer;
  v_days_between numeric;
  v_next_at timestamptz;
  v_i integer;
  v_updated integer := 0;
BEGIN
  SELECT * INTO v_anchor
  FROM public.care_sessions
  WHERE id = p_anchor_session_id
    AND cycle_id = p_cycle_id;

  IF NOT FOUND OR v_anchor.scheduled_at IS NULL THEN
    RAISE EXCEPTION 'Sessão âncora não encontrada ou sem horário';
  END IF;

  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = p_cycle_id;

  SELECT COALESCE(
    LEAST(3, GREATEST(1, ROUND(p.suggested_weekly_frequency)::integer)),
    2
  ) INTO v_weekly_freq
  FROM public.patients p
  WHERE p.id = v_cycle.patient_id;

  v_days_between := 7.0 / v_weekly_freq;

  FOR v_i IN 1..v_cycle.session_count LOOP
    IF EXISTS (
      SELECT 1 FROM public.care_sessions cs
      WHERE cs.cycle_id = p_cycle_id AND cs.session_number = v_i
    ) THEN
      IF v_i > v_anchor.session_number THEN
        v_next_at := v_anchor.scheduled_at + ((v_i - v_anchor.session_number) * v_days_between) * interval '1 day';

        UPDATE public.care_sessions
        SET
          scheduled_at = v_next_at,
          status = CASE WHEN status = 'remarcada' THEN status ELSE 'prevista'::public.session_status END,
          updated_at = now()
        WHERE cycle_id = p_cycle_id
          AND session_number = v_i
          AND (scheduled_at IS NULL OR scheduled_at <> v_next_at);

        IF FOUND THEN
          v_updated := v_updated + 1;
        END IF;
      END IF;
    ELSE
      v_next_at := v_anchor.scheduled_at + ((v_i - v_anchor.session_number) * v_days_between) * interval '1 day';

      INSERT INTO public.care_sessions (
        cycle_id, session_number, status, professional_id, scheduled_at
      ) VALUES (
        p_cycle_id,
        v_i,
        'prevista'::public.session_status,
        v_cycle.assigned_professional_id,
        v_next_at
      );
      v_updated := v_updated + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'cycle_id', p_cycle_id,
    'anchor_session_id', p_anchor_session_id,
    'sessions_updated', v_updated
  );
END;
$$;

-- ===== Submit PP availability =====

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

  PERFORM public.notify_patient_responsibles(
    v_demand.patient_id,
    'agendamento'::public.notification_type,
    'Horários disponíveis para atendimento',
    coalesce(v_patient_name, 'Paciente') || ': escolha um horário proposto pelo profissional.',
    jsonb_build_object('proposal_id', v_proposal_id, 'demand_id', p_demand_id)
  );

  RETURN jsonb_build_object('proposal_id', v_proposal_id, 'status', 'pendente');
END;
$$;

-- ===== Patient confirm / reject slot =====

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
      SET scheduled_at = v_slot.starts_at, status = 'prevista'::public.session_status, updated_at = now()
      WHERE id = v_session_id;

      PERFORM public.replicate_session_schedule(v_cycle.id, v_session_id);
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

      PERFORM public.replicate_session_schedule(v_cycle.id, v_session_id);
    END IF;
  END IF;

  SELECT p.full_name INTO v_patient_name FROM public.patients p WHERE p.id = v_proposal.patient_id;

  PERFORM public.notify_professional_user(
    v_proposal.professional_id,
    'agendamento_confirmado'::public.notification_type,
    'Horário confirmado pelo paciente',
    coalesce(v_patient_name, 'Paciente') || ' confirmou o horário de atendimento.',
    jsonb_build_object('proposal_id', p_proposal_id, 'slot_id', p_slot_id)
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

-- ===== PP drag reschedule =====

CREATE OR REPLACE FUNCTION public.pp_reschedule_session(
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
  v_patient_name text;
  v_result jsonb;
BEGIN
  SELECT p.id INTO v_pp_id FROM public.professionals p WHERE p.user_id = auth.uid();

  IF v_pp_id IS NULL THEN
    RAISE EXCEPTION 'Profissional não encontrado';
  END IF;

  SELECT * INTO v_session FROM public.care_sessions WHERE id = p_session_id FOR UPDATE;

  IF NOT FOUND OR v_session.professional_id <> v_pp_id THEN
    RAISE EXCEPTION 'Sessão não encontrada ou não alocada a você';
  END IF;

  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = v_session.cycle_id;

  v_result := public.register_reschedule(
    p_session_id,
    'horario'::public.reschedule_reason_category,
    'Remarcado pelo profissional na agenda',
    true,
    p_new_scheduled_at
  );

  SELECT p.full_name INTO v_patient_name FROM public.patients p WHERE p.id = v_cycle.patient_id;

  PERFORM public.notify_patient_responsibles(
    v_cycle.patient_id,
    'remarcacao'::public.notification_type,
    'Atendimento remarcado',
    coalesce(v_patient_name, 'Paciente') || ': seu atendimento foi remarcado para '
      || to_char(p_new_scheduled_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') || '.',
    jsonb_build_object('session_id', p_session_id, 'new_scheduled_at', p_new_scheduled_at)
  );

  RETURN v_result || jsonb_build_object('notified', true);
END;
$$;

-- ===== RLS =====

ALTER TABLE public.scheduling_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduling_proposal_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduling_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY scheduling_proposals_pp ON public.scheduling_proposals
  FOR ALL
  USING (
    professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
    OR public.is_staff()
  );

CREATE POLICY scheduling_proposals_patient ON public.scheduling_proposals
  FOR SELECT
  USING (patient_id = ANY (public.current_patient_ids()));

CREATE POLICY scheduling_proposals_patient_update ON public.scheduling_proposals
  FOR UPDATE
  USING (patient_id = ANY (public.current_patient_ids()))
  WITH CHECK (patient_id = ANY (public.current_patient_ids()));

CREATE POLICY scheduling_slots_access ON public.scheduling_proposal_slots
  FOR SELECT
  USING (
    proposal_id IN (
      SELECT sp.id FROM public.scheduling_proposals sp
      WHERE sp.professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
        OR sp.patient_id = ANY (public.current_patient_ids())
        OR public.is_staff()
    )
  );

CREATE POLICY scheduling_messages_access ON public.scheduling_messages
  FOR SELECT
  USING (
    proposal_id IN (
      SELECT sp.id FROM public.scheduling_proposals sp
      WHERE sp.professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
        OR sp.patient_id = ANY (public.current_patient_ids())
        OR public.is_staff()
    )
  );

REVOKE ALL ON FUNCTION public.notify_patient_responsibles(uuid, public.notification_type, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_professional_user(uuid, public.notification_type, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.replicate_session_schedule(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_pp_availability(uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.patient_confirm_slot(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.patient_reject_slot(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pp_reschedule_session(uuid, timestamptz) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.replicate_session_schedule(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_pp_availability(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.patient_confirm_slot(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.patient_reject_slot(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pp_reschedule_session(uuid, timestamptz) TO authenticated;
