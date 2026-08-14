-- Bootstrap paciente/responsável no signup + onboarding self-service.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.user_role;
  v_profession public.profession_type;
  v_professional_id uuid;
  v_patient_id uuid;
  v_referral_code text;
  v_full_name text;
BEGIN
  v_role := COALESCE(
    (NEW.raw_user_meta_data ->> 'primary_role')::public.user_role,
    'paciente'::public.user_role
  );

  v_full_name := COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (id, email, full_name, primary_role)
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_role
  );

  IF v_role = 'pp'::public.user_role THEN
    v_profession := COALESCE(
      (NEW.raw_user_meta_data ->> 'profession')::public.profession_type,
      'FISIO'::public.profession_type
    );

    INSERT INTO public.professionals (
      user_id,
      full_name,
      email,
      cpf_cnpj,
      profession,
      credentialing_status,
      is_active
    ) VALUES (
      NEW.id,
      v_full_name,
      NEW.email,
      NULLIF(trim(NEW.raw_user_meta_data ->> 'cpf_cnpj'), ''),
      v_profession,
      'rascunho'::public.credentialing_status,
      false
    )
    RETURNING id INTO v_professional_id;

    v_referral_code := NULLIF(trim(NEW.raw_user_meta_data ->> 'referral_code'), '');
    IF v_referral_code IS NOT NULL THEN
      PERFORM public.register_pp_referral_on_signup(v_professional_id, v_referral_code);
    END IF;
  ELSIF v_role = 'paciente'::public.user_role THEN
    INSERT INTO public.patients (full_name, is_data_complete, care_status)
    VALUES (v_full_name, false, 'ATIVO'::public.patient_care_status)
    RETURNING id INTO v_patient_id;

    INSERT INTO public.patient_responsibles (
      patient_id,
      user_id,
      full_name,
      email,
      is_primary
    ) VALUES (
      v_patient_id,
      NEW.id,
      v_full_name,
      NEW.email,
      true
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.bootstrap_patient_account()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile public.profiles%ROWTYPE;
  v_patient_id uuid;
  v_full_name text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  v_patient_id := public.current_patient_id_for_user();
  IF v_patient_id IS NOT NULL THEN
    RETURN v_patient_id;
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
  IF NOT FOUND OR v_profile.primary_role <> 'paciente'::public.user_role THEN
    RAISE EXCEPTION 'Apenas contas de paciente/responsável';
  END IF;

  v_full_name := COALESCE(v_profile.full_name, split_part(v_profile.email, '@', 1));

  INSERT INTO public.patients (full_name, is_data_complete, care_status)
  VALUES (v_full_name, false, 'ATIVO'::public.patient_care_status)
  RETURNING id INTO v_patient_id;

  INSERT INTO public.patient_responsibles (
    patient_id,
    user_id,
    full_name,
    email,
    is_primary
  ) VALUES (
    v_patient_id,
    v_user_id,
    v_full_name,
    v_profile.email,
    true
  );

  RETURN v_patient_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.patient_get_onboarding_status()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id uuid;
  v_has_address boolean;
BEGIN
  IF public.current_user_role() <> 'paciente'::public.user_role THEN
    RETURN jsonb_build_object('linked', false, 'needs_onboarding', false);
  END IF;

  v_patient_id := public.current_patient_id_for_user();
  IF v_patient_id IS NULL THEN
    RETURN jsonb_build_object('linked', false, 'needs_onboarding', true);
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.patient_addresses pa
    WHERE pa.patient_id = v_patient_id
  ) INTO v_has_address;

  RETURN jsonb_build_object(
    'linked', true,
    'needs_onboarding', NOT v_has_address,
    'patient_id', v_patient_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.patient_complete_onboarding(
  p_patient_full_name text,
  p_responsible_phone text,
  p_street text,
  p_number text,
  p_neighborhood text,
  p_postal_code text,
  p_city_id uuid,
  p_complement text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id uuid;
  v_region_id uuid;
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
    OR NULLIF(trim(p_postal_code), '') IS NULL
    OR p_city_id IS NULL THEN
    RAISE EXCEPTION 'Preencha o endereço completo';
  END IF;

  SELECT c.region_id INTO v_region_id
  FROM public.cities c
  WHERE c.id = p_city_id;

  IF v_region_id IS NULL THEN
    RAISE EXCEPTION 'Cidade inválida';
  END IF;

  v_full_address := trim(
    concat_ws(
      ', ',
      trim(p_street) || ', ' || trim(p_number),
      NULLIF(trim(p_complement), ''),
      trim(p_neighborhood)
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
  SET
    phone = trim(p_responsible_phone),
    updated_at = now()
  WHERE id = v_responsible_id;

  IF EXISTS (
    SELECT 1 FROM public.patient_addresses pa WHERE pa.patient_id = v_patient_id
  ) THEN
    UPDATE public.patient_addresses
    SET
      street = trim(p_street),
      number = trim(p_number),
      complement = NULLIF(trim(p_complement), ''),
      neighborhood = trim(p_neighborhood),
      postal_code = trim(p_postal_code),
      city_id = p_city_id,
      full_address = v_full_address,
      is_primary = true,
      updated_at = now()
    WHERE patient_id = v_patient_id
      AND is_primary = true;
  ELSE
    INSERT INTO public.patient_addresses (
      patient_id,
      street,
      number,
      complement,
      neighborhood,
      postal_code,
      city_id,
      full_address,
      is_primary
    ) VALUES (
      v_patient_id,
      trim(p_street),
      trim(p_number),
      NULLIF(trim(p_complement), ''),
      trim(p_neighborhood),
      trim(p_postal_code),
      p_city_id,
      v_full_address,
      true
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'patient_id', v_patient_id,
    'region_id', v_region_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.bootstrap_patient_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.patient_get_onboarding_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.patient_complete_onboarding(
  text, text, text, text, text, text, uuid, text
) TO authenticated;
