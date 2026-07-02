-- LarsanaCare: cancelamento sem justificativa (<2h) — 50% reembolso + 50% repasse PP
-- Migration: 20260701100100_session_cancellation_50

ALTER TYPE public.session_status ADD VALUE IF NOT EXISTS 'cancelada_sem_justificativa';

ALTER TYPE public.financial_ledger_entry_type ADD VALUE IF NOT EXISTS 'session_cancel_refund';
ALTER TYPE public.financial_ledger_entry_type ADD VALUE IF NOT EXISTS 'session_cancel_pp_release';
ALTER TYPE public.financial_ledger_entry_type ADD VALUE IF NOT EXISTS 'session_cancel_larsana';

CREATE TABLE IF NOT EXISTS public.platform_operational_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cancellation_min_hours_notice integer NOT NULL DEFAULT 2,
  cancellation_partial_percent numeric(5, 2) NOT NULL DEFAULT 50,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.platform_operational_settings (cancellation_min_hours_notice, cancellation_partial_percent)
SELECT 2, 50
WHERE NOT EXISTS (SELECT 1 FROM public.platform_operational_settings LIMIT 1);

CREATE TABLE IF NOT EXISTS public.session_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.care_cycles (id) ON DELETE RESTRICT,
  session_id uuid NOT NULL UNIQUE REFERENCES public.care_sessions (id) ON DELETE RESTRICT,
  reason text NOT NULL DEFAULT 'cancelamento_sem_justificativa',
  session_value_cents integer NOT NULL CHECK (session_value_cents >= 0),
  partial_percent numeric(5, 2) NOT NULL DEFAULT 50,
  refund_family_cents integer NOT NULL CHECK (refund_family_cents >= 0),
  pp_transfer_cents integer NOT NULL CHECK (pp_transfer_cents >= 0),
  larsana_cents integer NOT NULL CHECK (larsana_cents >= 0),
  cancelled_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_adjustments_cycle ON public.session_adjustments (cycle_id);

ALTER TABLE public.session_adjustments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS session_adjustments_staff ON public.session_adjustments;
CREATE POLICY session_adjustments_staff ON public.session_adjustments
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE OR REPLACE FUNCTION public.cancel_session_without_justification(
  p_session_id uuid,
  p_cancelled_at timestamptz DEFAULT now()
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
  v_hours_notice numeric;
BEGIN
  IF NOT public.is_staff_role(ARRAY['admin', 'gestao', 'financeiro']::public.user_role[]) THEN
    RAISE EXCEPTION 'Sem permissão para cancelar sessão';
  END IF;

  SELECT * INTO v_settings FROM public.platform_operational_settings ORDER BY updated_at DESC LIMIT 1;
  IF NOT FOUND THEN
    v_settings.cancellation_min_hours_notice := 2;
    v_settings.cancellation_partial_percent := 50;
  END IF;

  SELECT * INTO v_session FROM public.care_sessions WHERE id = p_session_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sessão não encontrada';
  END IF;

  IF v_session.status NOT IN ('prevista', 'remarcada') THEN
    RAISE EXCEPTION 'Sessão não pode ser cancelada no status: %', v_session.status;
  END IF;

  IF v_session.scheduled_at IS NULL THEN
    RAISE EXCEPTION 'Sessão sem horário agendado';
  END IF;

  v_hours_notice := EXTRACT(EPOCH FROM (v_session.scheduled_at - p_cancelled_at)) / 3600.0;
  IF v_hours_notice >= v_settings.cancellation_min_hours_notice THEN
    RAISE EXCEPTION 'Cancelamento parcial só se antecedência menor que % horas (atual: % h)',
      v_settings.cancellation_min_hours_notice, round(v_hours_notice::numeric, 2);
  END IF;

  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = v_session.cycle_id FOR UPDATE;
  IF v_cycle.payment_status <> 'pago' THEN
    RAISE EXCEPTION 'Ciclo precisa estar pago para aplicar cancelamento parcial';
  END IF;

  IF EXISTS (SELECT 1 FROM public.session_adjustments WHERE session_id = p_session_id) THEN
    RAISE EXCEPTION 'Sessão já possui ajuste financeiro registrado';
  END IF;

  v_session_value := v_cycle.session_unit_price_cents;
  v_partial := v_settings.cancellation_partial_percent;
  v_partial_amt := round(v_session_value * v_partial / 100)::integer;

  SELECT r.pp_percent, r.larsana_percent INTO v_pp_pct, v_larsana_pct
  FROM public.resolve_cycle_split_percentages(v_cycle.id) r;

  v_pp_amt := round(v_partial_amt * v_pp_pct / 100)::integer;
  v_larsana_amt := v_partial_amt - v_pp_amt;

  INSERT INTO public.session_adjustments (
    cycle_id,
    session_id,
    session_value_cents,
    partial_percent,
    refund_family_cents,
    pp_transfer_cents,
    larsana_cents,
    cancelled_at,
    created_by
  ) VALUES (
    v_cycle.id,
    v_session.id,
    v_session_value,
    v_partial,
    v_partial_amt,
    v_pp_amt,
    v_larsana_amt,
    p_cancelled_at,
    auth.uid()
  )
  RETURNING id INTO v_adj_id;

  UPDATE public.care_sessions
  SET status = 'cancelada_sem_justificativa', updated_at = now()
  WHERE id = v_session.id;

  INSERT INTO public.financial_ledger (cycle_id, entry_type, amount_cents, metadata)
  VALUES
    (v_cycle.id, 'session_cancel_refund', v_partial_amt, jsonb_build_object('session_id', v_session.id, 'adjustment_id', v_adj_id)),
    (v_cycle.id, 'session_cancel_pp_release', v_pp_amt, jsonb_build_object('session_id', v_session.id, 'adjustment_id', v_adj_id)),
    (v_cycle.id, 'session_cancel_larsana', v_larsana_amt, jsonb_build_object('session_id', v_session.id, 'adjustment_id', v_adj_id));

  RETURN v_adj_id;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_session_without_justification(uuid, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_session_without_justification(uuid, timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION public.sum_session_adjustments_for_cycle(p_cycle_id uuid)
RETURNS TABLE (
  total_refund_cents integer,
  total_pp_cents integer,
  total_larsana_cents integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(sum(refund_family_cents), 0)::integer,
    COALESCE(sum(pp_transfer_cents), 0)::integer,
    COALESCE(sum(larsana_cents), 0)::integer
  FROM public.session_adjustments
  WHERE cycle_id = p_cycle_id;
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
  larsana_total_cents integer,
  session_cancel_refund_cents integer,
  session_cancel_pp_cents integer,
  session_cancel_larsana_cents integer
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
  v_cancel_refund integer := 0;
  v_cancel_pp integer := 0;
  v_cancel_larsana integer := 0;
BEGIN
  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = p_cycle_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cycle not found: %', p_cycle_id;
  END IF;

  SELECT r.pp_percent, r.larsana_percent INTO v_pp_pct, v_larsana_pct
  FROM public.resolve_cycle_split_percentages(p_cycle_id) r;

  SELECT s.total_refund_cents, s.total_pp_cents, s.total_larsana_cents
  INTO v_cancel_refund, v_cancel_pp, v_cancel_larsana
  FROM public.sum_session_adjustments_for_cycle(p_cycle_id) s;

  v_completed := (
    SELECT count(*)::integer
    FROM public.care_sessions s
    WHERE s.cycle_id = p_cycle_id AND s.status = 'realizada'
  );

  v_gross := v_cycle.session_count * v_cycle.session_unit_price_cents;
  v_completed_amt := v_completed * v_cycle.session_unit_price_cents;
  v_remaining := v_gross - v_completed_amt;

  IF p_pause_type = 'none' THEN
    v_pp_release := round(v_gross * v_pp_pct / 100)::integer + v_cancel_pp;
    v_larsana_comm := v_gross - round(v_gross * v_pp_pct / 100)::integer + v_cancel_larsana;
    v_oper_fee := 0;
    v_refund := v_cancel_refund;
  ELSE
    v_pp_release := round(v_completed_amt * v_pp_pct / 100)::integer + v_cancel_pp;
    v_larsana_comm := round(v_completed_amt * v_larsana_pct / 100)::integer + v_cancel_larsana;

    IF p_pause_type = 'justified' OR p_pause_type = 'professional_or_operation_issue' THEN
      v_oper_fee := 0;
      v_refund := v_remaining + v_cancel_refund;
    ELSIF p_pause_type = 'unjustified' THEN
      v_oper_fee := round(v_remaining * 0.20)::integer;
      v_refund := v_remaining - v_oper_fee + v_cancel_refund;
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
    v_larsana_comm + v_oper_fee,
    v_cancel_refund,
    v_cancel_pp,
    v_cancel_larsana;
END;
$$;

COMMENT ON FUNCTION public.calculate_financial_closure(uuid, public.pause_type) IS
  'Calcula fechamento financeiro proporcional, incluindo cancelamentos parciais de sessão (<2h).';

REVOKE ALL ON FUNCTION public.calculate_financial_closure(uuid, public.pause_type) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calculate_financial_closure(uuid, public.pause_type) TO authenticated;
