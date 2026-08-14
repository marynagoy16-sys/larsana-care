-- Bootstrap registro de profissional parceiro no signup (auth metadata).

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
  v_referral_code text;
BEGIN
  v_role := COALESCE(
    (NEW.raw_user_meta_data ->> 'primary_role')::public.user_role,
    'paciente'::public.user_role
  );

  INSERT INTO public.profiles (id, email, full_name, primary_role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
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
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
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
  END IF;

  RETURN NEW;
END;
$$;
