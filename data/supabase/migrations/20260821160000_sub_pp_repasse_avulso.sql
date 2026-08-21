-- Repasse avulso PPSUB (substituto por sessão)
-- Migration: 20260821160000_sub_pp_repasse_avulso

ALTER TYPE public.financial_ledger_entry_type ADD VALUE IF NOT EXISTS 'sub_session_pp_release';

-- ===== Tabela repasse SUB =====

CREATE TABLE IF NOT EXISTS public.sub_pp_repasses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE REFERENCES public.care_sessions (id) ON DELETE RESTRICT,
  cycle_id uuid NOT NULL REFERENCES public.care_cycles (id) ON DELETE RESTRICT,
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE RESTRICT,
  substitute_professional_id uuid NOT NULL REFERENCES public.professionals (id) ON DELETE RESTRICT,
  assigned_professional_id uuid NOT NULL REFERENCES public.professionals (id) ON DELETE RESTRICT,
  reschedule_request_id uuid REFERENCES public.session_reschedule_requests (id) ON DELETE SET NULL,
  session_number integer NOT NULL CHECK (session_number > 0),
  session_unit_price_cents integer NOT NULL CHECK (session_unit_price_cents > 0),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  pp_percentage numeric(5, 2) NOT NULL,
  status public.transfer_status NOT NULL DEFAULT 'liberado',
  asaas_transfer_id text,
  transferred_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sub_pp_repasses_substitute
  ON public.sub_pp_repasses (substitute_professional_id, status);
CREATE INDEX IF NOT EXISTS idx_sub_pp_repasses_cycle
  ON public.sub_pp_repasses (cycle_id);
CREATE INDEX IF NOT EXISTS idx_sub_pp_repasses_status
  ON public.sub_pp_repasses (status);

ALTER TABLE public.sub_pp_repasses ENABLE ROW LEVEL SECURITY;

CREATE POLICY sub_pp_repasses_staff ON public.sub_pp_repasses
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'financeiro']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'financeiro']::public.user_role[]));

CREATE POLICY sub_pp_repasses_gestao_read ON public.sub_pp_repasses
  FOR SELECT TO authenticated
  USING (public.is_staff_role(ARRAY['gestao']::public.user_role[]));

CREATE POLICY sub_pp_repasses_pp_read ON public.sub_pp_repasses
  FOR SELECT TO authenticated
  USING (substitute_professional_id = public.current_professional_id());

-- ===== Split percentual do substituto (classe/person_type do SUB) =====

CREATE OR REPLACE FUNCTION public.resolve_sub_session_split_percentages(
  p_cycle_id uuid,
  p_substitute_professional_id uuid
)
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
  v_sub public.professionals%ROWTYPE;
  v_pp_pct numeric;
  v_larsana_pct numeric;
  v_retention numeric;
BEGIN
  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = p_cycle_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cycle not found: %', p_cycle_id;
  END IF;

  SELECT * INTO v_sub FROM public.professionals WHERE id = p_substitute_professional_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Substitute professional not found: %', p_substitute_professional_id;
  END IF;

  IF v_cycle.is_first_month_capture OR v_cycle.cycle_number = 1 THEN
    SELECT fmr.larsana_percent INTO v_retention
    FROM public.first_month_retention_rules fmr
    WHERE fmr.version_id = v_cycle.pricing_version_id;

    IF v_retention IS NULL THEN
      v_retention := CASE WHEN v_sub.person_type = 'PJ' THEN 30 ELSE 40 END;
    END IF;

    IF v_sub.person_type = 'PJ' AND v_retention = 40 THEN
      v_retention := 30;
    END IF;

    v_pp_pct := 100 - v_retention;
    v_larsana_pct := v_retention;
  ELSE
    SELECT cr.pp_percent, cr.larsana_percent
    INTO v_pp_pct, v_larsana_pct
    FROM public.commission_rules cr
    WHERE cr.version_id = v_cycle.pricing_version_id
      AND cr.pp_class = v_sub.pp_class;

    IF v_pp_pct IS NULL THEN
      v_pp_pct := CASE v_sub.pp_class
        WHEN 'PRATA' THEN 75
        WHEN 'OURO' THEN 80
        ELSE 70
      END;
      v_larsana_pct := 100 - v_pp_pct;
    END IF;

    IF v_sub.person_type = 'PJ' THEN
      v_pp_pct := LEAST(v_pp_pct + 10, 95);
      v_larsana_pct := 100 - v_pp_pct;
    END IF;
  END IF;

  RETURN QUERY SELECT v_pp_pct, v_larsana_pct;
END;
$$;

-- ===== Criar repasse SUB (idempotente) =====

CREATE OR REPLACE FUNCTION public.ensure_sub_pp_repasse(p_session_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.care_sessions%ROWTYPE;
  v_cycle public.care_cycles%ROWTYPE;
  v_existing uuid;
  v_new_id uuid;
  v_pp_pct numeric;
  v_larsana_pct numeric;
  v_amount integer;
  v_request_id uuid;
  v_sub_user_id uuid;
BEGIN
  SELECT id INTO v_existing FROM public.sub_pp_repasses WHERE session_id = p_session_id;
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  SELECT * INTO v_session FROM public.care_sessions WHERE id = p_session_id;
  IF NOT FOUND OR v_session.status <> 'realizada'::public.session_status THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = v_session.cycle_id;
  IF NOT FOUND OR v_cycle.payment_status <> 'pago'::public.payment_status THEN
    RETURN NULL;
  END IF;

  IF v_session.professional_id = v_cycle.assigned_professional_id THEN
    RETURN NULL;
  END IF;

  SELECT r.pp_percent, r.larsana_percent
  INTO v_pp_pct, v_larsana_pct
  FROM public.resolve_sub_session_split_percentages(v_cycle.id, v_session.professional_id) r;

  v_amount := round(v_cycle.session_unit_price_cents * v_pp_pct / 100)::integer;
  IF v_amount <= 0 THEN
    RETURN NULL;
  END IF;

  SELECT r.id INTO v_request_id
  FROM public.session_reschedule_requests r
  WHERE r.session_id = p_session_id
    AND r.substitute_professional_id = v_session.professional_id
    AND r.status IN ('sub_accepted', 'completed')
  ORDER BY r.updated_at DESC
  LIMIT 1;

  INSERT INTO public.sub_pp_repasses (
    session_id,
    cycle_id,
    patient_id,
    substitute_professional_id,
    assigned_professional_id,
    reschedule_request_id,
    session_number,
    session_unit_price_cents,
    amount_cents,
    pp_percentage,
    status
  ) VALUES (
    v_session.id,
    v_cycle.id,
    v_cycle.patient_id,
    v_session.professional_id,
    v_cycle.assigned_professional_id,
    v_request_id,
    v_session.session_number,
    v_cycle.session_unit_price_cents,
    v_amount,
    v_pp_pct,
    'liberado'::public.transfer_status
  )
  RETURNING id INTO v_new_id;

  INSERT INTO public.financial_ledger (cycle_id, entry_type, amount_cents, metadata)
  VALUES (
    v_cycle.id,
    'sub_session_pp_release'::public.financial_ledger_entry_type,
    v_amount,
    jsonb_build_object(
      'session_id', v_session.id,
      'repasse_id', v_new_id,
      'substitute_professional_id', v_session.professional_id,
      'reschedule_request_id', v_request_id
    )
  );

  SELECT user_id INTO v_sub_user_id
  FROM public.professionals
  WHERE id = v_session.professional_id;

  IF v_sub_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, payload)
    VALUES (
      v_sub_user_id,
      'repasse_liberado'::public.notification_type,
      'Repasse SUB liberado',
      'Seu repasse avulso como substituto foi liberado e aguarda transferência para a wallet.',
      jsonb_build_object(
        'sub_repasse_id', v_new_id,
        'session_id', v_session.id,
        'cycle_id', v_cycle.id,
        'amount_cents', v_amount
      )
    );
  END IF;

  RETURN v_new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_sub_pp_repasse(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_sub_pp_repasse(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.trg_ensure_sub_pp_repasse_on_realizada()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'realizada'::public.session_status
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM public.ensure_sub_pp_repasse(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_care_sessions_sub_repasse ON public.care_sessions;
CREATE TRIGGER trg_care_sessions_sub_repasse
  AFTER INSERT OR UPDATE OF status ON public.care_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_ensure_sub_pp_repasse_on_realizada();

-- ===== Check-out marca sessão realizada e dispara repasse SUB =====

CREATE OR REPLACE FUNCTION public.pp_session_check_out(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pp uuid := public.current_professional_id();
  v_repasse_id uuid;
BEGIN
  IF v_pp IS NULL THEN RAISE EXCEPTION 'Profissional não identificado'; END IF;

  UPDATE public.care_sessions
  SET
    check_out_at = now(),
    status = 'realizada'::public.session_status,
    updated_at = now()
  WHERE id = p_session_id
    AND professional_id = v_pp
    AND check_in_at IS NOT NULL
    AND check_out_at IS NULL;

  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão não encontrada ou checkout indisponível'; END IF;

  v_repasse_id := public.ensure_sub_pp_repasse(p_session_id);

  RETURN jsonb_build_object(
    'session_id', p_session_id,
    'check_out_at', now(),
    'sub_repasse_id', v_repasse_id
  );
END;
$$;

-- ===== Repasse do titular: só sessões dele; desconta SUBs no fechamento =====

CREATE OR REPLACE FUNCTION public.count_assigned_pp_completed_sessions(p_cycle_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer
  FROM public.care_sessions s
  JOIN public.care_cycles c ON c.id = s.cycle_id
  WHERE s.cycle_id = p_cycle_id
    AND s.status = 'realizada'::public.session_status
    AND s.professional_id = c.assigned_professional_id;
$$;

CREATE OR REPLACE FUNCTION public.sum_sub_pp_repasses_for_cycle(p_cycle_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(sum(amount_cents), 0)::integer
  FROM public.sub_pp_repasses
  WHERE cycle_id = p_cycle_id;
$$;

DROP FUNCTION IF EXISTS public.calculate_transfer_amount(uuid);

CREATE OR REPLACE FUNCTION public.calculate_transfer_amount(p_cycle_id uuid)
RETURNS TABLE (
  pp_transfer_amount_cents integer,
  larsana_margin_cents integer,
  commission_percent numeric,
  first_month_retention_applied boolean
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
  v_assigned_sessions integer;
  v_assigned_amt integer;
  v_pp_amount integer;
  v_sub_total integer;
  v_completed_amt integer;
  v_completed_sessions integer;
BEGIN
  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = p_cycle_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cycle not found: %', p_cycle_id;
  END IF;

  SELECT r.pp_percent, r.larsana_percent
  INTO v_pp_pct, v_larsana_pct
  FROM public.resolve_cycle_split_percentages(p_cycle_id) r;

  v_assigned_sessions := public.count_assigned_pp_completed_sessions(p_cycle_id);
  v_assigned_amt := v_assigned_sessions * v_cycle.session_unit_price_cents;
  v_pp_amount := round(v_assigned_amt * v_pp_pct / 100)::integer;

  v_sub_total := public.sum_sub_pp_repasses_for_cycle(p_cycle_id);

  SELECT count(*)::integer INTO v_completed_sessions
  FROM public.care_sessions s
  WHERE s.cycle_id = p_cycle_id AND s.status = 'realizada'::public.session_status;

  v_completed_amt := v_completed_sessions * v_cycle.session_unit_price_cents;

  RETURN QUERY SELECT
    v_pp_amount,
    greatest(v_completed_amt - v_pp_amount - v_sub_total, 0),
    v_pp_pct,
    v_cycle.is_first_month_capture OR v_cycle.cycle_number = 1;
END;
$$;

DROP FUNCTION IF EXISTS public.calculate_financial_closure(uuid, public.pause_type);

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
  v_assigned_completed integer;
  v_gross integer;
  v_completed_amt integer;
  v_assigned_amt integer;
  v_remaining integer;
  v_pp_release integer;
  v_sub_total integer;
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
      AND s.status = 'realizada'::public.session_status
  );

  v_assigned_completed := public.count_assigned_pp_completed_sessions(p_cycle_id);
  v_sub_total := public.sum_sub_pp_repasses_for_cycle(p_cycle_id);

  v_gross := v_cycle.session_count * v_cycle.session_unit_price_cents;
  v_completed_amt := v_completed * v_cycle.session_unit_price_cents;
  v_assigned_amt := v_assigned_completed * v_cycle.session_unit_price_cents;
  v_remaining := v_gross - v_completed_amt;

  IF p_pause_type = 'none' THEN
    v_pp_release := round(v_assigned_amt * v_pp_pct / 100)::integer;
    v_larsana_comm := greatest(v_completed_amt - v_pp_release - v_sub_total, 0);
    v_oper_fee := 0;
    v_refund := 0;
  ELSE
    v_pp_release := round(v_assigned_amt * v_pp_pct / 100)::integer;
    v_larsana_comm := greatest(v_completed_amt - v_pp_release - v_sub_total, 0);

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

-- ===== Simulação wallet SUB (dev/E2E) =====

CREATE OR REPLACE FUNCTION public.simulate_sub_repasse_wallet(p_repasse_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.sub_pp_repasses%ROWTYPE;
BEGIN
  IF NOT public.is_staff_role(ARRAY['admin', 'financeiro']::public.user_role[]) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  SELECT * INTO v_row FROM public.sub_pp_repasses WHERE id = p_repasse_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Repasse SUB não encontrado'; END IF;

  IF v_row.status = 'transferido'::public.transfer_status THEN
    RETURN jsonb_build_object('repasse_id', p_repasse_id, 'status', 'transferido', 'already_transferred', true);
  END IF;

  IF v_row.status <> 'liberado'::public.transfer_status THEN
    RAISE EXCEPTION 'Repasse SUB precisa estar liberado';
  END IF;

  UPDATE public.sub_pp_repasses
  SET
    status = 'transferido'::public.transfer_status,
    asaas_transfer_id = coalesce(asaas_transfer_id, 'sim-sub-' || p_repasse_id::text),
    transferred_at = now(),
    updated_at = now()
  WHERE id = p_repasse_id;

  RETURN jsonb_build_object(
    'repasse_id', p_repasse_id,
    'status', 'transferido',
    'simulated', true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.simulate_sub_repasse_wallet(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_sub_session_split_percentages(uuid, uuid) TO authenticated;
