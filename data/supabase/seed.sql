-- LarsanaCare — Dev seed: usuários por perfil + dados de exemplo
-- Senha padrão (dev): LarsanaCare2026!
-- Executado após migrations via `supabase db reset`

-- Fixed UUIDs for reproducible dev environment
-- admin@larsanacare.com.br
-- financeiro@larsanacare.com.br
-- gestao@larsanacare.com.br
-- parceiro@larsanacare.com.br (PP)
-- cliente@larsanacare.com.br (Paciente/Responsável)

DO $$
DECLARE
  v_pw text := extensions.crypt('LarsanaCare2026!', extensions.gen_salt('bf'));
  v_admin_id uuid := 'c1000000-0000-4000-8000-000000000001';
  v_financeiro_id uuid := 'c1000000-0000-4000-8000-000000000002';
  v_gestao_id uuid := 'c1000000-0000-4000-8000-000000000003';
  v_pp_id uuid := 'c1000000-0000-4000-8000-000000000004';
  v_paciente_id uuid := 'c1000000-0000-4000-8000-000000000005';
  v_professional_id uuid := 'd1000000-0000-4000-8000-000000000001';
  v_patient_record_id uuid := 'd1000000-0000-4000-8000-000000000002';
  v_maua_city_id uuid;
  v_region_a_id uuid := 'a0000000-0000-4000-8000-000000000001';
BEGIN
  -- ===== AUTH USERS =====
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES
    (v_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'admin@larsanacare.com.br', v_pw, now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"full_name":"Administrador Larsana","primary_role":"admin"}'::jsonb,
     now(), now(), '', '', '', ''),
    (v_financeiro_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'financeiro@larsanacare.com.br', v_pw, now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"full_name":"Financeiro Larsana","primary_role":"financeiro"}'::jsonb,
     now(), now(), '', '', '', ''),
    (v_gestao_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'gestao@larsanacare.com.br', v_pw, now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"full_name":"Gestão Operacional","primary_role":"gestao"}'::jsonb,
     now(), now(), '', '', '', ''),
    (v_pp_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'parceiro@larsanacare.com.br', v_pw, now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"full_name":"Profissional Parceiro Demo","primary_role":"pp"}'::jsonb,
     now(), now(), '', '', '', ''),
    (v_paciente_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'cliente@larsanacare.com.br', v_pw, now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"full_name":"Responsável Demo","primary_role":"paciente"}'::jsonb,
     now(), now(), '', '', '', '')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) VALUES
    (v_admin_id, v_admin_id,
     format('{"sub":"%s","email":"admin@larsanacare.com.br"}', v_admin_id)::jsonb,
     'email', v_admin_id::text, now(), now(), now()),
    (v_financeiro_id, v_financeiro_id,
     format('{"sub":"%s","email":"financeiro@larsanacare.com.br"}', v_financeiro_id)::jsonb,
     'email', v_financeiro_id::text, now(), now(), now()),
    (v_gestao_id, v_gestao_id,
     format('{"sub":"%s","email":"gestao@larsanacare.com.br"}', v_gestao_id)::jsonb,
     'email', v_gestao_id::text, now(), now(), now()),
    (v_pp_id, v_pp_id,
     format('{"sub":"%s","email":"parceiro@larsanacare.com.br"}', v_pp_id)::jsonb,
     'email', v_pp_id::text, now(), now(), now()),
    (v_paciente_id, v_paciente_id,
     format('{"sub":"%s","email":"cliente@larsanacare.com.br"}', v_paciente_id)::jsonb,
     'email', v_paciente_id::text, now(), now(), now())
  ON CONFLICT DO NOTHING;

  -- Ensure profiles (trigger may have created them)
  INSERT INTO public.profiles (id, email, full_name, primary_role)
  VALUES
    (v_admin_id, 'admin@larsanacare.com.br', 'Administrador Larsana', 'admin'),
    (v_financeiro_id, 'financeiro@larsanacare.com.br', 'Financeiro Larsana', 'financeiro'),
    (v_gestao_id, 'gestao@larsanacare.com.br', 'Gestão Operacional', 'gestao'),
    (v_pp_id, 'parceiro@larsanacare.com.br', 'Profissional Parceiro Demo', 'pp'),
    (v_paciente_id, 'cliente@larsanacare.com.br', 'Responsável Demo', 'paciente')
  ON CONFLICT (id) DO UPDATE SET
    primary_role = EXCLUDED.primary_role,
    full_name = EXCLUDED.full_name;

  -- Staff profiles
  INSERT INTO public.staff_profiles (user_id, staff_role, can_manage_users, can_manage_pricing, can_approve_credenciamento, can_release_transfer)
  VALUES
    (v_admin_id, 'admin', true, true, true, true),
    (v_financeiro_id, 'financeiro', false, false, false, true),
    (v_gestao_id, 'gestao', false, false, true, false)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT id INTO v_maua_city_id FROM public.cities WHERE name = 'Mauá' LIMIT 1;

  -- Professional PP demo
  INSERT INTO public.professionals (
    id, user_id, full_name, cpf_cnpj, person_type, email, phone,
    pp_class, profession, specialty, credentialing_status,
    flag_encaminhado, flag_assinado, asaas_wallet_id, is_active
  ) VALUES (
    v_professional_id,
    v_pp_id,
    'Profissional Parceiro Demo',
    '00000000000',
    'PF',
    'parceiro@larsanacare.com.br',
    '11999990000',
    'BRONZE',
    'FISIO',
    'Geriatria',
    'ativo',
    true,
    true,
    '00000000-0000-4000-8000-000000000099',
    true
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.professional_councils (professional_id, council_type, registration_number)
  VALUES (v_professional_id, 'CREFITO', '000000-F')
  ON CONFLICT (professional_id, council_type) DO NOTHING;

  -- Patient demo
  INSERT INTO public.patients (
    id, full_name, cpf, birth_date, care_status, patient_level,
    region_id, city_id, allocated_professional_id,
    suggested_weekly_frequency, is_data_complete
  ) VALUES (
    v_patient_record_id,
    'Paciente Demonstração',
    '11111111111',
    '1950-01-15',
    'ATIVO',
    'N2',
    v_region_a_id,
    v_maua_city_id,
    v_professional_id,
    2,
    true
  )
  ON CONFLICT (id) DO NOTHING;

  IF NOT EXISTS (
    SELECT 1 FROM public.patient_responsibles
    WHERE patient_id = v_patient_record_id AND user_id = v_paciente_id
  ) THEN
    INSERT INTO public.patient_responsibles (
      patient_id, user_id, full_name, cpf, phone, email, is_primary
    ) VALUES (
      v_patient_record_id,
      v_paciente_id,
      'Responsável Demo',
      '22222222222',
      '11988887777',
      'cliente@larsanacare.com.br',
      true
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.patient_addresses WHERE patient_id = v_patient_record_id
  ) THEN
    INSERT INTO public.patient_addresses (
      patient_id, full_address, street, number, neighborhood, city_id, postal_code, is_primary
    ) VALUES (
      v_patient_record_id,
      'Rua Demonstração, 100 - Mauá/SP',
      'Rua Demonstração',
      '100',
      'Centro',
      v_maua_city_id,
      '09300000',
      true
    );
  END IF;

  INSERT INTO public.digital_acceptances (acceptor_role, acceptor_user_id, patient_id, term_id, ip_address)
  SELECT
    'paciente'::public.user_role,
    v_paciente_id,
    v_patient_record_id,
    lt.id,
    '127.0.0.1'::inet
  FROM public.legal_terms lt
  WHERE lt.is_current = true
    AND lt.term_type IN ('TERMO_ADESAO', 'DIRETRIZES', 'LGPD')
    AND NOT EXISTS (
      SELECT 1 FROM public.digital_acceptances da
      WHERE da.patient_id = v_patient_record_id AND da.term_id = lt.id
    );

  -- ===== CARE CYCLES AND SESSIONS SEED =====
  -- Clean up to make seed rerun safe
  DELETE FROM public.care_sessions WHERE cycle_id IN ('e1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000003');
  DELETE FROM public.care_cycles WHERE id IN ('e1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000003');

  -- 1. Active Cycle (8 sessions, 5 realized, 1 missed, 2 scheduled)
  INSERT INTO public.care_cycles (
    id, patient_id, cycle_number, session_count, assigned_professional_id,
    pricing_version_id, region_id, patient_level, session_unit_price_cents,
    total_amount_cents, status, payment_status, started_at, created_at
  ) VALUES (
    'e1000000-0000-4000-8000-000000000001', v_patient_record_id, 1, 8, v_professional_id,
    'b0000000-0000-4000-8000-000000000001', v_region_a_id, 'N2', 13000,
    104000, 'ativo', 'pago', now() - interval '10 days', now() - interval '10 days'
  );

  INSERT INTO public.care_sessions (
    cycle_id, session_number, status, professional_id, is_assessment_session,
    scheduled_at, check_in_at, check_out_at
  ) VALUES
    ('e1000000-0000-4000-8000-000000000001', 1, 'realizada', v_professional_id, true, now() - interval '9 days', now() - interval '9 days' + interval '9 hours', now() - interval '9 days' + interval '10 hours'),
    ('e1000000-0000-4000-8000-000000000001', 2, 'realizada', v_professional_id, false, now() - interval '7 days', now() - interval '7 days' + interval '9 hours', now() - interval '7 days' + interval '10 hours'),
    ('e1000000-0000-4000-8000-000000000001', 3, 'falta', v_professional_id, false, now() - interval '5 days', null, null),
    ('e1000000-0000-4000-8000-000000000001', 4, 'realizada', v_professional_id, false, now() - interval '3 days', now() - interval '3 days' + interval '9 hours', now() - interval '3 days' + interval '10 hours'),
    ('e1000000-0000-4000-8000-000000000001', 5, 'realizada', v_professional_id, false, now() - interval '1 days', now() - interval '1 days' + interval '9 hours', now() - interval '1 days' + interval '10 hours'),
    ('e1000000-0000-4000-8000-000000000001', 6, 'prevista', v_professional_id, false, now() + interval '1 days', null, null),
    ('e1000000-0000-4000-8000-000000000001', 7, 'prevista', v_professional_id, false, now() + interval '3 days', null, null),
    ('e1000000-0000-4000-8000-000000000001', 8, 'prevista', v_professional_id, false, now() + interval '5 days', null, null);

  -- 2. Completed Cycle (4 sessions, all realized)
  INSERT INTO public.care_cycles (
    id, patient_id, cycle_number, session_count, assigned_professional_id,
    pricing_version_id, region_id, patient_level, session_unit_price_cents,
    total_amount_cents, status, payment_status, started_at, closed_at, created_at
  ) VALUES (
    'e1000000-0000-4000-8000-000000000002', v_patient_record_id, 2, 4, v_professional_id,
    'b0000000-0000-4000-8000-000000000001', v_region_a_id, 'N2', 13000,
    52000, 'encerrado', 'pago', now() - interval '25 days', now() - interval '15 days', now() - interval '25 days'
  );

  INSERT INTO public.care_sessions (
    cycle_id, session_number, status, professional_id, is_assessment_session,
    scheduled_at, check_in_at, check_out_at
  ) VALUES
    ('e1000000-0000-4000-8000-000000000002', 1, 'realizada', v_professional_id, false, now() - interval '24 days', now() - interval '24 days' + interval '10 hours', now() - interval '24 days' + interval '11 hours'),
    ('e1000000-0000-4000-8000-000000000002', 2, 'realizada', v_professional_id, false, now() - interval '22 days', now() - interval '22 days' + interval '10 hours', now() - interval '22 days' + interval '11 hours'),
    ('e1000000-0000-4000-8000-000000000002', 3, 'realizada', v_professional_id, false, now() - interval '20 days', now() - interval '20 days' + interval '10 hours', now() - interval '20 days' + interval '11 hours'),
    ('e1000000-0000-4000-8000-000000000002', 4, 'realizada', v_professional_id, false, now() - interval '18 days', now() - interval '18 days' + interval '10 hours', now() - interval '18 days' + interval '11 hours');

  -- 3. Pending Payment Cycle (12 sessions, all scheduled)
  INSERT INTO public.care_cycles (
    id, patient_id, cycle_number, session_count, assigned_professional_id,
    pricing_version_id, region_id, patient_level, session_unit_price_cents,
    total_amount_cents, status, payment_status, created_at
  ) VALUES (
    'e1000000-0000-4000-8000-000000000003', v_patient_record_id, 3, 12, v_professional_id,
    'b0000000-0000-4000-8000-000000000001', v_region_a_id, 'N2', 13000,
    156000, 'aguardando_pagamento', 'pendente', now()
  );

  INSERT INTO public.care_sessions (
    cycle_id, session_number, status, professional_id, is_assessment_session, scheduled_at
  ) VALUES
    ('e1000000-0000-4000-8000-000000000003', 1, 'prevista', v_professional_id, false, now() + interval '2 days'),
    ('e1000000-0000-4000-8000-000000000003', 2, 'prevista', v_professional_id, false, now() + interval '4 days'),
    ('e1000000-0000-4000-8000-000000000003', 3, 'prevista', v_professional_id, false, now() + interval '6 days'),
    ('e1000000-0000-4000-8000-000000000003', 4, 'prevista', v_professional_id, false, now() + interval '8 days'),
    ('e1000000-0000-4000-8000-000000000003', 5, 'prevista', v_professional_id, false, now() + interval '10 days'),
    ('e1000000-0000-4000-8000-000000000003', 6, 'prevista', v_professional_id, false, now() + interval '12 days'),
    ('e1000000-0000-4000-8000-000000000003', 7, 'prevista', v_professional_id, false, now() + interval '14 days'),
    ('e1000000-0000-4000-8000-000000000003', 8, 'prevista', v_professional_id, false, now() + interval '16 days'),
    ('e1000000-0000-4000-8000-000000000003', 9, 'prevista', v_professional_id, false, now() + interval '18 days'),
    ('e1000000-0000-4000-8000-000000000003', 10, 'prevista', v_professional_id, false, now() + interval '20 days'),
    ('e1000000-0000-4000-8000-000000000003', 11, 'prevista', v_professional_id, false, now() + interval '22 days'),
    ('e1000000-0000-4000-8000-000000000003', 12, 'prevista', v_professional_id, false, now() + interval '24 days');

END;
$$;
