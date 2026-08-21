-- Public self-signup may only create paciente or pp.
-- Staff roles (admin, financeiro, gestao) are provisioned by seed/admin upsert, never from user_metadata.

CREATE OR REPLACE FUNCTION public.resolve_public_signup_role(p_requested text)
RETURNS public.user_role
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN lower(trim(COALESCE(p_requested, ''))) = 'pp' THEN 'pp'::public.user_role
    ELSE 'paciente'::public.user_role
  END;
$$;

REVOKE ALL ON FUNCTION public.resolve_public_signup_role(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_public_signup_role(text) TO postgres, service_role;

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
  v_role := public.resolve_public_signup_role(NEW.raw_user_meta_data ->> 'primary_role');
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
  ELSIF v_role = 'paciente'::public.user_role
    AND lower(trim(COALESCE(NEW.raw_user_meta_data ->> 'primary_role', 'paciente'))) IN ('paciente', '') THEN
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

CREATE OR REPLACE FUNCTION public.protect_profile_primary_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Seed, migrations and service_role (no JWT / auth.uid() IS NULL) may
  -- bootstrap staff after handle_new_user creates a paciente profile.
  -- Authenticated non-admin clients cannot escalate primary_role.
  IF NEW.primary_role IS DISTINCT FROM OLD.primary_role
     AND auth.uid() IS NOT NULL
     AND NOT public.is_staff_role(ARRAY['admin']::public.user_role[]) THEN
    RAISE EXCEPTION 'Não é permitido alterar o perfil da conta';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_primary_role ON public.profiles;
CREATE TRIGGER protect_profile_primary_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_primary_role();
