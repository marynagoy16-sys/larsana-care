-- Resposta da família à proposta de avaliação + checkout automático do 1º ciclo (SIM)

ALTER TABLE public.initial_assessments
  ADD COLUMN IF NOT EXISTS accepted_weekly_frequency integer;

ALTER TABLE public.initial_assessments
  DROP CONSTRAINT IF EXISTS initial_assessments_accepted_weekly_frequency_check;

ALTER TABLE public.initial_assessments
  ADD CONSTRAINT initial_assessments_accepted_weekly_frequency_check
    CHECK (accepted_weekly_frequency IS NULL OR accepted_weekly_frequency IN (1, 2, 3));

COMMENT ON COLUMN public.initial_assessments.accepted_weekly_frequency IS
  'Frequência semanal escolhida pela família ao aceitar a proposta (1-3x/semana)';

-- Cálculo interno de valor total (sem checagem de papel)
CREATE OR REPLACE FUNCTION public.compute_proposal_total_cents(
  p_region_id uuid,
  p_patient_level public.patient_level,
  p_session_count integer
)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_unit_price integer;
BEGIN
  IF p_session_count NOT IN (4, 8, 12) THEN
    RETURN NULL;
  END IF;

  IF p_region_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT e.session_price_cents INTO v_unit_price
  FROM public.pricing_matrix_entries e
  JOIN public.pricing_matrix_versions v ON v.id = e.version_id AND v.is_active = true
  WHERE e.region_id = p_region_id
    AND e.patient_level = p_patient_level
  LIMIT 1;

  IF v_unit_price IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN v_unit_price * p_session_count;
END;
$$;

-- Estende permissão de estimativa para responsável vinculado
CREATE OR REPLACE FUNCTION public.estimate_assessment_proposal_total_cents(
  p_patient_id uuid,
  p_patient_level public.patient_level,
  p_session_count integer
)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_region_id uuid;
BEGIN
  IF p_session_count NOT IN (4, 8, 12) THEN
    RAISE EXCEPTION 'Ciclo inválido';
  END IF;

  IF NOT (
    public.is_staff()
    OR EXISTS (
      SELECT 1
      FROM public.patients p
      WHERE p.id = p_patient_id
        AND p.allocated_professional_id = public.current_professional_id()
    )
    OR p_patient_id = ANY (public.current_patient_ids())
  ) THEN
    RAISE EXCEPTION 'Sem permissão para estimar valor da proposta';
  END IF;

  SELECT p.region_id INTO v_region_id
  FROM public.patients p
  WHERE p.id = p_patient_id;

  RETURN public.compute_proposal_total_cents(v_region_id, p_patient_level, p_session_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_patient_proposal_preview(p_assessment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assessment public.initial_assessments%ROWTYPE;
  v_patient_name text;
  v_professional_name text;
  v_region_id uuid;
  v_total integer;
BEGIN
  SELECT * INTO v_assessment
  FROM public.initial_assessments
  WHERE id = p_assessment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Avaliação não encontrada';
  END IF;

  IF NOT (v_assessment.patient_id = ANY (public.current_patient_ids())) THEN
    RAISE EXCEPTION 'Sem permissão para visualizar esta proposta';
  END IF;

  IF v_assessment.status NOT IN ('proposta_enviada', 'em_analise') OR v_assessment.family_response IS NOT NULL THEN
    RAISE EXCEPTION 'Não há proposta pendente para responder';
  END IF;

  SELECT p.full_name, p.region_id INTO v_patient_name, v_region_id
  FROM public.patients p
  WHERE p.id = v_assessment.patient_id;

  SELECT pr.full_name INTO v_professional_name
  FROM public.professionals pr
  WHERE pr.id = v_assessment.evaluator_professional_id;

  v_total := public.compute_proposal_total_cents(
    v_region_id,
    v_assessment.proposed_patient_level,
    v_assessment.proposed_session_count
  );

  RETURN jsonb_build_object(
    'assessment_id', v_assessment.id,
    'patient_id', v_assessment.patient_id,
    'patient_name', v_patient_name,
    'professional_name', v_professional_name,
    'proposed_weekly_frequency', v_assessment.proposed_weekly_frequency,
    'proposed_session_count', v_assessment.proposed_session_count,
    'proposed_patient_level', v_assessment.proposed_patient_level,
    'proposal_sent_at', v_assessment.proposal_sent_at,
    'response_deadline_at', v_assessment.response_deadline_at,
    'status', v_assessment.status,
    'total_amount_cents', v_total
  );
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
      payment_status
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
      'pendente'
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
      'charge_id', v_charge_id
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

REVOKE ALL ON FUNCTION public.get_patient_proposal_preview(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_patient_proposal_preview(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.accept_assessment_proposal(uuid, public.family_response, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_assessment_proposal(uuid, public.family_response, integer) TO authenticated;

-- Família responde apenas via RPC (sem UPDATE direto)
DROP POLICY IF EXISTS assessments_patient_response ON public.initial_assessments;

COMMENT ON FUNCTION public.accept_assessment_proposal(uuid, public.family_response, integer) IS
  'Família aceita (SIM) ou recusa (NAO) proposta: SIM cria ciclo 1 + cobrança; NAO cria cobrança R$50.';
