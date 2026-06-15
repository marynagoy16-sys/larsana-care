-- Demandas tipo avaliação para ambiente de demonstração
-- Aplicar: node data/supabase/scripts/apply-sql-remote.mjs data/supabase/populate-demands-avaliacao.sql
-- Ou incluído em `supabase db reset` via seed.sql

DO $$
DECLARE
  v_region_a_id uuid := 'a0000000-0000-4000-8000-000000000001';
  v_maua_city_id uuid;
  v_avaliacao_patient_1 uuid := 'd1000000-0000-4000-8000-000000000003';
  v_avaliacao_patient_2 uuid := 'd1000000-0000-4000-8000-000000000004';
  v_avaliacao_patient_3 uuid := 'd1000000-0000-4000-8000-000000000005';
  v_avaliacao_addr_1 uuid := 'd2000000-0000-4000-8000-000000000001';
  v_avaliacao_addr_2 uuid := 'd2000000-0000-4000-8000-000000000002';
  v_avaliacao_addr_3 uuid := 'd2000000-0000-4000-8000-000000000003';
  v_avaliacao_demand_1 uuid := 'f2000000-0000-4000-8000-000000000001';
  v_avaliacao_demand_2 uuid := 'f2000000-0000-4000-8000-000000000002';
  v_avaliacao_demand_3 uuid := 'f2000000-0000-4000-8000-000000000003';
BEGIN
  SELECT id INTO v_maua_city_id FROM public.cities WHERE name = 'Mauá' LIMIT 1;

  IF v_maua_city_id IS NULL THEN
    RAISE EXCEPTION 'Cidade Mauá não encontrada — execute as migrations V1-2026 antes deste script';
  END IF;

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

  RAISE NOTICE 'Demandas avaliação criadas: %, %, %',
    v_avaliacao_demand_1, v_avaliacao_demand_2, v_avaliacao_demand_3;
END;
$$;
