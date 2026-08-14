-- Demo PP: repõe demandas abertas + pacientes extras para testar aceite e agendamento
-- Senha padrão (dev): LarsanaCare2026!
--
-- Aplicar:
--   node data/supabase/scripts/apply-sql-remote.mjs data/supabase/seed-pp-demands-extra.sql
--   node data/supabase/scripts/apply-sql-remote.mjs data/supabase/seed-pp-scheduling-demo.sql

DO $$
DECLARE
  v_pw text := extensions.crypt('LarsanaCare2026!', extensions.gen_salt('bf'));
  v_region_a_id uuid := 'a0000000-0000-4000-8000-000000000001';
  v_maua_city_id uuid;
  v_demand_ids uuid[] := ARRAY[
    'f2000000-0000-4000-8000-000000000001',
    'f2000000-0000-4000-8000-000000000002',
    'f2000000-0000-4000-8000-000000000003',
    'f2000000-0000-4000-8000-000000000010',
    'f2000000-0000-4000-8000-000000000011',
    'f2000000-0000-4000-8000-000000000012',
    'f2000000-0000-4000-8000-000000000013',
    'f2000000-0000-4000-8000-000000000014',
    'f2000000-0000-4000-8000-000000000015',
    'f2000000-0000-4000-8000-000000000016',
    'f2000000-0000-4000-8000-000000000017',
    'f2000000-0000-4000-8000-000000000018',
    'f2000000-0000-4000-8000-000000000019',
    'f2000000-0000-4000-8000-000000000030',
    'f2000000-0000-4000-8000-000000000031',
    'f2000000-0000-4000-8000-000000000032',
    'f2000000-0000-4000-8000-000000000033',
    'f2000000-0000-4000-8000-000000000034',
    'f2000000-0000-4000-8000-000000000035',
    'f2000000-0000-4000-8000-000000000036',
    'f2000000-0000-4000-8000-000000000037'
  ]::uuid[];
BEGIN
  SELECT id INTO v_maua_city_id FROM public.cities WHERE name = 'Mauá' LIMIT 1;
  IF v_maua_city_id IS NULL THEN
    RAISE EXCEPTION 'Cidade Mauá não encontrada — execute as migrations V1-2026 antes deste script';
  END IF;

  -- Limpa propostas de agendamento das demandas de demo
  DELETE FROM public.scheduling_messages sm
  USING public.scheduling_proposals sp
  WHERE sm.proposal_id = sp.id
    AND sp.demand_id = ANY(v_demand_ids);

  DELETE FROM public.scheduling_proposal_slots sps
  USING public.scheduling_proposals sp
  WHERE sps.proposal_id = sp.id
    AND sp.demand_id = ANY(v_demand_ids);

  DELETE FROM public.scheduling_proposals sp
  WHERE sp.demand_id = ANY(v_demand_ids);

  DELETE FROM public.demand_responses dr
  WHERE dr.demand_id = ANY(v_demand_ids);

  UPDATE public.demands
  SET
    status = 'aberta',
    assigned_professional_id = NULL,
    updated_at = now()
  WHERE id = ANY(v_demand_ids);

  UPDATE public.patients p
  SET
    allocated_professional_id = NULL,
    updated_at = now()
  WHERE p.id IN (
    SELECT d.patient_id FROM public.demands d WHERE d.id = ANY(v_demand_ids)
  );

  -- Novos pacientes de teste (lote 2)
  INSERT INTO public.patients (
    id, full_name, cpf, birth_date, sex, care_status, patient_level,
    region_id, city_id, diagnostic_hypothesis, attendance_period,
    suggested_weekly_frequency, clinical_summary, is_data_complete, technical_category
  ) VALUES
    (
      'd1000000-0000-4000-8000-000000000030',
      'Alberto Nascimento',
      '77777777701',
      '1940-02-10',
      'M',
      'ATIVO',
      'N1',
      v_region_a_id,
      v_maua_city_id,
      'Queda recente — medo de caminhar',
      'MANHA',
      2,
      'Idoso com insegurança na marcha após queda doméstica. Família busca avaliação domiciliar.',
      true,
      'idoso_gerontologia'
    ),
    (
      'd1000000-0000-4000-8000-000000000031',
      'Beatriz Campos',
      '77777777702',
      '1958-08-22',
      'F',
      'ATIVO',
      'N1',
      v_region_a_id,
      v_maua_city_id,
      'Osteopenia — fortalecimento',
      'TARDE',
      2,
      'Encaminhada para condicionamento seguro em domicílio.',
      true,
      'funcional_condicionamento'
    ),
    (
      'd1000000-0000-4000-8000-000000000032',
      'César Duarte',
      '77777777703',
      '1972-04-05',
      'M',
      'ATIVO',
      'N2',
      v_region_a_id,
      v_maua_city_id,
      'Hérnia de disco — dor ciática',
      'MANHA',
      3,
      'Dor irradiada para MMII direito. Avaliação para plano domiciliar.',
      true,
      'funcional_condicionamento'
    ),
    (
      'd1000000-0000-4000-8000-000000000033',
      'Dora Freitas',
      '77777777704',
      '1944-12-19',
      'F',
      'ATIVO',
      'N1',
      v_region_a_id,
      v_maua_city_id,
      'Alzheimer inicial — mobilidade',
      'MANHA',
      1,
      'Acompanhamento funcional com foco em transferências e equilíbrio.',
      true,
      'idoso_gerontologia'
    ),
    (
      'd1000000-0000-4000-8000-000000000034',
      'Eduardo Prado',
      '77777777705',
      '1965-06-30',
      'M',
      'ATIVO',
      'N2',
      v_region_a_id,
      v_maua_city_id,
      'Lesão no manguito rotador',
      'TARDE',
      2,
      'Limitação para elevar o braço esquerdo. Preferência turno tarde.',
      true,
      'ortopedico'
    ),
    (
      'd1000000-0000-4000-8000-000000000035',
      'Flávia Rocha',
      '77777777706',
      '1988-03-14',
      'F',
      'ATIVO',
      'N1',
      v_region_a_id,
      v_maua_city_id,
      'Retorno pós-parto',
      'TARDE',
      2,
      'Busca reabilitação pélvica e condicionamento progressivo.',
      true,
      'funcional_condicionamento'
    ),
    (
      'd1000000-0000-4000-8000-000000000036',
      'Gilberto Sales',
      '77777777707',
      '1952-01-08',
      'M',
      'ATIVO',
      'N1',
      v_region_a_id,
      v_maua_city_id,
      'IAM prévio — recondicionamento',
      'MANHA',
      2,
      'Encaminhamento para reabilitação cardiovascular domiciliar leve.',
      true,
      'funcional_condicionamento'
    ),
    (
      'd1000000-0000-4000-8000-000000000037',
      'Heloísa Tavares',
      '77777777708',
      '1979-09-27',
      'F',
      'ATIVO',
      'N2',
      v_region_a_id,
      v_maua_city_id,
      'Fibromialgia — controle da dor',
      'TARDE',
      2,
      'Dor difusa e fadiga. Avaliação para plano domiciliar gradual.',
      true,
      'funcional_condicionamento'
    )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    cpf = EXCLUDED.cpf,
    birth_date = EXCLUDED.birth_date,
    sex = EXCLUDED.sex,
    care_status = EXCLUDED.care_status,
    patient_level = EXCLUDED.patient_level,
    region_id = EXCLUDED.region_id,
    city_id = EXCLUDED.city_id,
    diagnostic_hypothesis = EXCLUDED.diagnostic_hypothesis,
    attendance_period = EXCLUDED.attendance_period,
    suggested_weekly_frequency = EXCLUDED.suggested_weekly_frequency,
    clinical_summary = EXCLUDED.clinical_summary,
    is_data_complete = EXCLUDED.is_data_complete,
    technical_category = EXCLUDED.technical_category,
    allocated_professional_id = NULL,
    updated_at = now();

  INSERT INTO public.patient_addresses (
    id, patient_id, full_address, street, number, neighborhood, city_id, postal_code, is_primary,
    latitude, longitude
  ) VALUES
    (
      'd2000000-0000-4000-8000-000000000030',
      'd1000000-0000-4000-8000-000000000030',
      'Rua Dom Pedro II, 88 - Centro - Mauá/SP',
      'Rua Dom Pedro II', '88', 'Centro', v_maua_city_id, '09310-050', true,
      -23.6695, -46.4605
    ),
    (
      'd2000000-0000-4000-8000-000000000031',
      'd1000000-0000-4000-8000-000000000031',
      'Rua Estados Unidos, 210 - Vila Bocaina - Mauá/SP',
      'Rua Estados Unidos', '210', 'Vila Bocaina', v_maua_city_id, '09350-020', true,
      -23.6725, -46.4540
    ),
    (
      'd2000000-0000-4000-8000-000000000032',
      'd1000000-0000-4000-8000-000000000032',
      'Av. Júlio Michel, 980 - Matriz - Mauá/SP',
      'Av. Júlio Michel', '980', 'Matriz', v_maua_city_id, '09370-010', true,
      -23.6655, -46.4475
    ),
    (
      'd2000000-0000-4000-8000-000000000033',
      'd1000000-0000-4000-8000-000000000033',
      'Rua das Margaridas, 44 - Parque São Vicente - Mauá/SP',
      'Rua das Margaridas', '44', 'Parque São Vicente', v_maua_city_id, '09381-210', true,
      -23.6785, -46.4710
    ),
    (
      'd2000000-0000-4000-8000-000000000034',
      'd1000000-0000-4000-8000-000000000034',
      'Rua Amazonas, 715 - Jardim Zaíra - Mauá/SP',
      'Rua Amazonas', '715', 'Jardim Zaíra', v_maua_city_id, '09321-460', true,
      -23.6555, -46.4345
    ),
    (
      'd2000000-0000-4000-8000-000000000035',
      'd1000000-0000-4000-8000-000000000035',
      'Rua Pernambuco, 132 - Feital - Mauá/SP',
      'Rua Pernambuco', '132', 'Feital', v_maua_city_id, '09340-340', true,
      -23.6615, -46.4775
    ),
    (
      'd2000000-0000-4000-8000-000000000036',
      'd1000000-0000-4000-8000-000000000036',
      'Rua Bahia, 501 - Jardim Itapeva - Mauá/SP',
      'Rua Bahia', '501', 'Jardim Itapeva', v_maua_city_id, '09330-120', true,
      -23.6750, -46.4285
    ),
    (
      'd2000000-0000-4000-8000-000000000037',
      'd1000000-0000-4000-8000-000000000037',
      'Rua Rio de Janeiro, 318 - Parque das Américas - Mauá/SP',
      'Rua Rio de Janeiro', '318', 'Parque das Américas', v_maua_city_id, '09371-050', true,
      -23.6605, -46.4515
    )
  ON CONFLICT (id) DO UPDATE SET
    patient_id = EXCLUDED.patient_id,
    full_address = EXCLUDED.full_address,
    street = EXCLUDED.street,
    number = EXCLUDED.number,
    neighborhood = EXCLUDED.neighborhood,
    city_id = EXCLUDED.city_id,
    postal_code = EXCLUDED.postal_code,
    is_primary = EXCLUDED.is_primary,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now();

  INSERT INTO public.demands (
    id, patient_id, address_id, required_profession, region_id, status, notes
  ) VALUES
    (
      'f2000000-0000-4000-8000-000000000030',
      'd1000000-0000-4000-8000-000000000030',
      'd2000000-0000-4000-8000-000000000030',
      'FISIO', v_region_a_id, 'aberta',
      'Queda recente — avaliação geriátrica domiciliar.'
    ),
    (
      'f2000000-0000-4000-8000-000000000031',
      'd1000000-0000-4000-8000-000000000031',
      'd2000000-0000-4000-8000-000000000031',
      'FISIO', v_region_a_id, 'aberta',
      'Osteopenia — condicionamento tarde.'
    ),
    (
      'f2000000-0000-4000-8000-000000000032',
      'd1000000-0000-4000-8000-000000000032',
      'd2000000-0000-4000-8000-000000000032',
      'FISIO', v_region_a_id, 'aberta',
      'Dor ciática — avaliação funcional.'
    ),
    (
      'f2000000-0000-4000-8000-000000000033',
      'd1000000-0000-4000-8000-000000000033',
      'd2000000-0000-4000-8000-000000000033',
      'FISIO', v_region_a_id, 'aberta',
      'Alzheimer inicial — equilíbrio e transferências.'
    ),
    (
      'f2000000-0000-4000-8000-000000000034',
      'd1000000-0000-4000-8000-000000000034',
      'd2000000-0000-4000-8000-000000000034',
      'FISIO', v_region_a_id, 'aberta',
      'Manguito rotador — turno tarde.'
    ),
    (
      'f2000000-0000-4000-8000-000000000035',
      'd1000000-0000-4000-8000-000000000035',
      'd2000000-0000-4000-8000-000000000035',
      'FISIO', v_region_a_id, 'aberta',
      'Pós-parto — reabilitação progressiva.'
    ),
    (
      'f2000000-0000-4000-8000-000000000036',
      'd1000000-0000-4000-8000-000000000036',
      'd2000000-0000-4000-8000-000000000036',
      'FISIO', v_region_a_id, 'aberta',
      'Recondicionamento pós-IAM.'
    ),
    (
      'f2000000-0000-4000-8000-000000000037',
      'd1000000-0000-4000-8000-000000000037',
      'd2000000-0000-4000-8000-000000000037',
      'FISIO', v_region_a_id, 'aberta',
      'Fibromialgia — plano domiciliar gradual.'
    )
  ON CONFLICT (id) DO UPDATE SET
    patient_id = EXCLUDED.patient_id,
    address_id = EXCLUDED.address_id,
    required_profession = EXCLUDED.required_profession,
    region_id = EXCLUDED.region_id,
    status = 'aberta',
    assigned_professional_id = NULL,
    notes = EXCLUDED.notes,
    updated_at = now();

  -- Portal paciente: Teresinha, Orlando, Alberto e Beatriz (confirmar horários)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES
    (
      'c1000000-0000-4000-8000-000000000020',
      '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'familia.teresinha@larsanacare.com.br', v_pw, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Maria Lima","primary_role":"paciente"}'::jsonb,
      now(), now(), '', '', '', ''
    ),
    (
      'c1000000-0000-4000-8000-000000000021',
      '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'familia.orlando@larsanacare.com.br', v_pw, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Paulo Dias","primary_role":"paciente"}'::jsonb,
      now(), now(), '', '', '', ''
    ),
    (
      'c1000000-0000-4000-8000-000000000022',
      '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'familia.alberto@larsanacare.com.br', v_pw, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Renata Nascimento","primary_role":"paciente"}'::jsonb,
      now(), now(), '', '', '', ''
    ),
    (
      'c1000000-0000-4000-8000-000000000023',
      '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'familia.beatriz@larsanacare.com.br', v_pw, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Lucas Campos","primary_role":"paciente"}'::jsonb,
      now(), now(), '', '', '', ''
    )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = COALESCE(auth.users.email_confirmed_at, EXCLUDED.email_confirmed_at),
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = now();

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES
    (
      'c1000000-0000-4000-8000-000000000020', 'c1000000-0000-4000-8000-000000000020',
      '{"sub":"c1000000-0000-4000-8000-000000000020","email":"familia.teresinha@larsanacare.com.br"}'::jsonb,
      'email', 'c1000000-0000-4000-8000-000000000020', now(), now(), now()
    ),
    (
      'c1000000-0000-4000-8000-000000000021', 'c1000000-0000-4000-8000-000000000021',
      '{"sub":"c1000000-0000-4000-8000-000000000021","email":"familia.orlando@larsanacare.com.br"}'::jsonb,
      'email', 'c1000000-0000-4000-8000-000000000021', now(), now(), now()
    ),
    (
      'c1000000-0000-4000-8000-000000000022', 'c1000000-0000-4000-8000-000000000022',
      '{"sub":"c1000000-0000-4000-8000-000000000022","email":"familia.alberto@larsanacare.com.br"}'::jsonb,
      'email', 'c1000000-0000-4000-8000-000000000022', now(), now(), now()
    ),
    (
      'c1000000-0000-4000-8000-000000000023', 'c1000000-0000-4000-8000-000000000023',
      '{"sub":"c1000000-0000-4000-8000-000000000023","email":"familia.beatriz@larsanacare.com.br"}'::jsonb,
      'email', 'c1000000-0000-4000-8000-000000000023', now(), now(), now()
    )
  ON CONFLICT DO NOTHING;

  INSERT INTO public.profiles (id, email, full_name, primary_role) VALUES
    ('c1000000-0000-4000-8000-000000000020', 'familia.teresinha@larsanacare.com.br', 'Maria Lima', 'paciente'),
    ('c1000000-0000-4000-8000-000000000021', 'familia.orlando@larsanacare.com.br', 'Paulo Dias', 'paciente'),
    ('c1000000-0000-4000-8000-000000000022', 'familia.alberto@larsanacare.com.br', 'Renata Nascimento', 'paciente'),
    ('c1000000-0000-4000-8000-000000000023', 'familia.beatriz@larsanacare.com.br', 'Lucas Campos', 'paciente')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    primary_role = 'paciente';

  IF NOT EXISTS (
    SELECT 1 FROM public.patient_responsibles
    WHERE patient_id = 'd1000000-0000-4000-8000-000000000015'
      AND user_id = 'c1000000-0000-4000-8000-000000000020'
  ) THEN
    INSERT INTO public.patient_responsibles (patient_id, user_id, full_name, cpf, phone, email, is_primary)
    VALUES (
      'd1000000-0000-4000-8000-000000000015',
      'c1000000-0000-4000-8000-000000000020',
      'Maria Lima', '88888888801', '11988880001', 'familia.teresinha@larsanacare.com.br', true
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.patient_responsibles
    WHERE patient_id = 'd1000000-0000-4000-8000-000000000018'
      AND user_id = 'c1000000-0000-4000-8000-000000000021'
  ) THEN
    INSERT INTO public.patient_responsibles (patient_id, user_id, full_name, cpf, phone, email, is_primary)
    VALUES (
      'd1000000-0000-4000-8000-000000000018',
      'c1000000-0000-4000-8000-000000000021',
      'Paulo Dias', '88888888802', '11988880002', 'familia.orlando@larsanacare.com.br', true
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.patient_responsibles
    WHERE patient_id = 'd1000000-0000-4000-8000-000000000030'
      AND user_id = 'c1000000-0000-4000-8000-000000000022'
  ) THEN
    INSERT INTO public.patient_responsibles (patient_id, user_id, full_name, cpf, phone, email, is_primary)
    VALUES (
      'd1000000-0000-4000-8000-000000000030',
      'c1000000-0000-4000-8000-000000000022',
      'Renata Nascimento', '88888888803', '11988880003', 'familia.alberto@larsanacare.com.br', true
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.patient_responsibles
    WHERE patient_id = 'd1000000-0000-4000-8000-000000000031'
      AND user_id = 'c1000000-0000-4000-8000-000000000023'
  ) THEN
    INSERT INTO public.patient_responsibles (patient_id, user_id, full_name, cpf, phone, email, is_primary)
    VALUES (
      'd1000000-0000-4000-8000-000000000031',
      'c1000000-0000-4000-8000-000000000023',
      'Lucas Campos', '88888888804', '11988880004', 'familia.beatriz@larsanacare.com.br', true
    );
  END IF;

  RAISE NOTICE 'Seed agendamento demo: demandas reabertas + 8 pacientes novos + 4 logins família';
END;
$$;
