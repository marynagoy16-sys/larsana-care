-- Patients (and any authenticated client) must not confirm payment via simulation.
-- The RPC remains available to service_role (edge webhook / ops) until Asaas production.

REVOKE ALL ON FUNCTION public.simulate_charge_payment(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.simulate_charge_payment(uuid) FROM authenticated, anon;
GRANT EXECUTE ON FUNCTION public.simulate_charge_payment(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.simulate_charge_payment(p_charge_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_charge public.charges%ROWTYPE;
  v_cycle public.care_cycles%ROWTYPE;
  v_weekly_freq integer;
  v_days_between numeric;
  v_i integer;
  v_assessment_at timestamptz;
  v_sessions_before integer;
  v_sessions_after integer;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'Simulação de pagamento indisponível';
  END IF;

  SELECT * INTO v_charge
  FROM public.charges
  WHERE id = p_charge_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cobrança não encontrada';
  END IF;

  IF v_charge.payment_status = 'pago' THEN
    SELECT count(*) INTO v_sessions_after
    FROM public.care_sessions
    WHERE cycle_id = v_charge.cycle_id;

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
  SET
    payment_status = 'pago',
    paid_at = now(),
    updated_at = now()
  WHERE id = p_charge_id;

  IF v_charge.cycle_id IS NULL THEN
    RETURN jsonb_build_object(
      'charge_id', p_charge_id,
      'cycle_id', null,
      'sessions_count', 0
    );
  END IF;

  SELECT * INTO v_cycle
  FROM public.care_cycles
  WHERE id = v_charge.cycle_id;

  SELECT count(*) INTO v_sessions_before
  FROM public.care_sessions
  WHERE cycle_id = v_cycle.id;

  IF v_sessions_before = 0 THEN
    SELECT COALESCE(
      LEAST(3, GREATEST(1, ROUND(p.suggested_weekly_frequency)::integer)),
      2
    ) INTO v_weekly_freq
    FROM public.patients p
    WHERE p.id = v_cycle.patient_id;

    v_days_between := 7.0 / v_weekly_freq;

    SELECT ia.created_at INTO v_assessment_at
    FROM public.initial_assessments ia
    WHERE ia.patient_id = v_cycle.patient_id
    ORDER BY ia.created_at DESC
    LIMIT 1;

    FOR v_i IN 1..v_cycle.session_count LOOP
      INSERT INTO public.care_sessions (
        cycle_id,
        session_number,
        status,
        professional_id,
        is_assessment_session,
        scheduled_at
      ) VALUES (
        v_cycle.id,
        v_i,
        CASE
          WHEN v_i = 1 AND v_cycle.cycle_number = 1 THEN 'realizada'::public.session_status
          ELSE 'prevista'::public.session_status
        END,
        v_cycle.assigned_professional_id,
        v_i = 1 AND v_cycle.cycle_number = 1,
        CASE
          WHEN v_i = 1 AND v_cycle.cycle_number = 1 THEN
            COALESCE(v_assessment_at, now() - interval '7 days')
          WHEN v_cycle.cycle_number = 1 THEN
            now() + ((v_i - 1) * v_days_between) * interval '1 day'
          ELSE
            now() + ((v_i - 1) * v_days_between) * interval '1 day'
        END
      );
    END LOOP;
  END IF;

  SELECT count(*) INTO v_sessions_after
  FROM public.care_sessions
  WHERE cycle_id = v_cycle.id;

  RETURN jsonb_build_object(
    'charge_id', p_charge_id,
    'cycle_id', v_cycle.id,
    'cycle_status', (SELECT status FROM public.care_cycles WHERE id = v_cycle.id),
    'sessions_count', v_sessions_after,
    'already_paid', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.simulate_charge_payment(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.simulate_charge_payment(uuid) FROM authenticated, anon;
GRANT EXECUTE ON FUNCTION public.simulate_charge_payment(uuid) TO service_role;

COMMENT ON FUNCTION public.simulate_charge_payment(uuid) IS
  'Uso interno (service_role) apenas. Clientes autenticados não podem simular pagamento; Asaas produção é o gate da v1 pública.';
