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
  v_avaliacao_patient_1 uuid := 'd1000000-0000-4000-8000-000000000003';
  v_avaliacao_patient_2 uuid := 'd1000000-0000-4000-8000-000000000004';
  v_avaliacao_patient_3 uuid := 'd1000000-0000-4000-8000-000000000005';
  v_avaliacao_addr_1 uuid := 'd2000000-0000-4000-8000-000000000001';
  v_avaliacao_addr_2 uuid := 'd2000000-0000-4000-8000-000000000002';
  v_avaliacao_addr_3 uuid := 'd2000000-0000-4000-8000-000000000003';
  v_avaliacao_demand_1 uuid := 'f2000000-0000-4000-8000-000000000001';
  v_avaliacao_demand_2 uuid := 'f2000000-0000-4000-8000-000000000002';
  v_avaliacao_demand_3 uuid := 'f2000000-0000-4000-8000-000000000003';
  v_patient_evol_maria uuid := 'd1000000-0000-4000-8000-000000000010';
  v_patient_evol_joao uuid := 'd1000000-0000-4000-8000-000000000011';
  v_cycle_evol_maria uuid := 'e1000000-0000-4000-8000-000000000010';
  v_cycle_evol_joao uuid := 'e1000000-0000-4000-8000-000000000011';
  v_pricing_v1 uuid := 'b0000000-0000-4000-8000-000000000001';
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
    id, user_id, full_name, cpf_cnpj, person_type, birth_date, email, phone, address,
    pp_class, profession, specialty, credentialing_status,
    flag_encaminhado, flag_assinado, asaas_wallet_id, is_active
  ) VALUES (
    v_professional_id,
    v_pp_id,
    'Profissional Parceiro Demo',
    '52998224725',
    'PF',
    '1985-03-18',
    'parceiro@larsanacare.com.br',
    '11999990000',
    'Rua das Palmeiras, 120 - Centro, Mauá - SP, CEP 09310-000',
    'BRONZE',
    'FISIO',
    'Geriatria e reabilitação',
    'ativo',
    true,
    true,
    '00000000-0000-4000-8000-000000000099',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    birth_date = EXCLUDED.birth_date,
    address = EXCLUDED.address,
    cpf_cnpj = EXCLUDED.cpf_cnpj,
    specialty = EXCLUDED.specialty;

  INSERT INTO public.professional_councils (professional_id, council_type, registration_number)
  VALUES (v_professional_id, 'CREFITO', '269110-F')
  ON CONFLICT (professional_id, council_type) DO UPDATE SET registration_number = EXCLUDED.registration_number;

  INSERT INTO public.professional_bank_accounts (
    professional_id, bank_code, bank_name, agency, account_number,
    account_type, pix_key, holder_name, holder_document
  ) VALUES (
    v_professional_id, '341', 'Itaú Unibanco', '1234', '56789-0',
    'corrente', 'parceiro@larsanacare.com.br', 'Profissional Parceiro Demo', '52998224725'
  )
  ON CONFLICT (professional_id) DO NOTHING;

  DELETE FROM public.professional_documents
  WHERE professional_id = v_professional_id
    AND document_type IN ('RG_CNH', 'COUNCIL_CARD', 'CRIMINAL_BACKGROUND', 'CERTIFICATE');

  INSERT INTO public.professional_documents (professional_id, document_type, file_name) VALUES
    (v_professional_id, 'RG_CNH', 'rg-parceiro-demo.pdf'),
    (v_professional_id, 'COUNCIL_CARD', 'crefito-269110-f.pdf'),
    (v_professional_id, 'CRIMINAL_BACKGROUND', 'antecedentes-criminais.pdf'),
    (v_professional_id, 'CERTIFICATE', 'certificado-geriatria.pdf');

  INSERT INTO public.contracts (id, professional_id, contract_number, status, signed_at)
  VALUES (
    'e1000000-0000-4000-8000-000000000001',
    v_professional_id,
    'LRS-PROF.FISIO-2026-0001',
    'aprovado',
    now() - interval '30 days'
  )
  ON CONFLICT (id) DO NOTHING;

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
  DELETE FROM public.medical_records WHERE cycle_id IN ('e1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000003');
  DELETE FROM public.care_sessions WHERE cycle_id IN ('e1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000003');
  DELETE FROM public.care_cycles WHERE id IN ('e1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000003');

  -- 1. Active Cycle (8 sessions, 4 realized, 1 missed, 3 scheduled)
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
    id, cycle_id, session_number, status, professional_id, is_assessment_session,
    scheduled_at, check_in_at, check_out_at
  ) VALUES
    ('e2000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 1, 'realizada', v_professional_id, true, now() - interval '9 days', now() - interval '9 days' + interval '9 hours', now() - interval '9 days' + interval '10 hours'),
    ('e2000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000001', 2, 'realizada', v_professional_id, false, now() - interval '7 days', now() - interval '7 days' + interval '9 hours', now() - interval '7 days' + interval '10 hours'),
    ('e2000000-0000-4000-8000-000000000003', 'e1000000-0000-4000-8000-000000000001', 3, 'falta', v_professional_id, false, now() - interval '5 days', null, null),
    ('e2000000-0000-4000-8000-000000000004', 'e1000000-0000-4000-8000-000000000001', 4, 'realizada', v_professional_id, false, now() - interval '3 days', now() - interval '3 days' + interval '9 hours', now() - interval '3 days' + interval '10 hours'),
    ('e2000000-0000-4000-8000-000000000005', 'e1000000-0000-4000-8000-000000000001', 5, 'realizada', v_professional_id, false, now() - interval '1 days', now() - interval '1 days' + interval '9 hours', now() - interval '1 days' + interval '10 hours'),
    ('e2000000-0000-4000-8000-000000000006', 'e1000000-0000-4000-8000-000000000001', 6, 'prevista', v_professional_id, false, now() + interval '1 days', null, null),
    ('e2000000-0000-4000-8000-000000000007', 'e1000000-0000-4000-8000-000000000001', 7, 'prevista', v_professional_id, false, now() + interval '3 days', null, null),
    ('e2000000-0000-4000-8000-000000000008', 'e1000000-0000-4000-8000-000000000001', 8, 'prevista', v_professional_id, false, now() + interval '5 days', null, null);

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
    id, cycle_id, session_number, status, professional_id, is_assessment_session,
    scheduled_at, check_in_at, check_out_at
  ) VALUES
    ('e2000000-0000-4000-8000-000000000011', 'e1000000-0000-4000-8000-000000000002', 1, 'realizada', v_professional_id, false, now() - interval '24 days', now() - interval '24 days' + interval '10 hours', now() - interval '24 days' + interval '11 hours'),
    ('e2000000-0000-4000-8000-000000000012', 'e1000000-0000-4000-8000-000000000002', 2, 'realizada', v_professional_id, false, now() - interval '22 days', now() - interval '22 days' + interval '10 hours', now() - interval '22 days' + interval '11 hours'),
    ('e2000000-0000-4000-8000-000000000013', 'e1000000-0000-4000-8000-000000000002', 3, 'realizada', v_professional_id, false, now() - interval '20 days', now() - interval '20 days' + interval '10 hours', now() - interval '20 days' + interval '11 hours'),
    ('e2000000-0000-4000-8000-000000000014', 'e1000000-0000-4000-8000-000000000002', 4, 'realizada', v_professional_id, false, now() - interval '18 days', now() - interval '18 days' + interval '10 hours', now() - interval '18 days' + interval '11 hours');

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

  -- Evoluções clínicas para sessões concluídas (tela de detalhe do ciclo)
  INSERT INTO public.medical_records (
    id, patient_id, session_id, cycle_id, professional_id,
    crefito_number, record_type, content_richtext, recorded_at
  ) VALUES
    (
      'f1000000-0000-4000-8000-000000000001', v_patient_record_id,
      'e2000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', v_professional_id,
      '000000-F', 'evolucao',
      '<p><strong>Avaliação inicial.</strong> Paciente idoso, deambula com auxílio de andador. Queixa principal: redução de amplitude em ombro direito e dor leve (EVA 3/10) ao elevar o membro.</p><p>Plano: mobilização passiva e ativa assistida, alongamento e fortalecimento progressivo de MMSS.</p>',
      now() - interval '9 days' + interval '10 hours'
    ),
    (
      'f1000000-0000-4000-8000-000000000002', v_patient_record_id,
      'e2000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000001', v_professional_id,
      '000000-F', 'evolucao',
      '<p>Sessão de mobilização articular e exercícios ativos assistidos. Paciente colaborativo, tolerou bem os exercícios. Dor referida EVA 2/10 ao final.</p>',
      now() - interval '7 days' + interval '10 hours'
    ),
    (
      'f1000000-0000-4000-8000-000000000003', v_patient_record_id,
      'e2000000-0000-4000-8000-000000000004', 'e1000000-0000-4000-8000-000000000001', v_professional_id,
      '000000-F', 'evolucao',
      '<p>Retomada após falta na sessão anterior. Ganho de amplitude observado em flexão de ombro (aprox. 10°). Mantido plano de fortalecimento e orientações domiciliares.</p>',
      now() - interval '3 days' + interval '10 hours'
    ),
    (
      'f1000000-0000-4000-8000-000000000004', v_patient_record_id,
      'e2000000-0000-4000-8000-000000000005', 'e1000000-0000-4000-8000-000000000001', v_professional_id,
      '000000-F', 'evolucao',
      '<p>Exercícios funcionais para atividades de vida diária. Paciente executa elevação frontal com carga mínima (0,5 kg). Sem queixas álgicas significativas.</p>',
      now() - interval '1 days' + interval '10 hours'
    ),
    (
      'f1000000-0000-4000-8000-000000000011', v_patient_record_id,
      'e2000000-0000-4000-8000-000000000011', 'e1000000-0000-4000-8000-000000000002', v_professional_id,
      '000000-F', 'evolucao',
      '<p>Início do ciclo encerrado. Avaliação funcional baseline registrada. Objetivo: manutenção de autonomia e prevenção de quedas.</p>',
      now() - interval '24 days' + interval '11 hours'
    ),
    (
      'f1000000-0000-4000-8000-000000000012', v_patient_record_id,
      'e2000000-0000-4000-8000-000000000012', 'e1000000-0000-4000-8000-000000000002', v_professional_id,
      '000000-F', 'evolucao',
      '<p>Treino de equilíbrio estático e transferências cama-cadeira. Boa adesão às orientações.</p>',
      now() - interval '22 days' + interval '11 hours'
    ),
    (
      'f1000000-0000-4000-8000-000000000013', v_patient_record_id,
      'e2000000-0000-4000-8000-000000000013', 'e1000000-0000-4000-8000-000000000002', v_professional_id,
      '000000-F', 'evolucao',
      '<p>Progressão de carga nos exercícios de MMII. Marcha estável com supervisão.</p>',
      now() - interval '20 days' + interval '11 hours'
    ),
    (
      'f1000000-0000-4000-8000-000000000014', v_patient_record_id,
      'e2000000-0000-4000-8000-000000000014', 'e1000000-0000-4000-8000-000000000002', v_professional_id,
      '000000-F', 'evolucao',
      '<p><strong>Alta do ciclo.</strong> Objetivos terapêuticos atingidos. Paciente orientado quanto à continuidade dos exercícios domiciliares e sinais de alerta.</p>',
      now() - interval '18 days' + interval '11 hours'
    );

  -- ===== DEMANDAS TIPO AVALIAÇÃO (pacientes novos, sem ciclo nem PP alocado) =====
  DELETE FROM public.demand_responses
  WHERE demand_id IN (v_avaliacao_demand_1, v_avaliacao_demand_2, v_avaliacao_demand_3);
  DELETE FROM public.demands
  WHERE id IN (v_avaliacao_demand_1, v_avaliacao_demand_2, v_avaliacao_demand_3);
  DELETE FROM public.patient_addresses
  WHERE patient_id IN (v_avaliacao_patient_1, v_avaliacao_patient_2, v_avaliacao_patient_3);
  DELETE FROM public.patients
  WHERE id IN (v_avaliacao_patient_1, v_avaliacao_patient_2, v_avaliacao_patient_3);

  INSERT INTO public.patients (
    id, full_name, cpf, birth_date, sex, care_status, patient_level,
    region_id, city_id, diagnostic_hypothesis, attendance_period,
    suggested_weekly_frequency, clinical_summary, is_data_complete
  ) VALUES
    (
      v_avaliacao_patient_1,
      'Severina Ribeiro',
      '33333333333',
      '1948-03-12',
      'F',
      'ATIVO',
      'N1',
      v_region_a_id,
      v_maua_city_id,
      'AVC isquêmico — reabilitação motora',
      'MANHA',
      1,
      'Paciente pós-AVC com hemiparesia à direita. Família solicita fisioterapia domiciliar em turno da manhã.',
      true
    ),
    (
      v_avaliacao_patient_2,
      'Carlos Mendes',
      '44444444444',
      '1962-07-20',
      'M',
      'ATIVO',
      'N1',
      v_region_a_id,
      v_maua_city_id,
      'Fratura de fêmur — pós-operatório',
      'MANHA',
      2,
      'Recuperação funcional após cirurgia ortopédica. Preferência por atendimentos 2x por semana.',
      true
    ),
    (
      v_avaliacao_patient_3,
      'Lucia Ferreira',
      '55555555555',
      '1955-11-08',
      'F',
      'ATIVO',
      'N1',
      v_region_a_id,
      v_maua_city_id,
      'Desnutrição geriátrica',
      'TARDE',
      3,
      'Acompanhamento nutricional domiciliar. Avaliação inicial para plano alimentar personalizado.',
      true
    );

  INSERT INTO public.patient_addresses (
    id, patient_id, full_address, street, number, neighborhood, city_id, postal_code, is_primary
  ) VALUES
    (
      v_avaliacao_addr_1,
      v_avaliacao_patient_1,
      'Rua Esperança, 245 - Bairro Esperança - Mauá/SP',
      'Rua Esperança',
      '245',
      'Bairro Esperança',
      v_maua_city_id,
      '09370420',
      true
    ),
    (
      v_avaliacao_addr_2,
      v_avaliacao_patient_2,
      'Av. Boa Esperança, 88 - Pq. Boa Esperança - Mauá/SP',
      'Av. Boa Esperança',
      '88',
      'Pq. Boa Esperança',
      v_maua_city_id,
      '09380110',
      true
    ),
    (
      v_avaliacao_addr_3,
      v_avaliacao_patient_3,
      'Rua das Palmeiras, 512 - Jd Primavera - Mauá/SP',
      'Rua das Palmeiras',
      '512',
      'Jd Primavera',
      v_maua_city_id,
      '09390200',
      true
    );

  INSERT INTO public.demands (
    id, patient_id, address_id, required_profession, region_id, status, notes
  ) VALUES
    (
      v_avaliacao_demand_1,
      v_avaliacao_patient_1,
      v_avaliacao_addr_1,
      'FISIO',
      v_region_a_id,
      'aberta',
      'Primeira avaliação fisioterapêutica — turno manhã, Região A N1.'
    ),
    (
      v_avaliacao_demand_2,
      v_avaliacao_patient_2,
      v_avaliacao_addr_2,
      'FISIO',
      v_region_a_id,
      'aberta',
      'Avaliação inicial pós-cirúrgica — 2x por semana após aceite.'
    ),
    (
      v_avaliacao_demand_3,
      v_avaliacao_patient_3,
      v_avaliacao_addr_3,
      'NUTI',
      v_region_a_id,
      'aberta',
      'Avaliação nutricional domiciliar — turno tarde.'
    );

  -- Portal: responsável de Carlos Mendes (fluxo avaliação)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    'c1000000-0000-4000-8000-000000000006',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'carlos.mendes@larsanacare.com.br',
    extensions.crypt('LarsanaCare2026!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Ana Mendes","primary_role":"paciente"}'::jsonb,
    now(),
    now(),
    '', '', '', ''
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    'c1000000-0000-4000-8000-000000000006',
    'c1000000-0000-4000-8000-000000000006',
    '{"sub":"c1000000-0000-4000-8000-000000000006","email":"carlos.mendes@larsanacare.com.br"}'::jsonb,
    'email',
    'c1000000-0000-4000-8000-000000000006',
    now(), now(), now()
  )
  ON CONFLICT DO NOTHING;

  INSERT INTO public.profiles (id, email, full_name, primary_role)
  VALUES (
    'c1000000-0000-4000-8000-000000000006',
    'carlos.mendes@larsanacare.com.br',
    'Ana Mendes',
    'paciente'
  )
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

  IF NOT EXISTS (
    SELECT 1 FROM public.patient_responsibles
    WHERE patient_id = v_avaliacao_patient_2
      AND user_id = 'c1000000-0000-4000-8000-000000000006'
  ) THEN
    INSERT INTO public.patient_responsibles (
      patient_id, user_id, full_name, cpf, phone, email, is_primary
    ) VALUES (
      v_avaliacao_patient_2,
      'c1000000-0000-4000-8000-000000000006',
      'Ana Mendes',
      '66666666666',
      '11977776666',
      'carlos.mendes@larsanacare.com.br',
      true
    );
  END IF;

  INSERT INTO public.digital_acceptances (acceptor_role, acceptor_user_id, patient_id, term_id, ip_address)
  SELECT
    'paciente'::public.user_role,
    'c1000000-0000-4000-8000-000000000006',
    v_avaliacao_patient_2,
    lt.id,
    '127.0.0.1'::inet
  FROM public.legal_terms lt
  WHERE lt.is_current = true
    AND lt.term_type IN ('TERMO_ADESAO', 'DIRETRIZES', 'LGPD')
    AND NOT EXISTS (
      SELECT 1 FROM public.digital_acceptances da
      WHERE da.patient_id = v_avaliacao_patient_2 AND da.term_id = lt.id
    );

  -- ===== EVOLUÇÕES PENDENTES (sessões realizadas sem registro) =====
  INSERT INTO public.patients (
    id, full_name, cpf, birth_date, sex, care_status, patient_level,
    region_id, city_id, allocated_professional_id,
    suggested_weekly_frequency, attendance_period, clinical_summary, is_data_complete
  ) VALUES
    (
      v_patient_evol_maria, 'Maria Helena Costa', '66666666666', '1952-05-14', 'F', 'ATIVO', 'N2',
      v_region_a_id, v_maua_city_id, v_professional_id, 2, 'MANHA',
      'Reabilitação pós-artroplastia de quadril. Deambula com bengala.', true
    ),
    (
      v_patient_evol_joao, 'João Pereira Santos', '77777777777', '1945-11-03', 'M', 'ATIVO', 'N1',
      v_region_a_id, v_maua_city_id, v_professional_id, 1, 'TARDE',
      'Parkinson em estágio inicial. Queixa de rigidez em MMSS.', true
    )
  ON CONFLICT (id) DO UPDATE SET allocated_professional_id = EXCLUDED.allocated_professional_id;

  DELETE FROM public.patient_addresses WHERE patient_id IN (v_patient_evol_maria, v_patient_evol_joao);
  INSERT INTO public.patient_addresses (patient_id, full_address, street, number, neighborhood, city_id, postal_code, is_primary)
  VALUES
    (v_patient_evol_maria, 'Rua Ipiranga, 45 - Vila Bocaina, Mauá/SP', 'Rua Ipiranga', '45', 'Vila Bocaina', v_maua_city_id, '09350000', true),
    (v_patient_evol_joao, 'Av. Papa João XXIII, 890 - Centro, Mauá/SP', 'Av. Papa João XXIII', '890', 'Centro', v_maua_city_id, '09370000', true);

  INSERT INTO public.digital_acceptances (acceptor_role, acceptor_user_id, patient_id, term_id, ip_address)
  SELECT
    'paciente'::public.user_role,
    v_paciente_id,
    p.patient_id,
    lt.id,
    '127.0.0.1'::inet
  FROM (VALUES (v_patient_evol_maria), (v_patient_evol_joao)) AS p(patient_id)
  CROSS JOIN public.legal_terms lt
  WHERE lt.is_current = true
    AND lt.term_type IN ('TERMO_ADESAO', 'DIRETRIZES', 'LGPD')
    AND NOT EXISTS (
      SELECT 1 FROM public.digital_acceptances da
      WHERE da.patient_id = p.patient_id AND da.term_id = lt.id
    );

  DELETE FROM public.medical_records WHERE session_id IN (
    'e3000000-0000-4000-8000-000000000001',
    'e3000000-0000-4000-8000-000000000002',
    'e3000000-0000-4000-8000-000000000003'
  );
  DELETE FROM public.care_sessions WHERE id IN (
    'e3000000-0000-4000-8000-000000000001',
    'e3000000-0000-4000-8000-000000000002',
    'e3000000-0000-4000-8000-000000000003'
  );
  DELETE FROM public.care_cycles WHERE id IN (v_cycle_evol_maria, v_cycle_evol_joao);

  INSERT INTO public.care_cycles (
    id, patient_id, cycle_number, session_count, assigned_professional_id,
    pricing_version_id, region_id, patient_level, session_unit_price_cents,
    total_amount_cents, status, payment_status, started_at, created_at
  ) VALUES
    (
      v_cycle_evol_maria, v_patient_evol_maria, 1, 8, v_professional_id,
      v_pricing_v1, v_region_a_id, 'N2', 13000, 104000,
      'ativo', 'pago', now() - interval '14 days', now() - interval '14 days'
    ),
    (
      v_cycle_evol_joao, v_patient_evol_joao, 1, 4, v_professional_id,
      v_pricing_v1, v_region_a_id, 'N1', 13000, 52000,
      'ativo', 'pago', now() - interval '7 days', now() - interval '7 days'
    );

  INSERT INTO public.care_sessions (
    id, cycle_id, session_number, status, professional_id, is_assessment_session,
    scheduled_at, check_in_at, check_out_at, updated_at
  ) VALUES
    (
      'e3000000-0000-4000-8000-000000000001', v_cycle_evol_maria, 1, 'realizada', v_professional_id, true,
      now() - interval '2 days 2 hours', now() - interval '2 days 2 hours',
      now() - interval '2 days 1 hour', now() - interval '2 days 1 hour'
    ),
    (
      'e3000000-0000-4000-8000-000000000002', v_cycle_evol_maria, 2, 'realizada', v_professional_id, false,
      now() - interval '30 hours', now() - interval '30 hours',
      now() - interval '29 hours', now() - interval '29 hours'
    ),
    (
      'e3000000-0000-4000-8000-000000000003', v_cycle_evol_joao, 1, 'realizada', v_professional_id, true,
      now() - interval '10 hours', now() - interval '10 hours',
      now() - interval '9 hours', now() - interval '9 hours'
    );

END;
$$;
