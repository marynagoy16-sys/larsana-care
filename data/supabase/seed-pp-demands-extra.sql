-- Demandas extras para demo PP (parceiro@larsanacare.com.br / FISIO)
-- Aplicar: node data/supabase/scripts/apply-sql-remote.mjs data/supabase/seed-pp-demands-extra.sql
-- Idempotente — pacientes novos, sem ciclo alocado.

DO $$
DECLARE
  v_region_a_id uuid := 'a0000000-0000-4000-8000-000000000001';
  v_maua_city_id uuid;
BEGIN
  SELECT id INTO v_maua_city_id FROM public.cities WHERE name = 'Mauá' LIMIT 1;

  IF v_maua_city_id IS NULL THEN
    RAISE EXCEPTION 'Cidade Mauá não encontrada — execute as migrations V1-2026 antes deste script';
  END IF;

  -- Corrige coordenadas das demandas base (seed.sql sem lat/lng)
  UPDATE public.patient_addresses SET
    latitude = -23.6754, longitude = -46.4498, updated_at = now()
  WHERE id = 'd2000000-0000-4000-8000-000000000001' AND latitude IS NULL;

  UPDATE public.patient_addresses SET
    latitude = -23.6821, longitude = -46.4685, updated_at = now()
  WHERE id = 'd2000000-0000-4000-8000-000000000002' AND latitude IS NULL;

  UPDATE public.patient_addresses SET
    latitude = -23.6586, longitude = -46.4417, updated_at = now()
  WHERE id = 'd2000000-0000-4000-8000-000000000003' AND latitude IS NULL;

  INSERT INTO public.patients (
    id, full_name, cpf, birth_date, sex, care_status, patient_level,
    region_id, city_id, diagnostic_hypothesis, attendance_period,
    suggested_weekly_frequency, clinical_summary, is_data_complete, technical_category
  ) VALUES
    (
      'd1000000-0000-4000-8000-000000000010',
      'Antônio Souza',
      '66666666601',
      '1943-05-18',
      'M',
      'ATIVO',
      'N1',
      v_region_a_id,
      v_maua_city_id,
      'Parkinson — reabilitação funcional',
      'MANHA',
      2,
      'Idoso com rigidez e instabilidade postural. Família busca fisioterapia domiciliar 2x/semana.',
      true,
      'idoso_gerontologia'
    ),
    (
      'd1000000-0000-4000-8000-000000000011',
      'Rosa Machado',
      '66666666602',
      '1951-09-02',
      'F',
      'ATIVO',
      'N1',
      v_region_a_id,
      v_maua_city_id,
      'Artrose de joelhos — dor crônica',
      'TARDE',
      2,
      'Dificuldade para deambular escadas. Avaliação para plano de fortalecimento.',
      true,
      'idoso_gerontologia'
    ),
    (
      'd1000000-0000-4000-8000-000000000012',
      'João Pereira',
      '66666666603',
      '1978-01-25',
      'M',
      'ATIVO',
      'N2',
      v_region_a_id,
      v_maua_city_id,
      'Lombalgia mecânica',
      'MANHA',
      3,
      'Trabalhador autônomo com dor lombar recorrente. Solicita condicionamento e ergonomia.',
      true,
      'funcional_condicionamento'
    ),
    (
      'd1000000-0000-4000-8000-000000000013',
      'Helena Costa',
      '66666666604',
      '1968-11-30',
      'F',
      'ATIVO',
      'N1',
      v_region_a_id,
      v_maua_city_id,
      'AVC hemorrágico — sequelas motoras',
      'MANHA',
      2,
      'Hemiparesia esquerda leve. Necessita avaliação neurológica domiciliar.',
      true,
      'neurologico'
    ),
    (
      'd1000000-0000-4000-8000-000000000014',
      'Marcos Alves',
      '66666666605',
      '1982-04-14',
      'M',
      'ATIVO',
      'N2',
      v_region_a_id,
      v_maua_city_id,
      'Entorse de tornozelo — pós-imobilização',
      'TARDE',
      2,
      'Retorno funcional após trauma esportivo. Preferência turno tarde.',
      true,
      'ortopedico'
    ),
    (
      'd1000000-0000-4000-8000-000000000015',
      'Teresinha Lima',
      '66666666606',
      '1939-12-08',
      'F',
      'ATIVO',
      'N1',
      v_region_a_id,
      v_maua_city_id,
      'Síndrome da fragilidade',
      'MANHA',
      1,
      'Idosa acamada parcialmente. Família solicita avaliação geriátrica domiciliar.',
      true,
      'idoso_gerontologia'
    ),
    (
      'd1000000-0000-4000-8000-000000000016',
      'Paulo Ribeiro',
      '66666666607',
      '1970-07-03',
      'M',
      'ATIVO',
      'N2',
      v_region_a_id,
      v_maua_city_id,
      'Artroplastia de quadril — pós-operatório',
      'MANHA',
      3,
      '15 dias pós-cirurgia. Precisa de reabilitação conforme protocolo hospitalar.',
      true,
      'pos_operatorio'
    ),
    (
      'd1000000-0000-4000-8000-000000000017',
      'Isabela Nunes',
      '66666666608',
      '1990-02-21',
      'F',
      'ATIVO',
      'N1',
      v_region_a_id,
      v_maua_city_id,
      'Condicionamento pós-gestação',
      'TARDE',
      2,
      'Busca retorno seguro à atividade física com acompanhamento profissional.',
      true,
      'funcional_condicionamento'
    ),
    (
      'd1000000-0000-4000-8000-000000000018',
      'Orlando Dias',
      '66666666609',
      '1946-06-17',
      'M',
      'ATIVO',
      'N1',
      v_region_a_id,
      v_maua_city_id,
      'Doença pulmonar obstrutiva crônica',
      'MANHA',
      2,
      'Dispneia aos esforços. Encaminhamento para reabilitação respiratória domiciliar.',
      true,
      'funcional_condicionamento'
    ),
    (
      'd1000000-0000-4000-8000-000000000019',
      'Fernanda Gomes',
      '66666666610',
      '1975-10-11',
      'F',
      'ATIVO',
      'N2',
      v_region_a_id,
      v_maua_city_id,
      'Tendinite de ombro',
      'TARDE',
      2,
      'Dor ao elevar o braço direito. Avaliação ortopédica para plano domiciliar.',
      true,
      'ortopedico'
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
    updated_at = now();

  INSERT INTO public.patient_addresses (
    id, patient_id, full_address, street, number, neighborhood, city_id, postal_code, is_primary,
    latitude, longitude
  ) VALUES
    (
      'd2000000-0000-4000-8000-000000000010',
      'd1000000-0000-4000-8000-000000000010',
      'Rua Ipiranga, 412 - Centro - Mauá/SP',
      'Rua Ipiranga', '412', 'Centro', v_maua_city_id, '09310-120', true,
      -23.6678, -46.4612
    ),
    (
      'd2000000-0000-4000-8000-000000000011',
      'd1000000-0000-4000-8000-000000000011',
      'Rua João Ramalho, 78 - Vila Bocaina - Mauá/SP',
      'Rua João Ramalho', '78', 'Vila Bocaina', v_maua_city_id, '09350-010', true,
      -23.6712, -46.4555
    ),
    (
      'd2000000-0000-4000-8000-000000000012',
      'd1000000-0000-4000-8000-000000000012',
      'Av. Cap. João, 1205 - Matriz - Mauá/SP',
      'Av. Cap. João', '1205', 'Matriz', v_maua_city_id, '09370-005', true,
      -23.6645, -46.4489
    ),
    (
      'd2000000-0000-4000-8000-000000000013',
      'd1000000-0000-4000-8000-000000000013',
      'Rua das Orquídeas, 33 - Parque São Vicente - Mauá/SP',
      'Rua das Orquídeas', '33', 'Parque São Vicente', v_maua_city_id, '09381-200', true,
      -23.6790, -46.4720
    ),
    (
      'd2000000-0000-4000-8000-000000000014',
      'd1000000-0000-4000-8000-000000000014',
      'Rua Serra do Mar, 901 - Jardim Zaíra - Mauá/SP',
      'Rua Serra do Mar', '901', 'Jardim Zaíra', v_maua_city_id, '09321-450', true,
      -23.6560, -46.4350
    ),
    (
      'd2000000-0000-4000-8000-000000000015',
      'd1000000-0000-4000-8000-000000000015',
      'Travessa das Acácias, 15 - Vila Nossa Senhora das Vitórias - Mauá/SP',
      'Travessa das Acácias', '15', 'Vila N. Sra. das Vitórias', v_maua_city_id, '09360-080', true,
      -23.6835, -46.4430
    ),
    (
      'd2000000-0000-4000-8000-000000000016',
      'd1000000-0000-4000-8000-000000000016',
      'Rua Prof. João Batista, 560 - Feital - Mauá/SP',
      'Rua Prof. João Batista', '560', 'Feital', v_maua_city_id, '09340-330', true,
      -23.6620, -46.4780
    ),
    (
      'd2000000-0000-4000-8000-000000000017',
      'd1000000-0000-4000-8000-000000000017',
      'Rua Monteiro Lobato, 220 - Jardim Itapeva - Mauá/SP',
      'Rua Monteiro Lobato', '220', 'Jardim Itapeva', v_maua_city_id, '09330-110', true,
      -23.6745, -46.4290
    ),
    (
      'd2000000-0000-4000-8000-000000000018',
      'd1000000-0000-4000-8000-000000000018',
      'Rua Barão de Mauá, 1440 - Centro - Mauá/SP',
      'Rua Barão de Mauá', '1440', 'Centro', v_maua_city_id, '09310-010', true,
      -23.6688, -46.4655
    ),
    (
      'd2000000-0000-4000-8000-000000000019',
      'd1000000-0000-4000-8000-000000000019',
      'Rua Antônio de Souza, 67 - Parque das Américas - Mauá/SP',
      'Rua Antônio de Souza', '67', 'Parque das Américas', v_maua_city_id, '09371-040', true,
      -23.6610, -46.4520
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
      'f2000000-0000-4000-8000-000000000010',
      'd1000000-0000-4000-8000-000000000010',
      'd2000000-0000-4000-8000-000000000010',
      'FISIO', v_region_a_id, 'aberta',
      'Avaliação geriátrica — Parkinson, turno manhã.'
    ),
    (
      'f2000000-0000-4000-8000-000000000011',
      'd1000000-0000-4000-8000-000000000011',
      'd2000000-0000-4000-8000-000000000011',
      'FISIO', v_region_a_id, 'aberta',
      'Artrose bilateral — preferência tarde.'
    ),
    (
      'f2000000-0000-4000-8000-000000000012',
      'd1000000-0000-4000-8000-000000000012',
      'd2000000-0000-4000-8000-000000000012',
      'FISIO', v_region_a_id, 'aberta',
      'Lombalgia — condicionamento funcional 3x/semana.'
    ),
    (
      'f2000000-0000-4000-8000-000000000013',
      'd1000000-0000-4000-8000-000000000013',
      'd2000000-0000-4000-8000-000000000013',
      'FISIO', v_region_a_id, 'aberta',
      'Sequelas de AVC — avaliação neurológica domiciliar.'
    ),
    (
      'f2000000-0000-4000-8000-000000000014',
      'd1000000-0000-4000-8000-000000000014',
      'd2000000-0000-4000-8000-000000000014',
      'FISIO', v_region_a_id, 'aberta',
      'Pós-entorse — retorno ortopédico domiciliar.'
    ),
    (
      'f2000000-0000-4000-8000-000000000015',
      'd1000000-0000-4000-8000-000000000015',
      'd2000000-0000-4000-8000-000000000015',
      'FISIO', v_region_a_id, 'aberta',
      'Fragilidade geriátrica — 1x/semana inicial.'
    ),
    (
      'f2000000-0000-4000-8000-000000000016',
      'd1000000-0000-4000-8000-000000000016',
      'd2000000-0000-4000-8000-000000000016',
      'FISIO', v_region_a_id, 'aberta',
      'Pós-operatório quadril — protocolo hospitalar anexo.'
    ),
    (
      'f2000000-0000-4000-8000-000000000017',
      'd1000000-0000-4000-8000-000000000017',
      'd2000000-0000-4000-8000-000000000017',
      'FISIO', v_region_a_id, 'aberta',
      'Condicionamento pós-gestação — turno tarde.'
    ),
    (
      'f2000000-0000-4000-8000-000000000018',
      'd1000000-0000-4000-8000-000000000018',
      'd2000000-0000-4000-8000-000000000018',
      'FISIO', v_region_a_id, 'aberta',
      'Reabilitação respiratória — DPOC leve.'
    ),
    (
      'f2000000-0000-4000-8000-000000000019',
      'd1000000-0000-4000-8000-000000000019',
      'd2000000-0000-4000-8000-000000000019',
      'FISIO', v_region_a_id, 'aberta',
      'Tendinite de ombro — avaliação ortopédica.'
    )
  ON CONFLICT (id) DO UPDATE SET
    patient_id = EXCLUDED.patient_id,
    address_id = EXCLUDED.address_id,
    required_profession = EXCLUDED.required_profession,
    region_id = EXCLUDED.region_id,
    status = EXCLUDED.status,
    notes = EXCLUDED.notes,
    updated_at = now();

  RAISE NOTICE 'Seed PP demandas extras: 10 pacientes + demandas FISIO em Mauá';
END;
$$;
