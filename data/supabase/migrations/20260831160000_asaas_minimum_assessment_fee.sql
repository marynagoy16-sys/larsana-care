-- Asaas exige cobrança mínima de R$ 5,00. Corrige taxa de teste e cobranças pendentes.

UPDATE public.platform_settings
SET
  assessment_fee_cents = GREATEST(assessment_fee_cents, 500),
  updated_at = now()
WHERE assessment_fee_cents < 500;

UPDATE public.charges c
SET
  amount_cents = ps.assessment_fee_cents,
  updated_at = now()
FROM public.platform_settings ps
WHERE c.charge_kind = 'assessment_request'
  AND c.payment_status = 'pendente'
  AND c.asaas_payment_id IS NULL
  AND c.amount_cents IS DISTINCT FROM ps.assessment_fee_cents;

CREATE OR REPLACE FUNCTION public.patient_create_assessment_request_charge(
  p_payment_method public.payment_method DEFAULT 'PIX'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id uuid;
  v_patient public.patients%ROWTYPE;
  v_settings public.platform_settings%ROWTYPE;
  v_existing_charge uuid;
  v_charge_id uuid;
  v_amount_cents integer;
BEGIN
  IF public.current_user_role() <> 'paciente'::public.user_role THEN
    RAISE EXCEPTION 'Apenas pacientes podem criar cobrança de avaliação';
  END IF;

  v_patient_id := public.current_patient_id_for_user();
  IF v_patient_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum paciente vinculado';
  END IF;

  SELECT * INTO v_patient FROM public.patients WHERE id = v_patient_id;

  IF NOT public.region_has_patient_service(v_patient.region_id) THEN
    RAISE EXCEPTION 'Região sem cobertura — não é possível pagar avaliação';
  END IF;

  IF public.patient_has_paid_assessment_fee(v_patient_id) THEN
    RETURN jsonb_build_object(
      'already_paid', true,
      'message', 'Taxa de avaliação já paga'
    );
  END IF;

  SELECT * INTO v_settings FROM public.get_platform_settings();
  v_amount_cents := GREATEST(v_settings.assessment_fee_cents, 500);

  SELECT c.id INTO v_existing_charge
  FROM public.charges c
  WHERE c.patient_id = v_patient_id
    AND c.charge_kind = 'assessment_request'
    AND c.payment_status = 'pendente'
  ORDER BY c.created_at DESC
  LIMIT 1;

  IF v_existing_charge IS NOT NULL THEN
    UPDATE public.charges
    SET
      amount_cents = v_amount_cents,
      payment_method = p_payment_method,
      updated_at = now()
    WHERE id = v_existing_charge
      AND asaas_payment_id IS NULL
      AND amount_cents IS DISTINCT FROM v_amount_cents;

    RETURN jsonb_build_object(
      'charge_id', v_existing_charge,
      'amount_cents', v_amount_cents,
      'already_exists', true
    );
  END IF;

  BEGIN
    INSERT INTO public.charges (
      patient_id,
      amount_cents,
      payment_method,
      payment_status,
      due_date,
      description,
      charge_kind
    ) VALUES (
      v_patient_id,
      v_amount_cents,
      p_payment_method,
      'pendente',
      current_date,
      'Taxa de avaliação domiciliar Larsana Care',
      'assessment_request'
    )
    RETURNING id INTO v_charge_id;
  EXCEPTION
    WHEN unique_violation THEN
      SELECT c.id INTO v_existing_charge
      FROM public.charges c
      WHERE c.patient_id = v_patient_id
        AND c.charge_kind = 'assessment_request'
        AND c.payment_status = 'pendente'
      ORDER BY c.created_at DESC
      LIMIT 1;

      IF v_existing_charge IS NULL THEN
        RAISE;
      END IF;

      RETURN jsonb_build_object(
        'charge_id', v_existing_charge,
        'amount_cents', v_amount_cents,
        'already_exists', true
      );
  END;

  RETURN jsonb_build_object(
    'charge_id', v_charge_id,
    'amount_cents', v_amount_cents,
    'already_exists', false
  );
END;
$$;
