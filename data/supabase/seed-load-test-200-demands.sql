-- 200 demandas abertas para teste de carga (idempotente por prefixo lt2)
-- Aplicar: node data/supabase/scripts/apply-sql-remote.mjs data/supabase/seed-load-test-200-demands.sql
-- Remover: node data/supabase/scripts/apply-sql-remote.mjs data/supabase/seed-load-test-200-demands-cleanup.sql

DO $$
DECLARE
  v_region_a_id uuid := 'a0000000-0000-4000-8000-000000000001';
  v_maua_city_id uuid;
  v_i integer;
  v_patient_id uuid;
  v_address_id uuid;
  v_demand_id uuid;
  v_lat numeric;
  v_lng numeric;
BEGIN
  SELECT id INTO v_maua_city_id FROM public.cities WHERE name = 'Mauá' LIMIT 1;
  IF v_maua_city_id IS NULL THEN
    RAISE EXCEPTION 'Cidade Mauá não encontrada';
  END IF;

  FOR v_i IN 1..200 LOOP
    v_patient_id := ('e3000000-0000-4000-8000-' || lpad(to_hex(v_i), 12, '0'))::uuid;
    v_address_id := ('e3100000-0000-4000-8000-' || lpad(to_hex(v_i), 12, '0'))::uuid;
    v_demand_id := ('e3200000-0000-4000-8000-' || lpad(to_hex(v_i), 12, '0'))::uuid;

    -- Coordenadas espalhadas em Mauá/SP (~±5 km), pseudo-aleatórias por id (sem trilhas diagonais)
    v_lat := -23.6678 + (mod(abs(hashtext(v_address_id::text)), 10000) / 100000.0 - 0.05);
    v_lng := -46.4614 + (mod(abs(hashtext(v_address_id::text || ':lng')), 10000) / 100000.0 - 0.05);

    INSERT INTO public.patients (
      id, full_name, cpf, birth_date, sex, care_status, patient_level,
      region_id, city_id, diagnostic_hypothesis, attendance_period,
      suggested_weekly_frequency, clinical_summary, is_data_complete, technical_category
    ) VALUES (
      v_patient_id,
      'Load Test Paciente ' || v_i,
      lpad((99000000000 + v_i)::text, 11, '0'),
      '1985-01-01',
      CASE WHEN v_i % 2 = 0 THEN 'F' ELSE 'M' END::public.patient_sex,
      'ATIVO'::public.patient_care_status,
      'N1'::public.patient_level,
      v_region_a_id,
      v_maua_city_id,
      'Teste de carga',
      'MANHA',
      2,
      'Paciente sintético para benchmark PP.',
      true,
      'funcional_condicionamento'
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.patient_addresses (
      id, patient_id, street, number, neighborhood, postal_code, city_id,
      full_address, latitude, longitude, is_primary
    ) VALUES (
      v_address_id,
      v_patient_id,
      'Rua Load Test',
      v_i::text,
      'Centro',
      '09310000',
      v_maua_city_id,
      'Rua Load Test, ' || v_i || ' — Centro, Mauá/SP',
      v_lat,
      v_lng,
      true
    )
    ON CONFLICT (id) DO UPDATE SET
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      updated_at = now();

    INSERT INTO public.demands (
      id, patient_id, address_id, required_profession, region_id, status, notes
    ) VALUES (
      v_demand_id,
      v_patient_id,
      v_address_id,
      'FISIO'::public.profession_type,
      v_region_a_id,
      'aberta'::public.demand_status,
      'Demanda load test #' || v_i
    )
    ON CONFLICT (id) DO UPDATE SET
      status = 'aberta',
      updated_at = now();
  END LOOP;
END $$;
