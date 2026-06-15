-- Portal do paciente: responsável vinculado a Carlos Mendes (fluxo de avaliação)
-- Senha (dev): LarsanaCare2026!
-- Aplicar remoto: node data/supabase/scripts/apply-sql-remote.mjs data/supabase/seed-carlos-mendes-portal.sql

DO $$
DECLARE
  v_pw text := extensions.crypt('LarsanaCare2026!', extensions.gen_salt('bf'));
  v_carlos_user_id uuid := 'c1000000-0000-4000-8000-000000000006';
  v_carlos_patient_id uuid := 'd1000000-0000-4000-8000-000000000004';
  v_email text := 'carlos.mendes@larsanacare.com.br';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.patients WHERE id = v_carlos_patient_id AND full_name = 'Carlos Mendes') THEN
    RAISE EXCEPTION 'Paciente Carlos Mendes (%) não encontrado — execute populate-demands-avaliacao.sql antes', v_carlos_patient_id;
  END IF;

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    v_carlos_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    v_email,
    v_pw,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Ana Mendes","primary_role":"paciente"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = COALESCE(auth.users.email_confirmed_at, EXCLUDED.email_confirmed_at),
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = now();

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    v_carlos_user_id,
    v_carlos_user_id,
    format('{"sub":"%s","email":"%s"}', v_carlos_user_id, v_email)::jsonb,
    'email',
    v_carlos_user_id::text,
    now(),
    now(),
    now()
  )
  ON CONFLICT DO NOTHING;

  INSERT INTO public.profiles (id, email, full_name, primary_role)
  VALUES (v_carlos_user_id, v_email, 'Ana Mendes', 'paciente')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    primary_role = 'paciente';

  IF NOT EXISTS (
    SELECT 1 FROM public.patient_responsibles
    WHERE patient_id = v_carlos_patient_id AND user_id = v_carlos_user_id
  ) THEN
    INSERT INTO public.patient_responsibles (
      patient_id, user_id, full_name, cpf, phone, email, is_primary
    ) VALUES (
      v_carlos_patient_id,
      v_carlos_user_id,
      'Ana Mendes',
      '66666666666',
      '11977776666',
      v_email,
      true
    );
  ELSE
    UPDATE public.patient_responsibles
    SET
      full_name = 'Ana Mendes',
      email = v_email,
      is_primary = true
    WHERE patient_id = v_carlos_patient_id AND user_id = v_carlos_user_id;
  END IF;

  INSERT INTO public.digital_acceptances (acceptor_role, acceptor_user_id, patient_id, term_id, ip_address)
  SELECT
    'paciente'::public.user_role,
    v_carlos_user_id,
    v_carlos_patient_id,
    lt.id,
    '127.0.0.1'::inet
  FROM public.legal_terms lt
  WHERE lt.is_current = true
    AND lt.term_type IN ('TERMO_ADESAO', 'DIRETRIZES', 'LGPD')
    AND NOT EXISTS (
      SELECT 1 FROM public.digital_acceptances da
      WHERE da.patient_id = v_carlos_patient_id
        AND da.term_id = lt.id
        AND da.acceptor_user_id = v_carlos_user_id
    );

  RAISE NOTICE 'Portal Carlos Mendes: login % / senha LarsanaCare2026!', v_email;
END;
$$;
