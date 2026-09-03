-- Registra aceites legais do ciclo ao aceitar proposta de tratamento.

CREATE OR REPLACE FUNCTION public.accept_assessment_proposal(
  p_assessment_id uuid,
  p_response public.family_response,
  p_chosen_weekly_frequency integer DEFAULT NULL,
  p_payment_timing public.cycle_payment_timing DEFAULT 'antecipado',
  p_accept_anexo_i boolean DEFAULT false,
  p_accept_anexo_ii boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assessment public.initial_assessments%ROWTYPE;
  v_patient public.patients%ROWTYPE;
  v_settings public.platform_settings%ROWTYPE;
  v_pricing_version_id uuid;
  v_unit_price integer;
  v_gross integer;
  v_total integer;
  v_credit integer := 0;
  v_discount integer := 0;
  v_session_count integer;
  v_cycle_id uuid;
  v_charge_id uuid;
  v_cycle_number integer;
  v_now timestamptz := now();
  v_due_date date;
BEGIN
  SELECT * INTO v_assessment FROM public.initial_assessments WHERE id = p_assessment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Avaliação não encontrada'; END IF;
  IF NOT (v_assessment.patient_id = ANY (public.current_patient_ids())) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;
  IF v_assessment.family_response IS NOT NULL THEN RAISE EXCEPTION 'Proposta já respondida'; END IF;
  IF v_assessment.status NOT IN ('proposta_enviada', 'em_analise') THEN
    RAISE EXCEPTION 'Proposta não aguarda resposta';
  END IF;

  SELECT * INTO v_settings FROM public.get_platform_settings();

  IF p_response = 'NAO' THEN
    UPDATE public.initial_assessments
    SET family_response = 'NAO', responded_at = v_now, responded_by_user_id = auth.uid(),
        status = 'respondida_nao', updated_at = v_now
    WHERE id = p_assessment_id;

    RETURN jsonb_build_object('assessment_id', p_assessment_id, 'family_response', 'NAO');
  END IF;

  IF p_chosen_weekly_frequency IS NULL THEN
    RAISE EXCEPTION 'Informe a frequência semanal escolhida';
  END IF;

  IF NOT COALESCE(p_accept_anexo_i, false) OR NOT COALESCE(p_accept_anexo_ii, false) THEN
    RAISE EXCEPTION 'Aceite dos Anexos I e II Comercial/Cancelamento é obrigatório';
  END IF;

  IF p_chosen_weekly_frequency NOT IN (SELECT unnest(public.proposal_frequency_options(v_assessment.proposed_weekly_frequency))) THEN
    RAISE EXCEPTION 'Frequência escolhida inválida para esta proposta';
  END IF;

  v_session_count := public.scale_session_count_for_frequency(
    v_assessment.proposed_session_count,
    v_assessment.proposed_weekly_frequency,
    p_chosen_weekly_frequency
  );

  SELECT * INTO v_patient FROM public.patients WHERE id = v_assessment.patient_id;

  v_gross := public.compute_proposal_total_cents(v_patient.region_id, v_assessment.proposed_patient_level, v_session_count);
  IF v_gross IS NULL THEN RAISE EXCEPTION 'Não foi possível calcular valor do ciclo'; END IF;

  IF public.patient_has_paid_assessment_fee(v_assessment.patient_id) THEN
    v_credit := v_settings.assessment_fee_cents;
  END IF;

  v_total := GREATEST(0, v_gross - v_credit);

  IF p_payment_timing = 'antecipado' AND v_settings.early_cycle_discount_pct > 0 THEN
    v_discount := ROUND(v_total * v_settings.early_cycle_discount_pct / 100.0)::integer;
    v_total := GREATEST(0, v_total - v_discount);
  END IF;

  SELECT id INTO v_pricing_version_id FROM public.pricing_matrix_versions WHERE is_active = true LIMIT 1;
  SELECT e.session_price_cents INTO v_unit_price
  FROM public.pricing_matrix_entries e
  WHERE e.version_id = v_pricing_version_id
    AND e.region_id = v_patient.region_id
    AND e.patient_level = v_assessment.proposed_patient_level
  LIMIT 1;

  UPDATE public.initial_assessments
  SET family_response = 'SIM', accepted_weekly_frequency = p_chosen_weekly_frequency,
      responded_at = v_now, responded_by_user_id = auth.uid(), status = 'respondida_sim', updated_at = v_now
  WHERE id = p_assessment_id;

  UPDATE public.patients
  SET suggested_weekly_frequency = p_chosen_weekly_frequency,
      patient_level = v_assessment.proposed_patient_level, updated_at = v_now
  WHERE id = v_assessment.patient_id;

  SELECT COALESCE(max(cycle_number), 0) + 1 INTO v_cycle_number
  FROM public.care_cycles WHERE patient_id = v_assessment.patient_id;

  INSERT INTO public.care_cycles (
    patient_id, cycle_number, session_count, assigned_professional_id,
    pricing_version_id, region_id, patient_level, session_unit_price_cents,
    total_amount_cents, status, payment_status
  ) VALUES (
    v_assessment.patient_id, v_cycle_number, v_session_count,
    v_assessment.evaluator_professional_id, v_pricing_version_id, v_patient.region_id,
    v_assessment.proposed_patient_level, v_unit_price, v_total,
    'rascunho', 'pendente'
  ) RETURNING id INTO v_cycle_id;

  PERFORM public.record_cycle_legal_acceptances(v_cycle_id, true, true);

  UPDATE public.care_cycles
  SET status = 'aguardando_pagamento', updated_at = v_now
  WHERE id = v_cycle_id;

  IF p_payment_timing = 'pos_ciclo' THEN
    v_due_date := (v_now + (v_session_count * interval '7 days') / GREATEST(1, p_chosen_weekly_frequency))::date;
    v_total := v_gross - v_credit;
    IF v_settings.late_fine_pct > 0 THEN
      v_total := v_total + ROUND(v_total * v_settings.late_fine_pct / 100.0)::integer;
    END IF;
  ELSE
    v_due_date := v_now::date;
  END IF;

  INSERT INTO public.charges (
    patient_id, cycle_id, assessment_id, amount_cents, payment_method,
    payment_status, due_date, description, charge_kind, assessment_credit_cents, payment_timing
  ) VALUES (
    v_assessment.patient_id, v_cycle_id, p_assessment_id, v_total, 'PIX', 'pendente',
    v_due_date,
    format('Pagamento ciclo %s — %s sessões (%sx/semana)', v_cycle_number, v_session_count, p_chosen_weekly_frequency),
    'cycle', v_credit, p_payment_timing
  ) RETURNING id INTO v_charge_id;

  RETURN jsonb_build_object(
    'assessment_id', p_assessment_id,
    'family_response', 'SIM',
    'cycle_id', v_cycle_id,
    'charge_id', v_charge_id,
    'session_count', v_session_count,
    'amount_cents', v_total,
    'assessment_credit_cents', v_credit,
    'early_discount_cents', v_discount
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_assessment_proposal(
  uuid,
  public.family_response,
  integer,
  public.cycle_payment_timing,
  boolean,
  boolean
) TO authenticated;
