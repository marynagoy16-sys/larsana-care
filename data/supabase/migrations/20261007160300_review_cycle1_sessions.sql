-- Ciclo 1: a avaliação já existente conta como sessão 1.
-- As terapias geradas são as que faltam, sem duplicar a avaliação.

CREATE OR REPLACE FUNCTION public.ensure_paid_cycle_sessions(p_cycle_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle public.care_cycles%ROWTYPE;
  v_existing integer;
  v_has_assessment boolean;
  v_next integer;
  v_target integer;
  v_i integer;
  v_assessment_at timestamptz;
BEGIN
  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = p_cycle_id;
  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  SELECT count(*) INTO v_existing FROM public.care_sessions WHERE cycle_id = p_cycle_id;
  SELECT EXISTS (
    SELECT 1 FROM public.care_sessions
    WHERE cycle_id = p_cycle_id AND is_assessment_session = true
  ) INTO v_has_assessment;

  v_target := v_cycle.session_count;

  IF v_cycle.cycle_number = 1 AND NOT v_has_assessment AND v_existing = 0 THEN
    SELECT ia.created_at INTO v_assessment_at
    FROM public.initial_assessments ia
    WHERE ia.patient_id = v_cycle.patient_id
    ORDER BY ia.created_at DESC
    LIMIT 1;

    INSERT INTO public.care_sessions (
      cycle_id, session_number, status, professional_id, is_assessment_session, scheduled_at
    ) VALUES (
      v_cycle.id, 1, 'realizada'::public.session_status, v_cycle.assigned_professional_id,
      true, COALESCE(v_assessment_at, now() - interval '7 days')
    );
    v_existing := 1;
    v_has_assessment := true;
  END IF;

  v_next := v_existing + 1;
  IF v_next > v_target THEN
    RETURN v_existing;
  END IF;

  FOR v_i IN v_next..v_target LOOP
    INSERT INTO public.care_sessions (
      cycle_id, session_number, status, professional_id, is_assessment_session
    ) VALUES (
      v_cycle.id,
      v_i,
      'prevista'::public.session_status,
      v_cycle.assigned_professional_id,
      false
    );
  END LOOP;

  RETURN v_target;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_charge_payment(p_charge_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_charge public.charges%ROWTYPE;
  v_cycle public.care_cycles%ROWTYPE;
  v_sessions_after integer;
  v_patient_name text;
  v_finalize jsonb;
  v_scheduling_demand_id uuid := NULL;
BEGIN
  SELECT * INTO v_charge FROM public.charges WHERE id = p_charge_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cobrança não encontrada';
  END IF;

  IF v_charge.payment_status = 'pago' THEN
    IF v_charge.charge_kind = 'assessment_request' THEN
      v_finalize := public.patient_finalize_service_request_after_payment(p_charge_id);
      RETURN v_finalize || jsonb_build_object('charge_id', p_charge_id, 'already_paid', true);
    END IF;

    IF v_charge.cycle_id IS NOT NULL THEN
      PERFORM public.ensure_paid_cycle_sessions(v_charge.cycle_id);
    END IF;

    SELECT count(*) INTO v_sessions_after FROM public.care_sessions WHERE cycle_id = v_charge.cycle_id;
    RETURN jsonb_build_object(
      'charge_id', p_charge_id,
      'cycle_id', v_charge.cycle_id,
      'already_paid', true,
      'sessions_count', v_sessions_after
    );
  END IF;

  IF v_charge.payment_status NOT IN ('pendente', 'vencido') THEN
    RAISE EXCEPTION 'Cobrança não pode ser confirmada no status atual';
  END IF;

  UPDATE public.charges
  SET payment_status = 'pago', paid_at = now(), updated_at = now()
  WHERE id = p_charge_id;

  IF v_charge.charge_kind = 'assessment_request' THEN
    v_finalize := public.patient_finalize_service_request_after_payment(p_charge_id);

    SELECT p.full_name INTO v_patient_name FROM public.patients p WHERE p.id = v_charge.patient_id;

    PERFORM public.notify_patient_responsibles(
      v_charge.patient_id,
      'geral'::public.notification_type,
      'Pagamento da avaliação confirmado',
      coalesce(v_patient_name, 'Paciente') || ': estamos procurando um profissional parceiro para sua avaliação.',
      jsonb_build_object('charge_id', p_charge_id, 'href', '/paciente/solicitar')
    );

    RETURN v_finalize || jsonb_build_object('charge_id', p_charge_id, 'already_paid', false);
  END IF;

  IF v_charge.cycle_id IS NOT NULL THEN
    SELECT * INTO v_cycle FROM public.care_cycles WHERE id = v_charge.cycle_id;

    UPDATE public.care_cycles
    SET status = 'ativo', payment_status = 'pago', updated_at = now()
    WHERE id = v_cycle.id;

    PERFORM public.ensure_paid_cycle_sessions(v_cycle.id);

    SELECT pr.full_name INTO v_patient_name FROM public.patients pr WHERE pr.id = v_cycle.patient_id;

    v_scheduling_demand_id := public.ensure_cycle_start_scheduling_demand(v_cycle.id);

    PERFORM public.notify_patient_responsibles(
      v_charge.patient_id,
      'cobranca'::public.notification_type,
      'Pagamento confirmado',
      coalesce(v_patient_name, 'Paciente')
        || ': pagamento confirmado. Seu profissional parceiro vai registrar os horários fixos do ciclo.',
      jsonb_build_object(
        'charge_id', p_charge_id,
        'cycle_id', v_charge.cycle_id,
        'href', '/paciente/solicitar'
      )
    );
  END IF;

  SELECT count(*) INTO v_sessions_after FROM public.care_sessions WHERE cycle_id = v_charge.cycle_id;

  RETURN jsonb_build_object(
    'charge_id', p_charge_id,
    'cycle_id', v_charge.cycle_id,
    'sessions_count', coalesce(v_sessions_after, 0),
    'scheduling_demand_id', v_scheduling_demand_id,
    'already_paid', false
  );
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
  v_assigned_completed integer;
  v_gross integer;
  v_charged integer;
  v_credit integer;
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

  SELECT c.amount_cents, coalesce(c.assessment_credit_cents, 0)
  INTO v_charged, v_credit
  FROM public.charges c
  WHERE c.cycle_id = p_cycle_id AND c.payment_status = 'pago'
  ORDER BY c.paid_at DESC NULLS LAST
  LIMIT 1;

  v_gross := coalesce(v_charged + v_credit, v_cycle.session_count * v_cycle.session_unit_price_cents);
  v_completed_amt := least(v_completed * v_cycle.session_unit_price_cents, v_gross);
  v_assigned_amt := least(v_assigned_completed * v_cycle.session_unit_price_cents, v_gross);
  v_remaining := greatest(v_gross - v_completed_amt, 0);

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
