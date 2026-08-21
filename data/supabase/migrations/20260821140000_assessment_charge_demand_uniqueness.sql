-- Unicidade: uma cobrança pendente de avaliação e uma demanda ativa por paciente
-- Migration: 20260821140000_assessment_charge_demand_uniqueness

-- Dedupe cobranças pendentes duplicadas (mantém a mais recente)
DELETE FROM public.charges c_old
USING public.charges c_keep
WHERE c_old.patient_id = c_keep.patient_id
  AND c_old.charge_kind = 'assessment_request'
  AND c_keep.charge_kind = 'assessment_request'
  AND c_old.payment_status = 'pendente'
  AND c_keep.payment_status = 'pendente'
  AND c_old.id <> c_keep.id
  AND c_old.created_at < c_keep.created_at;

-- Dedupe demandas ativas duplicadas (mantém a mais recente)
DELETE FROM public.demands d_old
USING public.demands d_keep
WHERE d_old.patient_id = d_keep.patient_id
  AND d_old.status IN ('aberta', 'alocada')
  AND d_keep.status IN ('aberta', 'alocada')
  AND d_old.id <> d_keep.id
  AND d_old.created_at < d_keep.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_charges_one_pending_assessment
  ON public.charges (patient_id)
  WHERE charge_kind = 'assessment_request' AND payment_status = 'pendente';

CREATE UNIQUE INDEX IF NOT EXISTS idx_demands_one_active_per_patient
  ON public.demands (patient_id)
  WHERE status IN ('aberta', 'alocada');

-- ===== patient_create_assessment_request_charge (idempotente com constraint) =====
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

  SELECT c.id INTO v_existing_charge
  FROM public.charges c
  WHERE c.patient_id = v_patient_id
    AND c.charge_kind = 'assessment_request'
    AND c.payment_status = 'pendente'
  ORDER BY c.created_at DESC
  LIMIT 1;

  IF v_existing_charge IS NOT NULL THEN
    RETURN jsonb_build_object('charge_id', v_existing_charge, 'already_exists', true);
  END IF;

  SELECT * INTO v_settings FROM public.get_platform_settings();

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
      v_settings.assessment_fee_cents,
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

      RETURN jsonb_build_object('charge_id', v_existing_charge, 'already_exists', true);
  END;

  RETURN jsonb_build_object(
    'charge_id', v_charge_id,
    'amount_cents', v_settings.assessment_fee_cents,
    'already_exists', false
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.patient_create_assessment_request_charge(public.payment_method) TO authenticated;

-- ===== patient_finalize_service_request_after_payment (idempotente com constraint) =====
CREATE OR REPLACE FUNCTION public.patient_finalize_service_request_after_payment(p_charge_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_charge public.charges%ROWTYPE;
  v_patient public.patients%ROWTYPE;
  v_primary_address_id uuid;
  v_existing public.demands%ROWTYPE;
  v_new_id uuid;
BEGIN
  SELECT * INTO v_charge FROM public.charges WHERE id = p_charge_id FOR UPDATE;

  IF NOT FOUND OR v_charge.charge_kind <> 'assessment_request' THEN
    RAISE EXCEPTION 'Cobrança de avaliação inválida';
  END IF;

  IF v_charge.payment_status <> 'pago' THEN
    RAISE EXCEPTION 'Pagamento da avaliação ainda não confirmado';
  END IF;

  UPDATE public.patients
  SET assessment_fee_paid_charge_id = p_charge_id, updated_at = now()
  WHERE id = v_charge.patient_id;

  SELECT * INTO v_patient FROM public.patients WHERE id = v_charge.patient_id;

  SELECT pa.id INTO v_primary_address_id
  FROM public.patient_addresses pa
  WHERE pa.patient_id = v_charge.patient_id
  ORDER BY pa.is_primary DESC, pa.created_at ASC
  LIMIT 1;

  IF v_primary_address_id IS NULL THEN
    RAISE EXCEPTION 'Endereço do paciente não encontrado';
  END IF;

  SELECT * INTO v_existing
  FROM public.demands d
  WHERE d.patient_id = v_charge.patient_id
    AND d.status IN ('aberta', 'alocada')
  ORDER BY d.created_at DESC
  LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    UPDATE public.charges SET demand_id = v_existing.id WHERE id = p_charge_id;
    RETURN jsonb_build_object(
      'success', true,
      'demand_id', v_existing.id,
      'already_exists', true,
      'status', v_existing.status
    );
  END IF;

  BEGIN
    INSERT INTO public.demands (patient_id, address_id, region_id, status, request_source)
    VALUES (v_charge.patient_id, v_primary_address_id, v_patient.region_id, 'aberta', 'paciente_app')
    RETURNING id INTO v_new_id;
  EXCEPTION
    WHEN unique_violation THEN
      SELECT * INTO v_existing
      FROM public.demands d
      WHERE d.patient_id = v_charge.patient_id
        AND d.status IN ('aberta', 'alocada')
      ORDER BY d.created_at DESC
      LIMIT 1;

      IF v_existing.id IS NULL THEN
        RAISE;
      END IF;

      UPDATE public.charges SET demand_id = v_existing.id WHERE id = p_charge_id;
      RETURN jsonb_build_object(
        'success', true,
        'demand_id', v_existing.id,
        'already_exists', true,
        'status', v_existing.status
      );
  END;

  UPDATE public.charges SET demand_id = v_new_id WHERE id = p_charge_id;

  RETURN jsonb_build_object(
    'success', true,
    'demand_id', v_new_id,
    'already_exists', false,
    'status', 'aberta'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.patient_finalize_service_request_after_payment(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.patient_finalize_service_request_after_payment(uuid) TO service_role;
