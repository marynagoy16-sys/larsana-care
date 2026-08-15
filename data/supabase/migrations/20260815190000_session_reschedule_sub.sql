-- LarsanaCare: remarcação 12h/14d, atestado, aceite paciente e fluxo SUB
-- Migration: 20260815190000_session_reschedule_sub

ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'remarcacao_pendente_aceite';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'sub_oferta';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'sub_confirmado';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'sub_recusado';

ALTER TYPE public.financial_ledger_entry_type ADD VALUE IF NOT EXISTS 'session_late_reschedule_charge';
ALTER TYPE public.financial_ledger_entry_type ADD VALUE IF NOT EXISTS 'session_late_reschedule_pp';
ALTER TYPE public.financial_ledger_entry_type ADD VALUE IF NOT EXISTS 'session_late_reschedule_larsana';

ALTER TYPE public.patient_document_type ADD VALUE IF NOT EXISTS 'ATESTADO_REMARCACAO';

ALTER TABLE public.platform_operational_settings
  ADD COLUMN IF NOT EXISTS reschedule_max_days_ahead integer NOT NULL DEFAULT 14,
  ADD COLUMN IF NOT EXISTS reschedule_requires_same_pp_for_patient boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS late_reschedule_requires_certificate boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS late_reschedule_partial_percent numeric(5, 2) NOT NULL DEFAULT 50;

UPDATE public.platform_operational_settings
SET
  cancellation_min_hours_notice = 12,
  reschedule_max_days_ahead = 14,
  late_reschedule_partial_percent = 50,
  updated_at = now()
WHERE cancellation_min_hours_notice < 12;

ALTER TABLE public.session_adjustments
  ADD COLUMN IF NOT EXISTS family_charge_cents integer NOT NULL DEFAULT 0 CHECK (family_charge_cents >= 0);

CREATE TYPE public.reschedule_initiated_by AS ENUM ('paciente', 'pp', 'staff');

CREATE TYPE public.reschedule_window_type AS ENUM ('on_time', 'late');

CREATE TYPE public.reschedule_request_status AS ENUM (
  'pending_patient',
  'patient_accepted',
  'patient_rejected',
  'sub_offered',
  'sub_accepted',
  'sub_rejected',
  'pp_reschedule_window',
  'completed',
  'expired',
  'cancelled'
);

CREATE TABLE public.session_reschedule_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.care_sessions (id) ON DELETE CASCADE,
  cycle_id uuid NOT NULL REFERENCES public.care_cycles (id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  responsible_professional_id uuid NOT NULL REFERENCES public.professionals (id) ON DELETE RESTRICT,
  initiated_by public.reschedule_initiated_by NOT NULL,
  window_type public.reschedule_window_type NOT NULL,
  status public.reschedule_request_status NOT NULL DEFAULT 'pending_patient',
  original_scheduled_at timestamptz NOT NULL,
  proposed_scheduled_at timestamptz,
  reschedule_deadline timestamptz NOT NULL,
  scheduling_proposal_id uuid REFERENCES public.scheduling_proposals (id) ON DELETE SET NULL,
  substitute_professional_id uuid REFERENCES public.professionals (id) ON DELETE SET NULL,
  original_professional_id uuid REFERENCES public.professionals (id) ON DELETE SET NULL,
  certificate_storage_path text,
  session_adjustment_id uuid REFERENCES public.session_adjustments (id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_session_reschedule_requests_session ON public.session_reschedule_requests (session_id, status);
CREATE INDEX idx_session_reschedule_requests_patient ON public.session_reschedule_requests (patient_id, status);
CREATE INDEX idx_session_reschedule_requests_pp ON public.session_reschedule_requests (responsible_professional_id, status);

ALTER TABLE public.session_reschedule_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY session_reschedule_requests_staff ON public.session_reschedule_requests
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY session_reschedule_requests_patient ON public.session_reschedule_requests
  FOR SELECT TO authenticated
  USING (patient_id = ANY (public.current_patient_ids()));

CREATE POLICY session_reschedule_requests_pp ON public.session_reschedule_requests
  FOR SELECT TO authenticated
  USING (
    responsible_professional_id = public.current_professional_id()
    OR substitute_professional_id = public.current_professional_id()
  );

-- ===== Helpers =====

CREATE OR REPLACE FUNCTION public.get_operational_settings()
RETURNS public.platform_operational_settings
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.platform_operational_settings
  ORDER BY updated_at DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.session_hours_until(
  p_scheduled_at timestamptz,
  p_reference timestamptz DEFAULT now()
)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT EXTRACT(EPOCH FROM (p_scheduled_at - p_reference)) / 3600.0;
$$;

CREATE OR REPLACE FUNCTION public.assert_reschedule_date_window(
  p_new_scheduled_at timestamptz,
  p_reference timestamptz,
  p_max_days integer
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_new_scheduled_at <= p_reference THEN
    RAISE EXCEPTION 'Nova data deve ser futura';
  END IF;

  IF p_new_scheduled_at > p_reference + make_interval(days => p_max_days) THEN
    RAISE EXCEPTION 'Nova data deve estar dentro de % dias', p_max_days;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.assert_no_active_reschedule_request(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.session_reschedule_requests r
    WHERE r.session_id = p_session_id
      AND r.status IN (
        'pending_patient',
        'sub_offered',
        'sub_accepted',
        'pp_reschedule_window'
      )
  ) THEN
    RAISE EXCEPTION 'Já existe solicitação de remarcação ativa para esta sessão';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_late_reschedule_fee(
  p_session_id uuid,
  p_reason text DEFAULT 'remarcacao_tardia_paciente'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.care_sessions%ROWTYPE;
  v_cycle public.care_cycles%ROWTYPE;
  v_settings public.platform_operational_settings%ROWTYPE;
  v_session_value integer;
  v_partial integer;
  v_partial_amt integer;
  v_pp_pct numeric;
  v_larsana_pct numeric;
  v_pp_amt integer;
  v_larsana_amt integer;
  v_adj_id uuid;
BEGIN
  SELECT * INTO v_settings FROM public.get_operational_settings();
  IF NOT FOUND THEN
    v_settings.late_reschedule_partial_percent := 50;
  END IF;

  SELECT * INTO v_session FROM public.care_sessions WHERE id = p_session_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sessão não encontrada';
  END IF;

  IF v_session.status NOT IN ('prevista', 'remarcada') THEN
    RAISE EXCEPTION 'Sessão não pode receber taxa de remarcação tardia no status: %', v_session.status;
  END IF;

  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = v_session.cycle_id FOR UPDATE;
  IF v_cycle.payment_status <> 'pago' THEN
    RAISE EXCEPTION 'Ciclo precisa estar pago para aplicar taxa de remarcação tardia';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.session_adjustments sa
    WHERE sa.session_id = p_session_id
      AND sa.reason = p_reason
  ) THEN
    SELECT sa.id INTO v_adj_id
    FROM public.session_adjustments sa
    WHERE sa.session_id = p_session_id AND sa.reason = p_reason
    LIMIT 1;
    RETURN v_adj_id;
  END IF;

  v_session_value := v_cycle.session_unit_price_cents;
  v_partial := v_settings.late_reschedule_partial_percent;
  v_partial_amt := round(v_session_value * v_partial / 100)::integer;

  SELECT r.pp_percent, r.larsana_percent INTO v_pp_pct, v_larsana_pct
  FROM public.resolve_cycle_split_percentages(v_cycle.id) r;

  v_pp_amt := round(v_partial_amt * v_pp_pct / 100)::integer;
  v_larsana_amt := v_partial_amt - v_pp_amt;

  INSERT INTO public.session_adjustments (
    cycle_id,
    session_id,
    reason,
    session_value_cents,
    partial_percent,
    refund_family_cents,
    family_charge_cents,
    pp_transfer_cents,
    larsana_cents,
    created_by
  ) VALUES (
    v_cycle.id,
    v_session.id,
    p_reason,
    v_session_value,
    v_partial,
    0,
    v_partial_amt,
    v_pp_amt,
    v_larsana_amt,
    auth.uid()
  )
  RETURNING id INTO v_adj_id;

  INSERT INTO public.financial_ledger (cycle_id, entry_type, amount_cents, metadata)
  VALUES
    (v_cycle.id, 'session_late_reschedule_charge', v_partial_amt, jsonb_build_object('session_id', v_session.id, 'adjustment_id', v_adj_id)),
    (v_cycle.id, 'session_late_reschedule_pp', v_pp_amt, jsonb_build_object('session_id', v_session.id, 'adjustment_id', v_adj_id)),
    (v_cycle.id, 'session_late_reschedule_larsana', v_larsana_amt, jsonb_build_object('session_id', v_session.id, 'adjustment_id', v_adj_id));

  RETURN v_adj_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.match_substitute_professional(
  p_session_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.care_sessions%ROWTYPE;
  v_cycle public.care_cycles%ROWTYPE;
  v_sub_id uuid;
  v_slot_start timestamptz;
  v_slot_end timestamptz;
BEGIN
  SELECT * INTO v_session FROM public.care_sessions WHERE id = p_session_id;
  IF NOT FOUND OR v_session.scheduled_at IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = v_session.cycle_id;
  v_slot_start := v_session.scheduled_at;
  v_slot_end := v_session.scheduled_at + interval '1 hour';

  SELECT p.id INTO v_sub_id
  FROM public.professionals p
  WHERE p.id <> v_session.professional_id
    AND p.credentialing_status = 'ativo'
    AND p.is_active = true
    AND NOT EXISTS (
      SELECT 1
      FROM public.care_sessions cs
      WHERE cs.professional_id = p.id
        AND cs.status IN ('prevista', 'remarcada')
        AND cs.scheduled_at IS NOT NULL
        AND cs.scheduled_at < v_slot_end
        AND cs.scheduled_at + interval '1 hour' > v_slot_start
    )
  ORDER BY p.created_at ASC
  LIMIT 1;

  RETURN v_sub_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_reschedule_request(
  p_request_id uuid,
  p_new_status public.reschedule_request_status,
  p_proposed_at timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.session_reschedule_requests
  SET
    status = p_new_status,
    proposed_scheduled_at = COALESCE(p_proposed_at, proposed_scheduled_at),
    updated_at = now()
  WHERE id = p_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_session_reschedule(
  p_session_id uuid,
  p_new_scheduled_at timestamptz,
  p_request_id uuid DEFAULT NULL,
  p_keep_professional_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.care_sessions%ROWTYPE;
  v_result jsonb;
BEGIN
  SELECT * INTO v_session FROM public.care_sessions WHERE id = p_session_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sessão não encontrada';
  END IF;

  v_result := public.register_reschedule(
    p_session_id,
    'horario'::public.reschedule_reason_category,
    'Remarcação confirmada',
    true,
    p_new_scheduled_at
  );

  IF p_keep_professional_id IS NOT NULL THEN
    UPDATE public.care_sessions
    SET professional_id = p_keep_professional_id, updated_at = now()
    WHERE id = p_session_id;
  END IF;

  IF p_request_id IS NOT NULL THEN
    PERFORM public.complete_reschedule_request(p_request_id, 'completed', p_new_scheduled_at);
  END IF;

  RETURN v_result;
END;
$$;

-- ===== PP request reschedule (>=12h proposal, <12h SUB) =====

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
        'request_id', v_request_id
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
    jsonb_build_object('session_id', p_session_id, 'request_id', v_request_id)
  );

  RETURN jsonb_build_object(
    'flow', 'sub_offer',
    'request_id', v_request_id,
    'status', 'sub_offered'
  );
END;
$$;

-- ===== Patient respond to reschedule proposal =====

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
  v_session public.care_sessions%ROWTYPE;
  v_patient_name text;
  v_sub_id uuid;
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

    RETURN jsonb_build_object('status', 'completed', 'session_id', v_proposal.session_id);
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
    jsonb_build_object('session_id', v_proposal.session_id, 'request_id', v_request.id)
  );

  RETURN jsonb_build_object('status', 'sub_offered', 'request_id', v_request.id);
END;
$$;

-- ===== Patient respond to SUB offer =====

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

  UPDATE public.session_reschedule_requests
  SET status = 'pp_reschedule_window', updated_at = now()
  WHERE id = p_request_id;

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

-- ===== Patient-initiated reschedule =====

CREATE OR REPLACE FUNCTION public.patient_request_reschedule(
  p_session_id uuid,
  p_new_scheduled_at timestamptz,
  p_certificate_storage_path text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.care_sessions%ROWTYPE;
  v_cycle public.care_cycles%ROWTYPE;
  v_settings public.platform_operational_settings%ROWTYPE;
  v_hours numeric;
  v_deadline timestamptz;
  v_request_id uuid;
  v_adj_id uuid;
  v_result jsonb;
BEGIN
  SELECT * INTO v_settings FROM public.get_operational_settings();
  IF NOT FOUND THEN
    v_settings.cancellation_min_hours_notice := 12;
    v_settings.reschedule_max_days_ahead := 14;
    v_settings.reschedule_requires_same_pp_for_patient := true;
    v_settings.late_reschedule_requires_certificate := true;
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
    RAISE EXCEPTION 'Sessão não pode ser remarcada';
  END IF;

  PERFORM public.assert_no_active_reschedule_request(p_session_id);
  PERFORM public.assert_reschedule_date_window(
    p_new_scheduled_at,
    now(),
    v_settings.reschedule_max_days_ahead
  );

  IF v_settings.reschedule_requires_same_pp_for_patient
     AND v_session.professional_id <> v_cycle.assigned_professional_id THEN
    RAISE EXCEPTION 'Remarcação do paciente deve manter o mesmo profissional responsável';
  END IF;

  v_hours := public.session_hours_until(v_session.scheduled_at);
  v_deadline := now() + make_interval(days => v_settings.reschedule_max_days_ahead);

  IF v_hours < v_settings.cancellation_min_hours_notice THEN
    IF v_settings.late_reschedule_requires_certificate
       AND (p_certificate_storage_path IS NULL OR length(trim(p_certificate_storage_path)) = 0) THEN
      RAISE EXCEPTION 'Atestado médico obrigatório para remarcação com menos de % horas de antecedência',
        v_settings.cancellation_min_hours_notice;
    END IF;

    v_adj_id := public.apply_late_reschedule_fee(p_session_id);

    INSERT INTO public.patient_documents (
      patient_id,
      document_type,
      storage_path,
      uploaded_by
    ) VALUES (
      v_cycle.patient_id,
      'ATESTADO_REMARCACAO',
      p_certificate_storage_path,
      auth.uid()
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
      certificate_storage_path,
      session_adjustment_id,
      created_by
    ) VALUES (
      p_session_id,
      v_cycle.id,
      v_cycle.patient_id,
      v_session.professional_id,
      'paciente',
      'late',
      'completed',
      v_session.scheduled_at,
      p_new_scheduled_at,
      v_deadline,
      p_certificate_storage_path,
      v_adj_id,
      auth.uid()
    )
    RETURNING id INTO v_request_id;
  ELSE
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
      'on_time',
      'completed',
      v_session.scheduled_at,
      p_new_scheduled_at,
      v_deadline,
      auth.uid()
    )
    RETURNING id INTO v_request_id;
  END IF;

  v_result := public.finalize_session_reschedule(
    p_session_id,
    p_new_scheduled_at,
    v_request_id,
    v_session.professional_id
  );

  PERFORM public.notify_professional_user(
    v_session.professional_id,
    'remarcacao'::public.notification_type,
    'Atendimento remarcado pelo paciente',
    'O paciente remarcou o atendimento para '
      || to_char(p_new_scheduled_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') || '.',
    jsonb_build_object('session_id', p_session_id, 'request_id', v_request_id)
  );

  RETURN v_result || jsonb_build_object('request_id', v_request_id, 'late_fee_applied', v_hours < v_settings.cancellation_min_hours_notice);
END;
$$;

-- ===== PP finalize after SUB rejection (within 14d window) =====

CREATE OR REPLACE FUNCTION public.pp_reschedule_after_sub_rejection(
  p_request_id uuid,
  p_new_scheduled_at timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pp_id uuid;
  v_request public.session_reschedule_requests%ROWTYPE;
  v_settings public.platform_operational_settings%ROWTYPE;
BEGIN
  SELECT p.id INTO v_pp_id FROM public.professionals p WHERE p.user_id = auth.uid();
  IF v_pp_id IS NULL THEN
    RAISE EXCEPTION 'Profissional não encontrado';
  END IF;

  SELECT * INTO v_settings FROM public.get_operational_settings();

  SELECT * INTO v_request FROM public.session_reschedule_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND OR v_request.responsible_professional_id <> v_pp_id THEN
    RAISE EXCEPTION 'Solicitação não encontrada ou não pertence a você';
  END IF;

  IF v_request.status <> 'pp_reschedule_window' THEN
    RAISE EXCEPTION 'Janela de remarcação do titular não está aberta';
  END IF;

  IF now() > v_request.reschedule_deadline THEN
    RAISE EXCEPTION 'Prazo de remarcação expirado';
  END IF;

  PERFORM public.assert_reschedule_date_window(
    p_new_scheduled_at,
    now(),
    v_settings.reschedule_max_days_ahead
  );

  RETURN public.finalize_session_reschedule(
    v_request.session_id,
    p_new_scheduled_at,
    p_request_id,
    v_pp_id
  );
END;
$$;

-- Replace pp_reschedule_session to use new flow
CREATE OR REPLACE FUNCTION public.pp_reschedule_session(
  p_session_id uuid,
  p_new_scheduled_at timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.pp_request_reschedule(p_session_id, p_new_scheduled_at);
END;
$$;

-- Grants
REVOKE ALL ON FUNCTION public.get_operational_settings() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.session_hours_until(timestamptz, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assert_reschedule_date_window(timestamptz, timestamptz, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_late_reschedule_fee(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.match_substitute_professional(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pp_request_reschedule(uuid, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.patient_respond_reschedule_proposal(uuid, boolean, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.patient_respond_sub_offer(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.patient_request_reschedule(uuid, timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pp_reschedule_after_sub_rejection(uuid, timestamptz) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_operational_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.session_hours_until(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_late_reschedule_fee(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_substitute_professional(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pp_request_reschedule(uuid, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.patient_respond_reschedule_proposal(uuid, boolean, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.patient_respond_sub_offer(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.patient_request_reschedule(uuid, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pp_reschedule_after_sub_rejection(uuid, timestamptz) TO authenticated;

COMMENT ON FUNCTION public.cancel_session_without_justification(uuid, timestamptz) IS
  'Cancelamento parcial staff quando antecedência menor que cancellation_min_hours_notice (12h padrão).';

COMMENT ON FUNCTION public.patient_request_reschedule(uuid, timestamptz, text) IS
  'Paciente remarca com mesmo PP em até reschedule_max_days_ahead dias; <12h exige atestado e taxa de 50%.';

COMMENT ON FUNCTION public.pp_request_reschedule(uuid, timestamptz) IS
  'PP remarca: >=12h cria proposta para aceite do paciente; <12h oferece SUB.';
