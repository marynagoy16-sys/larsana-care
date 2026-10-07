ALTER TABLE public.patient_addresses
  ADD COLUMN IF NOT EXISTS city_name text,
  ADD COLUMN IF NOT EXISTS state_code text;

ALTER TABLE public.patient_waitlist
  ADD COLUMN IF NOT EXISTS city_name text,
  ADD COLUMN IF NOT EXISTS state_code text;

DROP FUNCTION IF EXISTS public.patient_complete_onboarding(text, text, text, text, text, text, uuid, text);

CREATE OR REPLACE FUNCTION public.patient_complete_onboarding(
  p_patient_full_name text,
  p_responsible_phone text,
  p_street text,
  p_number text,
  p_neighborhood text,
  p_postal_code text,
  p_city_id uuid DEFAULT NULL,
  p_complement text DEFAULT NULL,
  p_city_name text DEFAULT NULL,
  p_state text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id uuid;
  v_region_id uuid;
  v_city_name text;
  v_state text;
  v_full_address text;
  v_responsible_id uuid;
BEGIN
  IF public.current_user_role() <> 'paciente'::public.user_role THEN
    RAISE EXCEPTION 'Apenas contas de paciente/responsável';
  END IF;

  v_patient_id := public.current_patient_id_for_user();
  IF v_patient_id IS NULL THEN
    v_patient_id := public.bootstrap_patient_account();
  END IF;

  IF NULLIF(trim(p_patient_full_name), '') IS NULL THEN
    RAISE EXCEPTION 'Informe o nome do paciente';
  END IF;

  IF NULLIF(trim(p_responsible_phone), '') IS NULL THEN
    RAISE EXCEPTION 'Informe um telefone de contato';
  END IF;

  IF NULLIF(trim(p_street), '') IS NULL
    OR NULLIF(trim(p_number), '') IS NULL
    OR NULLIF(trim(p_neighborhood), '') IS NULL
    OR NULLIF(trim(p_postal_code), '') IS NULL THEN
    RAISE EXCEPTION 'Preencha o endereço completo';
  END IF;

  IF p_city_id IS NOT NULL THEN
    SELECT c.region_id, c.name, c.state
    INTO v_region_id, v_city_name, v_state
    FROM public.cities c
    WHERE c.id = p_city_id;

    IF v_city_name IS NULL THEN
      RAISE EXCEPTION 'Cidade inválida';
    END IF;
  ELSE
    v_city_name := NULLIF(trim(p_city_name), '');
    v_state := NULLIF(upper(trim(p_state)), '');
    IF v_city_name IS NULL OR v_state IS NULL OR length(v_state) <> 2 THEN
      RAISE EXCEPTION 'Informe a cidade e a UF';
    END IF;
    v_region_id := NULL;
  END IF;

  v_full_address := trim(
    concat_ws(
      ', ',
      trim(p_street) || ', ' || trim(p_number),
      NULLIF(trim(p_complement), ''),
      trim(p_neighborhood),
      v_city_name || '/' || v_state
    )
  );

  UPDATE public.patients
  SET
    full_name = trim(p_patient_full_name),
    city_id = p_city_id,
    region_id = v_region_id,
    updated_at = now()
  WHERE id = v_patient_id;

  SELECT pr.id INTO v_responsible_id
  FROM public.patient_responsibles pr
  WHERE pr.patient_id = v_patient_id
    AND pr.user_id = auth.uid()
  ORDER BY pr.is_primary DESC, pr.created_at ASC
  LIMIT 1;

  IF v_responsible_id IS NULL THEN
    RAISE EXCEPTION 'Responsável não encontrado';
  END IF;

  UPDATE public.patient_responsibles
  SET phone = trim(p_responsible_phone), updated_at = now()
  WHERE id = v_responsible_id;

  IF EXISTS (
    SELECT 1 FROM public.patient_addresses pa WHERE pa.patient_id = v_patient_id AND pa.is_primary = true
  ) THEN
    UPDATE public.patient_addresses
    SET
      street = trim(p_street),
      number = trim(p_number),
      complement = NULLIF(trim(p_complement), ''),
      neighborhood = trim(p_neighborhood),
      postal_code = trim(p_postal_code),
      city_id = p_city_id,
      city_name = v_city_name,
      state_code = v_state,
      full_address = v_full_address,
      is_primary = true,
      updated_at = now()
    WHERE patient_id = v_patient_id
      AND is_primary = true;
  ELSE
    INSERT INTO public.patient_addresses (
      patient_id, street, number, complement, neighborhood, postal_code,
      city_id, city_name, state_code, full_address, is_primary
    ) VALUES (
      v_patient_id, trim(p_street), trim(p_number), NULLIF(trim(p_complement), ''),
      trim(p_neighborhood), trim(p_postal_code), p_city_id, v_city_name, v_state,
      v_full_address, true
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'patient_id', v_patient_id,
    'region_id', v_region_id,
    'city_name', v_city_name,
    'state_code', v_state
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.patient_complete_onboarding(
  text, text, text, text, text, text, uuid, text, text, text
) TO authenticated;

CREATE OR REPLACE FUNCTION public.patient_join_waitlist(p_notes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id uuid;
  v_patient public.patients%ROWTYPE;
  v_existing public.patient_waitlist%ROWTYPE;
  v_new_id uuid;
  v_city_name text;
  v_state text;
BEGIN
  IF public.current_user_role() <> 'paciente' THEN
    RAISE EXCEPTION 'Apenas responsáveis/pacientes podem entrar na lista de espera';
  END IF;

  v_patient_id := public.current_patient_id_for_user();
  IF v_patient_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum paciente vinculado à sua conta';
  END IF;

  SELECT * INTO v_patient FROM public.patients WHERE id = v_patient_id;

  IF public.region_has_patient_service(v_patient.region_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'already_available',
      'message', 'Sua região já possui atendimento. Use Solicitar atendimento.'
    );
  END IF;

  SELECT coalesce(c.name, pa.city_name), coalesce(c.state, pa.state_code)
  INTO v_city_name, v_state
  FROM public.patient_addresses pa
  LEFT JOIN public.cities c ON c.id = pa.city_id
  WHERE pa.patient_id = v_patient_id AND pa.is_primary = true
  ORDER BY pa.updated_at DESC
  LIMIT 1;

  SELECT * INTO v_existing
  FROM public.patient_waitlist w
  WHERE w.patient_id = v_patient_id
    AND w.status = 'pendente'
  LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    UPDATE public.patient_waitlist
    SET city_name = coalesce(v_city_name, city_name),
        state_code = coalesce(v_state, state_code),
        updated_at = now()
    WHERE id = v_existing.id;

    RETURN jsonb_build_object(
      'success', true,
      'waitlist_id', v_existing.id,
      'already_exists', true
    );
  END IF;

  INSERT INTO public.patient_waitlist (
    patient_id, region_id, notes, created_by_user_id, city_name, state_code
  ) VALUES (
    v_patient_id,
    v_patient.region_id,
    NULLIF(trim(p_notes), ''),
    auth.uid(),
    v_city_name,
    v_state
  )
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'success', true,
    'waitlist_id', v_new_id,
    'already_exists', false
  );
END;
$$;
