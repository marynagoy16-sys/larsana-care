-- LarsanaCare: Asaas integration — import validation, PIX copy-paste, payment notifications
-- Migration: 20260820160000_asaas_integration

ALTER TABLE public.charges
  ADD COLUMN IF NOT EXISTS pix_copy_paste text;

COMMENT ON COLUMN public.charges.pix_copy_paste IS 'PIX copia e cola (Asaas)';

-- Confirma pagamento (webhook Asaas ou simulação dev) + notificação in-app ao responsável
CREATE OR REPLACE FUNCTION public.confirm_charge_payment(p_charge_id uuid)
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
  v_patient_name text;
BEGIN
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

  IF v_charge.cycle_id IS NOT NULL THEN
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
  END IF;

  SELECT p.full_name INTO v_patient_name
  FROM public.patients p
  WHERE p.id = v_charge.patient_id;

  PERFORM public.notify_patient_responsibles(
    v_charge.patient_id,
    'cobranca'::public.notification_type,
    'Pagamento confirmado',
    coalesce(v_patient_name, 'Paciente')
      || ': seu pagamento foi confirmado. As sessões do ciclo foram liberadas.',
    jsonb_build_object(
      'charge_id', p_charge_id,
      'cycle_id', v_charge.cycle_id,
      'href', '/paciente/pagamentos/' || p_charge_id::text
    )
  );

  SELECT count(*) INTO v_sessions_after
  FROM public.care_sessions
  WHERE cycle_id = v_charge.cycle_id;

  RETURN jsonb_build_object(
    'charge_id', p_charge_id,
    'cycle_id', v_charge.cycle_id,
    'cycle_status', (
      SELECT status FROM public.care_cycles WHERE id = v_charge.cycle_id
    ),
    'sessions_count', coalesce(v_sessions_after, 0),
    'already_paid', false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.simulate_charge_payment(p_charge_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    (SELECT patient_id FROM public.charges WHERE id = p_charge_id) = ANY (public.current_patient_ids())
    OR public.is_staff()
  ) THEN
    RAISE EXCEPTION 'Sem permissão para confirmar esta cobrança';
  END IF;

  RETURN public.confirm_charge_payment(p_charge_id);
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_charge_payment(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_charge_payment(uuid) TO service_role;

COMMENT ON FUNCTION public.confirm_charge_payment(uuid) IS
  'Confirma pagamento (Asaas webhook ou uso interno), ativa ciclo, gera sessões e notifica responsáveis.';

CREATE OR REPLACE FUNCTION public.bulk_import_professionals(p_rows jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row jsonb;
  v_idx integer := 0;
  v_created integer := 0;
  v_errors jsonb := '[]'::jsonb;
  v_pp_id uuid;
  v_patente public.pp_patente;
  v_pp_class public.pp_class;
  v_wallet_id text;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN
    RAISE EXCEPTION 'p_rows deve ser um array JSON';
  END IF;

  FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows)
  LOOP
    v_idx := v_idx + 1;
    BEGIN
      IF coalesce(trim(v_row->>'full_name'), '') = '' OR coalesce(trim(v_row->>'email'), '') = '' THEN
        RAISE EXCEPTION 'full_name e email obrigatórios';
      END IF;

      v_wallet_id := nullif(trim(v_row->>'asaas_wallet_id'), '');
      IF v_wallet_id IS NOT NULL AND v_wallet_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        RAISE EXCEPTION 'asaas_wallet_id deve ser um UUID válido';
      END IF;

      v_patente := coalesce(nullif(trim(v_row->>'patente'), ''), 'BRONZE')::public.pp_patente;
      v_pp_class := CASE v_patente
        WHEN 'OURO' THEN 'OURO'::public.pp_class
        WHEN 'PRATA' THEN 'PRATA'::public.pp_class
        ELSE 'BRONZE'::public.pp_class
      END;

      INSERT INTO public.professionals (
        full_name,
        cpf_cnpj,
        email,
        phone,
        address,
        pp_class,
        patente,
        asaas_wallet_id,
        credentialing_status,
        is_active,
        points_grandfathered
      ) VALUES (
        trim(v_row->>'full_name'),
        nullif(trim(v_row->>'cpf_cnpj'), ''),
        lower(trim(v_row->>'email')),
        nullif(trim(v_row->>'phone'), ''),
        nullif(trim(v_row->>'address'), ''),
        v_pp_class,
        v_patente,
        v_wallet_id,
        coalesce(nullif(trim(v_row->>'credentialing_status'), ''), 'ativo')::public.credentialing_status,
        coalesce((v_row->>'is_active')::boolean, true),
        coalesce((v_row->>'points_grandfathered')::boolean, true)
      )
      RETURNING id INTO v_pp_id;

      IF coalesce(trim(v_row->>'crefito_number'), '') <> '' THEN
        INSERT INTO public.professional_councils (professional_id, council_type, registration_number)
        VALUES (v_pp_id, 'CREFITO', trim(v_row->>'crefito_number'))
        ON CONFLICT (professional_id, council_type) DO UPDATE
          SET registration_number = EXCLUDED.registration_number;
      END IF;

      v_created := v_created + 1;
    EXCEPTION
      WHEN OTHERS THEN
        v_errors := v_errors || jsonb_build_object(
          'row', v_idx,
          'message', SQLERRM,
          'data', v_row
        );
    END;
  END LOOP;

  RETURN jsonb_build_object('created', v_created, 'errors', v_errors);
END;
$$;

DROP VIEW IF EXISTS public.charges_patient;

CREATE VIEW public.charges_patient
WITH (security_invoker = true)
AS
SELECT
  ch.id,
  ch.patient_id,
  ch.cycle_id,
  ch.assessment_id,
  ch.amount_cents,
  ch.payment_method,
  ch.payment_status,
  ch.due_date,
  ch.paid_at,
  ch.description,
  ch.receipt_storage_path,
  ch.pix_qr_code,
  ch.boleto_url,
  ch.created_at,
  ch.asaas_payment_id,
  ch.pix_copy_paste
FROM public.charges ch;

GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;
