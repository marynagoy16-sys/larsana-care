-- Fechamento financeiro automático quando todas as terapias do ciclo são realizadas.

CREATE OR REPLACE FUNCTION public.cycle_has_all_sessions_completed(p_cycle_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.care_cycles c
    WHERE c.id = p_cycle_id
      AND (
        SELECT count(*)::integer
        FROM public.care_sessions s
        WHERE s.cycle_id = c.id
      ) = c.session_count
      AND (
        SELECT count(*)::integer
        FROM public.care_sessions s
        WHERE s.cycle_id = c.id
          AND s.status = 'realizada'::public.session_status
      ) = c.session_count
      AND NOT EXISTS (
        SELECT 1
        FROM public.care_sessions s
        WHERE s.cycle_id = c.id
          AND s.status IN ('prevista', 'remarcada')
      )
  );
$$;

CREATE OR REPLACE FUNCTION public._close_cycle_financially_impl(
  p_cycle_id uuid,
  p_pause_type public.pause_type DEFAULT 'none',
  p_admin_decision text DEFAULT NULL,
  p_created_by uuid DEFAULT NULL
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
      'larsana_total_cents', v_calc.larsana_total_cents,
      'auto_closed', p_created_by IS NULL
    ),
    p_created_by
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
      p_created_by,
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
BEGIN
  IF NOT public.is_staff_role(ARRAY['admin', 'financeiro', 'gestao']::public.user_role[]) THEN
    RAISE EXCEPTION 'Sem permissão para fechamento financeiro';
  END IF;

  RETURN public._close_cycle_financially_impl(
    p_cycle_id,
    p_pause_type,
    p_admin_decision,
    auth.uid()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.try_auto_close_cycle_financially(p_cycle_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle public.care_cycles%ROWTYPE;
  v_closure_id uuid;
  v_patient_name text;
BEGIN
  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = p_cycle_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF v_cycle.status <> 'ativo'::public.cycle_status THEN
    RETURN NULL;
  END IF;

  IF v_cycle.payment_status <> 'pago'::public.payment_status THEN
    RETURN NULL;
  END IF;

  IF v_cycle.active_pause_id IS NOT NULL THEN
    RETURN NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM public.financial_closures fc WHERE fc.cycle_id = p_cycle_id) THEN
    RETURN NULL;
  END IF;

  IF NOT public.cycle_has_all_sessions_completed(p_cycle_id) THEN
    RETURN NULL;
  END IF;

  v_closure_id := public._close_cycle_financially_impl(
    p_cycle_id,
    'none'::public.pause_type,
    'Fechamento automático: todas as terapias realizadas',
    NULL
  );

  SELECT p.full_name INTO v_patient_name FROM public.patients p WHERE p.id = v_cycle.patient_id;

  IF v_cycle.assigned_professional_id IS NOT NULL THEN
    PERFORM public.notify_professional_user(
      v_cycle.assigned_professional_id,
      'geral'::public.notification_type,
      'Ciclo concluído',
      coalesce(v_patient_name, 'Paciente') || ': todas as terapias do ciclo '
        || v_cycle.cycle_number::text || ' foram realizadas. Envie a NF para liberar seu repasse.',
      jsonb_build_object(
        'cycle_id', p_cycle_id,
        'closure_id', v_closure_id,
        'href', '/profissional/repasses'
      )
    );
  END IF;

  PERFORM public.notify_patient_responsibles(
    v_cycle.patient_id,
    'geral'::public.notification_type,
    'Ciclo concluído',
    'Parabéns! Você concluiu todas as terapias do ciclo ' || v_cycle.cycle_number::text || '.',
    jsonb_build_object(
      'cycle_id', p_cycle_id,
      'href', '/paciente/tratamento'
    )
  );

  RETURN v_closure_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_auto_close_cycle_on_session_realizada()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
    AND NEW.status = 'realizada'::public.session_status
    AND OLD.status IS DISTINCT FROM 'realizada'::public.session_status
    AND NEW.cycle_id IS NOT NULL
  THEN
    PERFORM public.try_auto_close_cycle_financially(NEW.cycle_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_close_cycle_on_session_realizada ON public.care_sessions;

CREATE TRIGGER trg_auto_close_cycle_on_session_realizada
  AFTER UPDATE OF status ON public.care_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_auto_close_cycle_on_session_realizada();

REVOKE ALL ON FUNCTION public.cycle_has_all_sessions_completed(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._close_cycle_financially_impl(uuid, public.pause_type, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.try_auto_close_cycle_financially(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.trg_auto_close_cycle_on_session_realizada() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.cycle_has_all_sessions_completed(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.try_auto_close_cycle_financially(uuid) TO service_role;
