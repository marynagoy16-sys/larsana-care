-- LarsanaCare: pausas, remarcações e fechamento financeiro
-- Migration: 20260630120000_pauses_financial_closure

-- ===== ENUMS =====

CREATE TYPE public.pause_type AS ENUM (
  'none',
  'justified',
  'unjustified',
  'professional_or_operation_issue'
);

CREATE TYPE public.reschedule_reason_category AS ENUM (
  'saude',
  'internacao',
  'problema_fisio',
  'horario',
  'familiar',
  'outro'
);

CREATE TYPE public.refund_status AS ENUM (
  'nao_aplicavel',
  'calculado',
  'pendente',
  'executado',
  'falhou'
);

CREATE TYPE public.financial_ledger_entry_type AS ENUM (
  'pp_held',
  'pp_release',
  'larsana_commission',
  'operational_fee',
  'refund'
);

ALTER TYPE public.cycle_status ADD VALUE IF NOT EXISTS 'em_pausa';
ALTER TYPE public.cycle_status ADD VALUE IF NOT EXISTS 'em_analise';
ALTER TYPE public.cycle_status ADD VALUE IF NOT EXISTS 'fechado_financeiramente';

-- ===== CARE_CYCLES EXTENSIONS =====

ALTER TABLE public.care_cycles
  ADD COLUMN IF NOT EXISTS pp_percentage numeric(5, 2),
  ADD COLUMN IF NOT EXISTS larsana_percentage numeric(5, 2),
  ADD COLUMN IF NOT EXISTS reschedule_count_consecutive integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active_pause_id uuid;

ALTER TABLE public.care_cycles
  DROP CONSTRAINT IF EXISTS care_cycles_split_percent_sum;

ALTER TABLE public.care_cycles
  ADD CONSTRAINT care_cycles_split_percent_sum CHECK (
    (pp_percentage IS NULL AND larsana_percentage IS NULL)
    OR (
      pp_percentage IS NOT NULL
      AND larsana_percentage IS NOT NULL
      AND pp_percentage + larsana_percentage = 100
    )
  );

-- ===== FINANCIAL CLOSURES =====

CREATE TABLE public.financial_closures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL UNIQUE REFERENCES public.care_cycles (id) ON DELETE RESTRICT,
  sessions_contracted integer NOT NULL CHECK (sessions_contracted > 0),
  sessions_completed integer NOT NULL CHECK (sessions_completed >= 0),
  gross_cycle_amount_cents integer NOT NULL CHECK (gross_cycle_amount_cents >= 0),
  completed_amount_cents integer NOT NULL CHECK (completed_amount_cents >= 0),
  remaining_amount_cents integer NOT NULL CHECK (remaining_amount_cents >= 0),
  pp_percentage numeric(5, 2) NOT NULL,
  larsana_percentage numeric(5, 2) NOT NULL,
  pp_release_amount_cents integer NOT NULL CHECK (pp_release_amount_cents >= 0),
  larsana_commission_amount_cents integer NOT NULL CHECK (larsana_commission_amount_cents >= 0),
  operational_fee_cents integer NOT NULL DEFAULT 0 CHECK (operational_fee_cents >= 0),
  family_refund_amount_cents integer NOT NULL DEFAULT 0 CHECK (family_refund_amount_cents >= 0),
  pause_type public.pause_type NOT NULL DEFAULT 'none',
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_financial_closures_cycle ON public.financial_closures (cycle_id);

-- ===== PAUSE EVENTS =====

CREATE TABLE public.pause_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.care_cycles (id) ON DELETE RESTRICT,
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE RESTRICT,
  treatment_pause_id uuid REFERENCES public.treatment_pauses (id) ON DELETE SET NULL,
  pause_type public.pause_type NOT NULL,
  justification text,
  admin_decision text,
  financial_closure_id uuid REFERENCES public.financial_closures (id) ON DELETE SET NULL,
  initiated_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pause_events_cycle ON public.pause_events (cycle_id);
CREATE INDEX idx_pause_events_patient ON public.pause_events (patient_id);

ALTER TABLE public.care_cycles
  ADD CONSTRAINT care_cycles_active_pause_id_fkey
  FOREIGN KEY (active_pause_id) REFERENCES public.pause_events (id) ON DELETE SET NULL;

-- ===== RESCHEDULE EVENTS =====

CREATE TABLE public.reschedule_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.care_cycles (id) ON DELETE RESTRICT,
  session_id uuid NOT NULL REFERENCES public.care_sessions (id) ON DELETE RESTRICT,
  sequence_number integer NOT NULL CHECK (sequence_number > 0),
  reason_category public.reschedule_reason_category,
  reason_text text,
  requested_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  warning_acknowledged boolean NOT NULL DEFAULT false,
  acknowledged_at timestamptz,
  acknowledged_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  is_valid_justification boolean,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reschedule_events_cycle ON public.reschedule_events (cycle_id);
CREATE INDEX idx_reschedule_events_session ON public.reschedule_events (session_id);

-- ===== FINANCIAL LEDGER =====

CREATE TABLE public.financial_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.care_cycles (id) ON DELETE RESTRICT,
  closure_id uuid REFERENCES public.financial_closures (id) ON DELETE SET NULL,
  entry_type public.financial_ledger_entry_type NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_financial_ledger_cycle ON public.financial_ledger (cycle_id);
CREATE INDEX idx_financial_ledger_closure ON public.financial_ledger (closure_id);

-- ===== REFUNDS =====

CREATE TABLE public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.care_cycles (id) ON DELETE RESTRICT,
  closure_id uuid NOT NULL REFERENCES public.financial_closures (id) ON DELETE RESTRICT,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  status public.refund_status NOT NULL DEFAULT 'calculado',
  gateway_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  executed_at timestamptz
);

CREATE INDEX idx_refunds_cycle ON public.refunds (cycle_id);
CREATE INDEX idx_refunds_status ON public.refunds (status)
  WHERE status IN ('calculado', 'pendente');

-- ===== HELPERS =====

CREATE OR REPLACE FUNCTION public.is_valid_reschedule_justification(p_category public.reschedule_reason_category)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_category IN ('saude'::public.reschedule_reason_category, 'internacao'::public.reschedule_reason_category);
$$;

CREATE OR REPLACE FUNCTION public.classify_reschedule_reason(p_category public.reschedule_reason_category)
RETURNS public.pause_type
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_category IN ('saude', 'internacao') THEN 'justified'::public.pause_type
    WHEN p_category = 'problema_fisio' THEN 'professional_or_operation_issue'::public.pause_type
    ELSE 'unjustified'::public.pause_type
  END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_cycle_split_percentages(p_cycle_id uuid)
RETURNS TABLE (
  pp_percent numeric,
  larsana_percent numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle public.care_cycles%ROWTYPE;
  v_pp public.professionals%ROWTYPE;
  v_pp_pct numeric;
  v_larsana_pct numeric;
BEGIN
  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = p_cycle_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cycle not found: %', p_cycle_id;
  END IF;

  IF v_cycle.pp_percentage IS NOT NULL AND v_cycle.larsana_percentage IS NOT NULL THEN
    RETURN QUERY SELECT v_cycle.pp_percentage, v_cycle.larsana_percentage;
    RETURN;
  END IF;

  SELECT * INTO v_pp FROM public.professionals WHERE id = v_cycle.assigned_professional_id;

  IF v_cycle.is_first_month_capture OR v_cycle.cycle_number = 1 THEN
    IF v_pp.person_type = 'PJ' THEN
      v_pp_pct := 70;
      v_larsana_pct := 30;
    ELSE
      v_pp_pct := 60;
      v_larsana_pct := 40;
    END IF;
  ELSE
    SELECT cr.pp_percent, cr.larsana_percent
    INTO v_pp_pct, v_larsana_pct
    FROM public.commission_rules cr
    WHERE cr.version_id = v_cycle.pricing_version_id
      AND cr.pp_class = v_pp.pp_class;

    IF v_pp_pct IS NULL THEN
      v_pp_pct := CASE v_pp.pp_class
        WHEN 'PRATA' THEN 75
        WHEN 'OURO' THEN 80
        ELSE 70
      END;
      v_larsana_pct := 100 - v_pp_pct;
    END IF;

    IF v_pp.person_type = 'PJ' THEN
      v_pp_pct := LEAST(v_pp_pct + 10, 95);
      v_larsana_pct := 100 - v_pp_pct;
    END IF;
  END IF;

  RETURN QUERY SELECT v_pp_pct, v_larsana_pct;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_financial_closure(
  p_cycle_id uuid,
  p_pause_type public.pause_type DEFAULT 'none'
)
RETURNS TABLE (
  sessions_contracted integer,
  sessions_completed integer,
  gross_cycle_amount_cents integer,
  completed_amount_cents integer,
  remaining_amount_cents integer,
  pp_percentage numeric,
  larsana_percentage numeric,
  pp_release_amount_cents integer,
  larsana_commission_amount_cents integer,
  operational_fee_cents integer,
  family_refund_amount_cents integer,
  larsana_total_cents integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle public.care_cycles%ROWTYPE;
  v_pp_pct numeric;
  v_larsana_pct numeric;
  v_completed integer;
  v_gross integer;
  v_completed_amt integer;
  v_remaining integer;
  v_pp_release integer;
  v_larsana_comm integer;
  v_oper_fee integer := 0;
  v_refund integer := 0;
BEGIN
  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = p_cycle_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cycle not found: %', p_cycle_id;
  END IF;

  SELECT r.pp_percent, r.larsana_percent
  INTO v_pp_pct, v_larsana_pct
  FROM public.resolve_cycle_split_percentages(p_cycle_id) r;

  v_completed := (
    SELECT count(*)::integer
    FROM public.care_sessions s
    WHERE s.cycle_id = p_cycle_id
      AND s.status = 'realizada'
  );

  v_gross := v_cycle.session_count * v_cycle.session_unit_price_cents;
  v_completed_amt := v_completed * v_cycle.session_unit_price_cents;
  v_remaining := v_gross - v_completed_amt;

  IF p_pause_type = 'none' THEN
    v_pp_release := round(v_gross * v_pp_pct / 100)::integer;
    v_larsana_comm := v_gross - v_pp_release;
    v_oper_fee := 0;
    v_refund := 0;
  ELSE
    v_pp_release := round(v_completed_amt * v_pp_pct / 100)::integer;
    v_larsana_comm := round(v_completed_amt * v_larsana_pct / 100)::integer;

    IF p_pause_type = 'justified' OR p_pause_type = 'professional_or_operation_issue' THEN
      v_oper_fee := 0;
      v_refund := v_remaining;
    ELSIF p_pause_type = 'unjustified' THEN
      v_oper_fee := round(v_remaining * 0.20)::integer;
      v_refund := v_remaining - v_oper_fee;
    END IF;
  END IF;

  RETURN QUERY SELECT
    v_cycle.session_count,
    v_completed,
    v_gross,
    v_completed_amt,
    v_remaining,
    v_pp_pct,
    v_larsana_pct,
    v_pp_release,
    v_larsana_comm,
    v_oper_fee,
    v_refund,
    v_larsana_comm + v_oper_fee;
END;
$$;

COMMENT ON FUNCTION public.calculate_financial_closure(uuid, public.pause_type) IS
  'Calcula fechamento financeiro proporcional conforme regra Larsana (realizados vs remanescente).';

-- ===== RPC: INITIATE PAUSE (before register_reschedule) =====

CREATE OR REPLACE FUNCTION public.initiate_pause(
  p_cycle_id uuid,
  p_pause_type public.pause_type,
  p_justification text DEFAULT NULL,
  p_admin_decision text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle public.care_cycles%ROWTYPE;
  v_pause_id uuid;
  v_treatment_pause_id uuid;
  v_new_status public.cycle_status;
BEGIN
  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = p_cycle_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ciclo não encontrado';
  END IF;

  IF v_cycle.status IN ('fechado_financeiramente', 'cancelado', 'encerrado') THEN
    RAISE EXCEPTION 'Ciclo já encerrado ou fechado financeiramente';
  END IF;

  v_new_status := CASE
    WHEN p_pause_type IN ('justified', 'professional_or_operation_issue') THEN 'em_analise'::public.cycle_status
    WHEN p_pause_type = 'unjustified' THEN 'em_pausa'::public.cycle_status
    ELSE 'em_pausa'::public.cycle_status
  END;

  INSERT INTO public.treatment_pauses (patient_id, reason, created_by)
  VALUES (v_cycle.patient_id, p_justification, auth.uid())
  RETURNING id INTO v_treatment_pause_id;

  INSERT INTO public.pause_events (
    cycle_id,
    patient_id,
    treatment_pause_id,
    pause_type,
    justification,
    admin_decision,
    initiated_by
  ) VALUES (
    p_cycle_id,
    v_cycle.patient_id,
    v_treatment_pause_id,
    p_pause_type,
    p_justification,
    p_admin_decision,
    auth.uid()
  )
  RETURNING id INTO v_pause_id;

  UPDATE public.care_cycles
  SET
    status = v_new_status,
    active_pause_id = v_pause_id,
    updated_at = now()
  WHERE id = p_cycle_id;

  UPDATE public.patients
  SET care_status = 'PAUSA', updated_at = now()
  WHERE id = v_cycle.patient_id;

  RETURN v_pause_id;
END;
$$;

-- ===== RPC: REGISTER RESCHEDULE =====

CREATE OR REPLACE FUNCTION public.register_reschedule(
  p_session_id uuid,
  p_reason_category public.reschedule_reason_category DEFAULT NULL,
  p_reason_text text DEFAULT NULL,
  p_warning_acknowledged boolean DEFAULT false,
  p_new_scheduled_at timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.care_sessions%ROWTYPE;
  v_cycle public.care_cycles%ROWTYPE;
  v_next_seq integer;
  v_event_id uuid;
  v_pause_type public.pause_type;
  v_valid_justification boolean;
BEGIN
  SELECT * INTO v_session FROM public.care_sessions WHERE id = p_session_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sessão não encontrada';
  END IF;

  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = v_session.cycle_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ciclo não encontrado';
  END IF;

  IF v_cycle.status NOT IN ('ativo', 'em_pausa') THEN
    RAISE EXCEPTION 'Ciclo não permite remarcação no status atual: %', v_cycle.status;
  END IF;

  IF v_session.status NOT IN ('prevista', 'remarcada') THEN
    RAISE EXCEPTION 'Sessão não pode ser remarcada no status: %', v_session.status;
  END IF;

  v_next_seq := v_cycle.reschedule_count_consecutive + 1;
  v_valid_justification := public.is_valid_reschedule_justification(p_reason_category);

  IF v_next_seq >= 2 AND p_reason_category IS NULL THEN
    RAISE EXCEPTION 'Motivo obrigatório na 2ª remarcação consecutiva';
  END IF;

  IF v_next_seq >= 3 AND NOT v_valid_justification AND NOT p_warning_acknowledged THEN
    RAISE EXCEPTION 'Aceite obrigatório antes da 3ª remarcação consecutiva sem justificativa validada';
  END IF;

  INSERT INTO public.reschedule_events (
    cycle_id,
    session_id,
    sequence_number,
    reason_category,
    reason_text,
    requested_by,
    warning_acknowledged,
    acknowledged_at,
    acknowledged_by,
    is_valid_justification
  ) VALUES (
    v_cycle.id,
    v_session.id,
    v_next_seq,
    p_reason_category,
    p_reason_text,
    auth.uid(),
    p_warning_acknowledged,
    CASE WHEN p_warning_acknowledged THEN now() ELSE NULL END,
    CASE WHEN p_warning_acknowledged THEN auth.uid() ELSE NULL END,
    v_valid_justification
  )
  RETURNING id INTO v_event_id;

  UPDATE public.care_sessions
  SET
    status = 'remarcada',
    scheduled_at = COALESCE(p_new_scheduled_at, scheduled_at),
    updated_at = now()
  WHERE id = v_session.id;

  IF v_valid_justification THEN
    UPDATE public.care_cycles
    SET reschedule_count_consecutive = 0, updated_at = now()
    WHERE id = v_cycle.id;

    v_pause_type := public.classify_reschedule_reason(p_reason_category);
    PERFORM public.initiate_pause(v_cycle.id, v_pause_type, COALESCE(p_reason_text, p_reason_category::text));
  ELSE
    UPDATE public.care_cycles
    SET reschedule_count_consecutive = v_next_seq, updated_at = now()
    WHERE id = v_cycle.id;

    IF v_next_seq >= 3 AND p_warning_acknowledged THEN
      PERFORM public.initiate_pause(
        v_cycle.id,
        'unjustified'::public.pause_type,
        COALESCE(p_reason_text, 'Terceira remarcação consecutiva sem justificativa validada')
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'reschedule_event_id', v_event_id,
    'sequence_number', v_next_seq,
    'warning_acknowledged', p_warning_acknowledged,
    'is_valid_justification', v_valid_justification
  );
END;
$$;

-- ===== RPC: RESUME TREATMENT =====

CREATE OR REPLACE FUNCTION public.resume_treatment(p_pause_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pause public.pause_events%ROWTYPE;
  v_cycle public.care_cycles%ROWTYPE;
BEGIN
  SELECT * INTO v_pause FROM public.pause_events WHERE id = p_pause_event_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pausa não encontrada';
  END IF;

  IF v_pause.closed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Pausa já encerrada';
  END IF;

  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = v_pause.cycle_id FOR UPDATE;

  UPDATE public.treatment_pauses
  SET resumed_at = now()
  WHERE id = v_pause.treatment_pause_id;

  UPDATE public.pause_events
  SET closed_at = now()
  WHERE id = p_pause_event_id;

  UPDATE public.care_cycles
  SET
    status = 'ativo',
    active_pause_id = NULL,
    updated_at = now()
  WHERE id = v_pause.cycle_id;

  IF NOT EXISTS (
    SELECT 1 FROM public.treatment_pauses tp
    WHERE tp.patient_id = v_pause.patient_id
      AND tp.resumed_at IS NULL
  ) THEN
    UPDATE public.patients
    SET care_status = 'ATIVO', updated_at = now()
    WHERE id = v_pause.patient_id;
  END IF;
END;
$$;

-- ===== RPC: CLOSE CYCLE FINANCIALLY =====

CREATE OR REPLACE FUNCTION public.close_cycle_financially(
  p_cycle_id uuid,
  p_pause_type public.pause_type DEFAULT 'none',
  p_admin_decision text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle public.care_cycles%ROWTYPE;
  v_pp public.professionals%ROWTYPE;
  v_calc record;
  v_closure_id uuid;
  v_refund_id uuid;
  v_pause_id uuid;
BEGIN
  IF NOT public.is_staff_role(ARRAY['admin', 'financeiro', 'gestao']::public.user_role[]) THEN
    RAISE EXCEPTION 'Sem permissão para fechamento financeiro';
  END IF;

  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = p_cycle_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ciclo não encontrado';
  END IF;

  IF v_cycle.status = 'fechado_financeiramente' THEN
    RAISE EXCEPTION 'Ciclo já fechado financeiramente';
  END IF;

  IF EXISTS (SELECT 1 FROM public.financial_closures fc WHERE fc.cycle_id = p_cycle_id) THEN
    RAISE EXCEPTION 'Fechamento financeiro já registrado para este ciclo';
  END IF;

  SELECT * INTO v_calc FROM public.calculate_financial_closure(p_cycle_id, p_pause_type);

  INSERT INTO public.financial_closures (
    cycle_id,
    sessions_contracted,
    sessions_completed,
    gross_cycle_amount_cents,
    completed_amount_cents,
    remaining_amount_cents,
    pp_percentage,
    larsana_percentage,
    pp_release_amount_cents,
    larsana_commission_amount_cents,
    operational_fee_cents,
    family_refund_amount_cents,
    pause_type,
    snapshot,
    created_by
  ) VALUES (
    p_cycle_id,
    v_calc.sessions_contracted,
    v_calc.sessions_completed,
    v_calc.gross_cycle_amount_cents,
    v_calc.completed_amount_cents,
    v_calc.remaining_amount_cents,
    v_calc.pp_percentage,
    v_calc.larsana_percentage,
    v_calc.pp_release_amount_cents,
    v_calc.larsana_commission_amount_cents,
    v_calc.operational_fee_cents,
    v_calc.family_refund_amount_cents,
    p_pause_type,
    jsonb_build_object(
      'admin_decision', p_admin_decision,
      'larsana_total_cents', v_calc.larsana_total_cents
    ),
    auth.uid()
  )
  RETURNING id INTO v_closure_id;

  INSERT INTO public.financial_ledger (cycle_id, closure_id, entry_type, amount_cents, metadata)
  VALUES
    (p_cycle_id, v_closure_id, 'pp_release', v_calc.pp_release_amount_cents, '{}'::jsonb),
    (p_cycle_id, v_closure_id, 'larsana_commission', v_calc.larsana_commission_amount_cents, '{}'::jsonb);

  IF v_calc.operational_fee_cents > 0 THEN
    INSERT INTO public.financial_ledger (cycle_id, closure_id, entry_type, amount_cents, metadata)
    VALUES (p_cycle_id, v_closure_id, 'operational_fee', v_calc.operational_fee_cents, '{}'::jsonb);
  END IF;

  IF v_calc.family_refund_amount_cents > 0 THEN
    INSERT INTO public.financial_ledger (cycle_id, closure_id, entry_type, amount_cents, metadata)
    VALUES (p_cycle_id, v_closure_id, 'refund', v_calc.family_refund_amount_cents, '{}'::jsonb);

    INSERT INTO public.refunds (cycle_id, closure_id, amount_cents, status)
    VALUES (p_cycle_id, v_closure_id, v_calc.family_refund_amount_cents, 'pendente')
    RETURNING id INTO v_refund_id;
  END IF;

  SELECT * INTO v_pp FROM public.professionals WHERE id = v_cycle.assigned_professional_id;

  INSERT INTO public.transfer_queue (cycle_id, professional_id, status)
  VALUES (p_cycle_id, v_cycle.assigned_professional_id, 'aguardando_nf')
  ON CONFLICT (cycle_id) DO UPDATE SET status = 'aguardando_nf';

  INSERT INTO public.transfers (
    cycle_id,
    professional_id,
    patient_charged_amount_cents,
    pp_transfer_amount_cents,
    larsana_margin_cents,
    pp_class,
    commission_percent,
    first_month_retention_applied,
    status
  ) VALUES (
    p_cycle_id,
    v_cycle.assigned_professional_id,
    v_calc.completed_amount_cents,
    v_calc.pp_release_amount_cents,
    v_calc.larsana_commission_amount_cents + v_calc.operational_fee_cents,
    v_pp.pp_class,
    v_calc.pp_percentage,
    v_cycle.is_first_month_capture OR v_cycle.cycle_number = 1,
    'aguardando_nf'
  )
  ON CONFLICT (cycle_id) DO UPDATE SET
    patient_charged_amount_cents = EXCLUDED.patient_charged_amount_cents,
    pp_transfer_amount_cents = EXCLUDED.pp_transfer_amount_cents,
    larsana_margin_cents = EXCLUDED.larsana_margin_cents,
    commission_percent = EXCLUDED.commission_percent,
    first_month_retention_applied = EXCLUDED.first_month_retention_applied,
    status = 'aguardando_nf',
    updated_at = now();

  IF v_cycle.active_pause_id IS NOT NULL THEN
    UPDATE public.pause_events
    SET
      financial_closure_id = v_closure_id,
      closed_at = now(),
      admin_decision = COALESCE(p_admin_decision, admin_decision)
    WHERE id = v_cycle.active_pause_id
    RETURNING id INTO v_pause_id;
  ELSIF p_pause_type <> 'none' THEN
    INSERT INTO public.pause_events (
      cycle_id,
      patient_id,
      pause_type,
      justification,
      admin_decision,
      financial_closure_id,
      initiated_by,
      closed_at
    ) VALUES (
      p_cycle_id,
      v_cycle.patient_id,
      p_pause_type,
      p_admin_decision,
      p_admin_decision,
      v_closure_id,
      auth.uid(),
      now()
    );
  END IF;

  UPDATE public.care_cycles
  SET
    status = 'fechado_financeiramente',
    closed_at = COALESCE(closed_at, now()),
    pp_percentage = v_calc.pp_percentage,
    larsana_percentage = v_calc.larsana_percentage,
    active_pause_id = NULL,
    updated_at = now()
  WHERE id = p_cycle_id;

  RETURN v_closure_id;
END;
$$;

REVOKE ALL ON FUNCTION public.register_reschedule(uuid, public.reschedule_reason_category, text, boolean, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_reschedule(uuid, public.reschedule_reason_category, text, boolean, timestamptz) TO authenticated;

REVOKE ALL ON FUNCTION public.initiate_pause(uuid, public.pause_type, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.initiate_pause(uuid, public.pause_type, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.resume_treatment(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resume_treatment(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.close_cycle_financially(uuid, public.pause_type, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.close_cycle_financially(uuid, public.pause_type, text) TO authenticated;

REVOKE ALL ON FUNCTION public.calculate_financial_closure(uuid, public.pause_type) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calculate_financial_closure(uuid, public.pause_type) TO authenticated;

REVOKE ALL ON FUNCTION public.resolve_cycle_split_percentages(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_cycle_split_percentages(uuid) TO authenticated;
