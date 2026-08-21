-- 100 pacientes para load test de cobrança de avaliação (idempotente)
-- Aplicar: npx supabase db query --linked -f data/supabase/seed-load-test-assessment-charges.sql

DO $$
DECLARE
  v_pw text := extensions.crypt('LarsanaCare2026!', extensions.gen_salt('bf'));
  v_i integer;
  v_user_id uuid;
  v_patient_id uuid;
  v_address_id uuid;
  v_region_a uuid := 'a0000000-0000-4000-8000-000000000001';
  v_maua_city_id uuid;
  v_email text;
  v_cpf text;
BEGIN
  SELECT id INTO v_maua_city_id FROM public.cities WHERE name = 'Mauá' LIMIT 1;
  IF v_maua_city_id IS NULL THEN
    RAISE EXCEPTION 'Cidade Mauá não encontrada';
  END IF;

  FOR v_i IN 1..100 LOOP
    v_user_id := ('e4000000-0000-4000-8000-' || lpad(to_hex(v_i), 12, '0'))::uuid;
    v_patient_id := ('e4100000-0000-4000-8000-' || lpad(to_hex(v_i), 12, '0'))::uuid;
    v_address_id := ('e4200000-0000-4000-8000-' || lpad(to_hex(v_i), 12, '0'))::uuid;
    v_email := 'load-charge+' || v_i || '@larsanacare.test';
    v_cpf := lpad((88000000000 + v_i)::text, 11, '0');

    DELETE FROM public.patient_responsibles
    WHERE user_id = v_user_id AND patient_id <> v_patient_id;

    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      v_email, v_pw, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Load Charge ' || v_i, 'primary_role', 'paciente'),
      now(), now(), '', '', '', ''
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email),
      'email', v_user_id::text, now(), now(), now()
    ) ON CONFLICT DO NOTHING;

    INSERT INTO public.profiles (id, email, full_name, primary_role)
    VALUES (v_user_id, v_email, 'Load Charge ' || v_i, 'paciente')
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

    INSERT INTO public.patients (
      id, full_name, cpf, birth_date, sex, care_status, patient_level,
      region_id, city_id, diagnostic_hypothesis, attendance_period,
      is_data_complete, technical_category
    ) VALUES (
      v_patient_id,
      'Load Charge Paciente ' || v_i,
      v_cpf,
      '1990-01-15',
      'M'::public.patient_sex,
      'ATIVO'::public.patient_care_status,
      'N2'::public.patient_level,
      v_region_a,
      v_maua_city_id,
      'Teste carga avaliação',
      'MANHA'::public.patient_attendance_period,
      true,
      'funcional_condicionamento'
    ) ON CONFLICT (id) DO NOTHING;

    IF NOT EXISTS (
      SELECT 1 FROM public.patient_responsibles pr
      WHERE pr.patient_id = v_patient_id AND pr.user_id = v_user_id
    ) THEN
      INSERT INTO public.patient_responsibles (
        patient_id, user_id, full_name, cpf, is_primary
      ) VALUES (
        v_patient_id, v_user_id, 'Load Charge ' || v_i, v_cpf, true
      );
    END IF;

    INSERT INTO public.patient_addresses (
      id, patient_id, full_address, neighborhood, city_id, is_primary,
      latitude, longitude
    ) VALUES (
      v_address_id,
      v_patient_id,
      'Rua Load Test ' || v_i || ', Mauá - SP',
      'Centro',
      v_maua_city_id,
      true,
      -23.6678 + (v_i % 50) * 0.001,
      -46.4614 + (v_i % 50) * 0.001
    ) ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;
