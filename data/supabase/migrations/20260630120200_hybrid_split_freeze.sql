-- LarsanaCare: split híbrido PF/PJ + bônus Bronze/Prata/Ouro congelado na cobrança
-- Migration: 20260630120200_hybrid_split_freeze

ALTER TABLE public.commission_rules
  ADD COLUMN IF NOT EXISTS bonus_pp_percent numeric(5, 2) NOT NULL DEFAULT 0
    CHECK (bonus_pp_percent >= 0 AND bonus_pp_percent <= 30);

UPDATE public.commission_rules
SET bonus_pp_percent = CASE pp_class
  WHEN 'PRATA' THEN 5
  WHEN 'OURO' THEN 10
  ELSE 0
END
WHERE bonus_pp_percent = 0;

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
  v_base_pp numeric;
  v_bonus numeric := 0;
  v_pp_pct numeric;
  v_larsana_pct numeric;
  v_retention numeric;
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
    SELECT fmr.larsana_percent INTO v_retention
    FROM public.first_month_retention_rules fmr
    WHERE fmr.version_id = v_cycle.pricing_version_id;

    IF v_retention IS NULL THEN
      v_retention := CASE WHEN v_pp.person_type = 'PJ' THEN 30 ELSE 40 END;
    END IF;

    IF v_pp.person_type = 'PJ' AND v_retention = 40 THEN
      v_retention := 30;
    END IF;

    v_pp_pct := 100 - v_retention;
    v_larsana_pct := v_retention;
  ELSE
    v_base_pp := CASE v_pp.person_type
      WHEN 'PJ' THEN 80
      ELSE 70
    END;

    SELECT cr.bonus_pp_percent INTO v_bonus
    FROM public.commission_rules cr
    WHERE cr.version_id = v_cycle.pricing_version_id
      AND cr.pp_class = v_pp.pp_class;

    v_bonus := COALESCE(v_bonus, 0);
    v_pp_pct := LEAST(v_base_pp + v_bonus, 95);
    v_larsana_pct := 100 - v_pp_pct;
  END IF;

  RETURN QUERY SELECT v_pp_pct, v_larsana_pct;
END;
$$;

CREATE OR REPLACE FUNCTION public.freeze_cycle_split_percentages(p_cycle_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pp_pct numeric;
  v_larsana_pct numeric;
BEGIN
  SELECT r.pp_percent, r.larsana_percent
  INTO v_pp_pct, v_larsana_pct
  FROM public.resolve_cycle_split_percentages(p_cycle_id) r;

  UPDATE public.care_cycles
  SET
    pp_percentage = v_pp_pct,
    larsana_percentage = v_larsana_pct,
    updated_at = now()
  WHERE id = p_cycle_id
    AND pp_percentage IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.on_payment_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.payment_status = 'pago' AND OLD.payment_status IS DISTINCT FROM 'pago' THEN
    IF NEW.cycle_id IS NOT NULL THEN
      UPDATE public.care_cycles
      SET payment_status = 'pago',
          status = CASE WHEN status = 'aguardando_pagamento' THEN 'ativo' ELSE status END,
          started_at = COALESCE(started_at, now())
      WHERE id = NEW.cycle_id;

      PERFORM public.freeze_cycle_split_percentages(NEW.cycle_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_assessment_proposal(
  p_assessment_id uuid,
  p_response public.family_response,
  p_chosen_weekly_frequency integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assessment public.initial_assessments%ROWTYPE;
  v_patient public.patients%ROWTYPE;
  v_pricing_version_id uuid;
  v_unit_price integer;
  v_total integer;
  v_cycle_id uuid;
  v_charge_id uuid;
  v_cycle_number integer;
  v_now timestamptz := now();
  v_due_date date;
  v_pp_pct numeric;
  v_larsana_pct numeric;
  v_pp public.professionals%ROWTYPE;
  v_retention numeric;
BEGIN
  SELECT * INTO v_assessment
  FROM public.initial_assessments
  WHERE id = p_assessment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Avaliação não encontrada';
  END IF;

  IF NOT (v_assessment.patient_id = ANY (public.current_patient_ids())) THEN
    RAISE EXCEPTION 'Sem permissão para responder esta proposta';
  END IF;

  IF v_assessment.family_response IS NOT NULL THEN
    RAISE EXCEPTION 'Esta proposta já foi respondida';
  END IF;

  IF v_assessment.status NOT IN ('proposta_enviada', 'em_analise') THEN
    RAISE EXCEPTION 'Proposta não está aguardando resposta';
  END IF;

  IF v_assessment.response_deadline_at IS NOT NULL AND v_now > v_assessment.response_deadline_at THEN
    RAISE EXCEPTION 'Prazo para resposta encerrado';
  END IF;

  SELECT * INTO v_patient
  FROM public.patients
  WHERE id = v_assessment.patient_id;

  IF p_response = 'SIM' THEN
    IF p_chosen_weekly_frequency IS NULL OR p_chosen_weekly_frequency NOT IN (1, 2, 3) THEN
      RAISE EXCEPTION 'Informe a frequência semanal desejada (1, 2 ou 3)';
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.care_cycles cc
      WHERE cc.patient_id = v_assessment.patient_id
    ) THEN
      RAISE EXCEPTION 'Paciente já possui ciclo de tratamento';
    END IF;

    SELECT id INTO v_pricing_version_id
    FROM public.pricing_matrix_versions
    WHERE is_active = true
    LIMIT 1;

    IF v_pricing_version_id IS NULL THEN
      RAISE EXCEPTION 'Matriz de preços vigente não encontrada';
    END IF;

    SELECT e.session_price_cents INTO v_unit_price
    FROM public.pricing_matrix_entries e
    WHERE e.version_id = v_pricing_version_id
      AND e.region_id = v_patient.region_id
      AND e.patient_level = v_assessment.proposed_patient_level
    LIMIT 1;

    IF v_unit_price IS NULL THEN
      RAISE EXCEPTION 'Preço não configurado para região e nível do paciente';
    END IF;

    SELECT * INTO v_pp
    FROM public.professionals
    WHERE id = v_assessment.evaluator_professional_id;

    SELECT fmr.larsana_percent INTO v_retention
    FROM public.first_month_retention_rules fmr
    WHERE fmr.version_id = v_pricing_version_id;

    v_retention := COALESCE(v_retention, CASE WHEN v_pp.person_type = 'PJ' THEN 30 ELSE 40 END);
    IF v_pp.person_type = 'PJ' AND v_retention = 40 THEN
      v_retention := 30;
    END IF;

    v_pp_pct := 100 - v_retention;
    v_larsana_pct := v_retention;

    v_total := v_unit_price * v_assessment.proposed_session_count;
    v_cycle_number := 1;
    v_due_date := (v_now + interval '7 days')::date;

    UPDATE public.initial_assessments
    SET
      family_response = 'SIM',
      accepted_weekly_frequency = p_chosen_weekly_frequency,
      responded_at = v_now,
      responded_by_user_id = auth.uid(),
      status = 'respondida_sim',
      updated_at = v_now
    WHERE id = p_assessment_id;

    UPDATE public.patients
    SET
      suggested_weekly_frequency = p_chosen_weekly_frequency,
      patient_level = v_assessment.proposed_patient_level,
      updated_at = v_now
    WHERE id = v_assessment.patient_id;

    INSERT INTO public.care_cycles (
      patient_id,
      cycle_number,
      session_count,
      assigned_professional_id,
      pricing_version_id,
      region_id,
      patient_level,
      session_unit_price_cents,
      total_amount_cents,
      status,
      payment_status,
      is_first_month_capture,
      pp_percentage,
      larsana_percentage
    ) VALUES (
      v_assessment.patient_id,
      v_cycle_number,
      v_assessment.proposed_session_count,
      v_assessment.evaluator_professional_id,
      v_pricing_version_id,
      v_patient.region_id,
      v_assessment.proposed_patient_level,
      v_unit_price,
      v_total,
      'aguardando_pagamento',
      'pendente',
      true,
      v_pp_pct,
      v_larsana_pct
    )
    RETURNING id INTO v_cycle_id;

    INSERT INTO public.charges (
      patient_id,
      cycle_id,
      assessment_id,
      amount_cents,
      payment_method,
      payment_status,
      due_date,
      description
    ) VALUES (
      v_assessment.patient_id,
      v_cycle_id,
      p_assessment_id,
      v_total,
      'PIX',
      'pendente',
      v_due_date,
      format('Pagamento ciclo 1 — %s sessões', v_assessment.proposed_session_count)
    )
    RETURNING id INTO v_charge_id;

    RETURN jsonb_build_object(
      'assessment_id', p_assessment_id,
      'family_response', 'SIM',
      'cycle_id', v_cycle_id,
      'charge_id', v_charge_id,
      'pp_percentage', v_pp_pct,
      'larsana_percentage', v_larsana_pct
    );
  END IF;

  IF p_response = 'NAO' THEN
    v_due_date := (v_now + interval '30 days')::date;

    UPDATE public.initial_assessments
    SET
      family_response = 'NAO',
      accepted_weekly_frequency = NULL,
      responded_at = v_now,
      responded_by_user_id = auth.uid(),
      status = 'respondida_nao',
      updated_at = v_now
    WHERE id = p_assessment_id;

    INSERT INTO public.charges (
      patient_id,
      assessment_id,
      amount_cents,
      payment_method,
      payment_status,
      due_date,
      description
    ) VALUES (
      v_assessment.patient_id,
      p_assessment_id,
      5000,
      'PIX',
      'pendente',
      v_due_date,
      'Taxa de avaliação domiciliar'
    )
    RETURNING id INTO v_charge_id;

    INSERT INTO public.assessment_charges (assessment_id, charge_id)
    VALUES (p_assessment_id, v_charge_id)
    ON CONFLICT (assessment_id) DO UPDATE SET charge_id = EXCLUDED.charge_id;

    RETURN jsonb_build_object(
      'assessment_id', p_assessment_id,
      'family_response', 'NAO',
      'charge_id', v_charge_id
    );
  END IF;

  RAISE EXCEPTION 'Resposta inválida';
END;
$$;
