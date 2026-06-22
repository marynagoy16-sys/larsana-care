-- Seed prontuários (medical_records) — tela admin /admin/prontuarios
-- Requer profissional + paciente demo (seed.sql). Cria ciclos/sessões se ausentes.
-- Aplicar: node data/supabase/scripts/apply-sql-remote.mjs data/supabase/seed-medical-records.sql

DO $$
DECLARE
  v_professional_id uuid := 'd1000000-0000-4000-8000-000000000001';
  v_patient_demo uuid := 'd1000000-0000-4000-8000-000000000002';
  v_paciente_user uuid := 'c1000000-0000-4000-8000-000000000005';
  v_cycle_1 uuid := 'e1000000-0000-4000-8000-000000000001';
  v_cycle_2 uuid := 'e1000000-0000-4000-8000-000000000002';
  v_pricing_id uuid := 'b0000000-0000-4000-8000-000000000001';
  v_region_id uuid;
  v_crefito text;
  v_patient_maria uuid := 'd1000000-0000-4000-8000-000000000010';
  v_patient_joao uuid := 'd1000000-0000-4000-8000-000000000011';
  v_cycle_maria uuid := 'e1000000-0000-4000-8000-000000000010';
  v_cycle_joao uuid := 'e1000000-0000-4000-8000-000000000011';
  v_s_c1_n1 uuid;
  v_s_c1_n2 uuid;
  v_s_c1_n4 uuid;
  v_s_c1_n5 uuid;
  v_s_c2_n1 uuid;
  v_s_c2_n2 uuid;
  v_s_c2_n3 uuid;
  v_s_c2_n4 uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.professionals WHERE id = v_professional_id) THEN
    RAISE EXCEPTION 'Profissional demo não encontrado. Rode seed.sql antes.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.patients WHERE id = v_patient_demo) THEN
    RAISE EXCEPTION 'Paciente Demonstração não encontrado. Rode seed.sql antes.';
  END IF;

  SELECT p.region_id INTO v_region_id FROM public.patients p WHERE p.id = v_patient_demo;
  IF v_region_id IS NULL THEN
    SELECT id INTO v_region_id FROM public.regions ORDER BY created_at LIMIT 1;
  END IF;

  SELECT COALESCE(
    (SELECT registration_number FROM public.professional_councils WHERE professional_id = v_professional_id LIMIT 1),
    '269110-F'
  ) INTO v_crefito;

  -- Aceites obrigatórios do paciente demo (trigger de ciclo ativo)
  INSERT INTO public.digital_acceptances (acceptor_role, acceptor_user_id, patient_id, term_id, ip_address)
  SELECT
    'paciente'::public.user_role,
    v_paciente_user,
    v_patient_demo,
    lt.id,
    '127.0.0.1'::inet
  FROM public.legal_terms lt
  WHERE lt.is_current = true
    AND lt.term_type IN ('TERMO_ADESAO', 'DIRETRIZES', 'LGPD')
    AND NOT EXISTS (
      SELECT 1 FROM public.digital_acceptances da
      WHERE da.patient_id = v_patient_demo AND da.term_id = lt.id
    );

  -- Ciclos e sessões do Paciente Demonstração (idempotente)
  INSERT INTO public.care_cycles (
    id, patient_id, cycle_number, session_count, assigned_professional_id,
    pricing_version_id, region_id, patient_level, session_unit_price_cents,
    total_amount_cents, status, payment_status, started_at, created_at
  ) VALUES (
    v_cycle_1, v_patient_demo, 1, 8, v_professional_id,
    v_pricing_id, v_region_id, 'N2', 13000,
    104000, 'ativo', 'pago', now() - interval '10 days', now() - interval '10 days'
  )
  ON CONFLICT (patient_id, cycle_number) DO UPDATE SET
    status = EXCLUDED.status,
    payment_status = EXCLUDED.payment_status,
    assigned_professional_id = EXCLUDED.assigned_professional_id,
    updated_at = now();

  INSERT INTO public.care_cycles (
    id, patient_id, cycle_number, session_count, assigned_professional_id,
    pricing_version_id, region_id, patient_level, session_unit_price_cents,
    total_amount_cents, status, payment_status, started_at, closed_at, created_at
  ) VALUES (
    v_cycle_2, v_patient_demo, 2, 4, v_professional_id,
    v_pricing_id, v_region_id, 'N2', 13000,
    52000, 'encerrado', 'pago', now() - interval '25 days', now() - interval '15 days', now() - interval '25 days'
  )
  ON CONFLICT (patient_id, cycle_number) DO UPDATE SET
    status = EXCLUDED.status,
    payment_status = EXCLUDED.payment_status,
    closed_at = EXCLUDED.closed_at,
    updated_at = now();

  SELECT id INTO v_cycle_1 FROM public.care_cycles
  WHERE patient_id = v_patient_demo AND cycle_number = 1;
  SELECT id INTO v_cycle_2 FROM public.care_cycles
  WHERE patient_id = v_patient_demo AND cycle_number = 2;

  INSERT INTO public.care_sessions (
    id, cycle_id, session_number, status, professional_id, is_assessment_session,
    scheduled_at, check_in_at, check_out_at
  ) VALUES
    ('e2000000-0000-4000-8000-000000000001', v_cycle_1, 1, 'realizada', v_professional_id, true, now() - interval '9 days', now() - interval '9 days' + interval '9 hours', now() - interval '9 days' + interval '10 hours'),
    ('e2000000-0000-4000-8000-000000000002', v_cycle_1, 2, 'realizada', v_professional_id, false, now() - interval '7 days', now() - interval '7 days' + interval '9 hours', now() - interval '7 days' + interval '10 hours'),
    ('e2000000-0000-4000-8000-000000000004', v_cycle_1, 4, 'realizada', v_professional_id, false, now() - interval '3 days', now() - interval '3 days' + interval '9 hours', now() - interval '3 days' + interval '10 hours'),
    ('e2000000-0000-4000-8000-000000000005', v_cycle_1, 5, 'realizada', v_professional_id, false, now() - interval '1 day', now() - interval '1 day' + interval '9 hours', now() - interval '1 day' + interval '10 hours'),
    ('e2000000-0000-4000-8000-000000000011', v_cycle_2, 1, 'realizada', v_professional_id, false, now() - interval '24 days', now() - interval '24 days' + interval '10 hours', now() - interval '24 days' + interval '11 hours'),
    ('e2000000-0000-4000-8000-000000000012', v_cycle_2, 2, 'realizada', v_professional_id, false, now() - interval '22 days', now() - interval '22 days' + interval '10 hours', now() - interval '22 days' + interval '11 hours'),
    ('e2000000-0000-4000-8000-000000000013', v_cycle_2, 3, 'realizada', v_professional_id, false, now() - interval '20 days', now() - interval '20 days' + interval '10 hours', now() - interval '20 days' + interval '11 hours'),
    ('e2000000-0000-4000-8000-000000000014', v_cycle_2, 4, 'realizada', v_professional_id, false, now() - interval '18 days', now() - interval '18 days' + interval '10 hours', now() - interval '18 days' + interval '11 hours')
  ON CONFLICT (cycle_id, session_number) DO UPDATE SET
    status = EXCLUDED.status,
    professional_id = EXCLUDED.professional_id,
    is_assessment_session = EXCLUDED.is_assessment_session,
    scheduled_at = EXCLUDED.scheduled_at,
    check_in_at = EXCLUDED.check_in_at,
    check_out_at = EXCLUDED.check_out_at,
    updated_at = now();

  SELECT id INTO v_s_c1_n1 FROM public.care_sessions WHERE cycle_id = v_cycle_1 AND session_number = 1;
  SELECT id INTO v_s_c1_n2 FROM public.care_sessions WHERE cycle_id = v_cycle_1 AND session_number = 2;
  SELECT id INTO v_s_c1_n4 FROM public.care_sessions WHERE cycle_id = v_cycle_1 AND session_number = 4;
  SELECT id INTO v_s_c1_n5 FROM public.care_sessions WHERE cycle_id = v_cycle_1 AND session_number = 5;
  SELECT id INTO v_s_c2_n1 FROM public.care_sessions WHERE cycle_id = v_cycle_2 AND session_number = 1;
  SELECT id INTO v_s_c2_n2 FROM public.care_sessions WHERE cycle_id = v_cycle_2 AND session_number = 2;
  SELECT id INTO v_s_c2_n3 FROM public.care_sessions WHERE cycle_id = v_cycle_2 AND session_number = 3;
  SELECT id INTO v_s_c2_n4 FROM public.care_sessions WHERE cycle_id = v_cycle_2 AND session_number = 4;

  DELETE FROM public.medical_record_versions
  WHERE medical_record_id IN (
    SELECT id FROM public.medical_records
    WHERE id::text LIKE 'f1000000-%' OR id::text LIKE 'f2000000-%'
  );

  DELETE FROM public.medical_records
  WHERE id::text LIKE 'f1000000-%' OR id::text LIKE 'f2000000-%';

  INSERT INTO public.medical_records (
    id, patient_id, session_id, cycle_id, professional_id,
    crefito_number, record_type, content_richtext, recorded_at, created_at
  ) VALUES
    (
      'f1000000-0000-4000-8000-000000000001', v_patient_demo,
      v_s_c1_n1, v_cycle_1, v_professional_id,
      v_crefito, 'avaliacao',
      '<p><strong>Avaliação inicial.</strong> Paciente idoso, deambula com auxílio de andador. EVA 3/10 em ombro direito.</p>',
      now() - interval '9 days' + interval '10 hours',
      now() - interval '9 days' + interval '10 hours'
    ),
    (
      'f1000000-0000-4000-8000-000000000002', v_patient_demo,
      v_s_c1_n2, v_cycle_1, v_professional_id,
      v_crefito, 'evolucao',
      '<p>Mobilização articular e exercícios ativos assistidos. EVA 2/10 ao final.</p>',
      now() - interval '7 days' + interval '10 hours',
      now() - interval '7 days' + interval '10 hours'
    ),
    (
      'f1000000-0000-4000-8000-000000000003', v_patient_demo,
      v_s_c1_n4, v_cycle_1, v_professional_id,
      v_crefito, 'evolucao',
      '<p>Ganho de amplitude em flexão de ombro (~10°). Mantido plano de fortalecimento.</p>',
      now() - interval '3 days' + interval '10 hours',
      now() - interval '3 days' + interval '10 hours'
    ),
    (
      'f1000000-0000-4000-8000-000000000004', v_patient_demo,
      v_s_c1_n5, v_cycle_1, v_professional_id,
      v_crefito, 'evolucao',
      '<p>Exercícios funcionais para AVDS. Elevação frontal com 0,5 kg, sem dor significativa.</p>',
      now() - interval '1 day' + interval '10 hours',
      now() - interval '1 day' + interval '10 hours'
    ),
    (
      'f2000000-0000-4000-8000-000000000001', v_patient_demo,
      NULL, v_cycle_1, v_professional_id,
      v_crefito, 'evolucao',
      '<p>Registro administrativo: orientações domiciliares reforçadas com família.</p>',
      now() - interval '2 days' + interval '14 hours',
      now() - interval '2 days' + interval '14 hours'
    ),
    (
      'f1000000-0000-4000-8000-000000000011', v_patient_demo,
      v_s_c2_n1, v_cycle_2, v_professional_id,
      v_crefito, 'evolucao',
      '<p>Início do ciclo anterior. Baseline funcional registrada.</p>',
      now() - interval '24 days' + interval '11 hours',
      now() - interval '24 days' + interval '11 hours'
    ),
    (
      'f1000000-0000-4000-8000-000000000012', v_patient_demo,
      v_s_c2_n2, v_cycle_2, v_professional_id,
      v_crefito, 'evolucao',
      '<p>Treino de equilíbrio estático e transferências.</p>',
      now() - interval '22 days' + interval '11 hours',
      now() - interval '22 days' + interval '11 hours'
    ),
    (
      'f1000000-0000-4000-8000-000000000013', v_patient_demo,
      v_s_c2_n3, v_cycle_2, v_professional_id,
      v_crefito, 'evolucao',
      '<p>Progressão de carga em MMII. Marcha estável com supervisão.</p>',
      now() - interval '20 days' + interval '11 hours',
      now() - interval '20 days' + interval '11 hours'
    ),
    (
      'f1000000-0000-4000-8000-000000000014', v_patient_demo,
      v_s_c2_n4, v_cycle_2, v_professional_id,
      v_crefito, 'alta',
      '<p><strong>Alta do ciclo.</strong> Objetivos atingidos. Exercícios domiciliares orientados.</p>',
      now() - interval '18 days' + interval '11 hours',
      now() - interval '18 days' + interval '11 hours'
    )
  ON CONFLICT (id) DO UPDATE SET
    content_richtext = EXCLUDED.content_richtext,
    recorded_at = EXCLUDED.recorded_at,
    updated_at = now();

  -- Maria / João (se existirem ciclos e sessões no ambiente)
  SELECT id INTO v_cycle_maria FROM public.care_cycles
  WHERE patient_id = v_patient_maria AND cycle_number = 1;
  SELECT id INTO v_cycle_joao FROM public.care_cycles
  WHERE patient_id = v_patient_joao AND cycle_number = 1;

  IF v_cycle_maria IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.care_sessions WHERE cycle_id = v_cycle_maria AND session_number = 1
  ) THEN
    INSERT INTO public.medical_records (
      id, patient_id, session_id, cycle_id, professional_id,
      crefito_number, record_type, content_richtext, recorded_at, created_at
    ) VALUES
      (
        'f2000000-0000-4000-8000-000000000010', v_patient_maria,
        (SELECT id FROM public.care_sessions WHERE cycle_id = v_cycle_maria AND session_number = 1),
        v_cycle_maria, v_professional_id,
        v_crefito, 'avaliacao',
        '<p>Pós-artroplastia de quadril. Deambula com bengala.</p>',
        now() - interval '2 days' + interval '1 hour',
        now() - interval '2 days' + interval '1 hour'
      ),
      (
        'f2000000-0000-4000-8000-000000000011', v_patient_maria,
        (SELECT id FROM public.care_sessions WHERE cycle_id = v_cycle_maria AND session_number = 2),
        v_cycle_maria, v_professional_id,
        v_crefito, 'evolucao',
        '<p>Fortalecimento de glúteo médio e alongamento de flexores.</p>',
        now() - interval '29 hours',
        now() - interval '29 hours'
      )
    ON CONFLICT (id) DO UPDATE SET
      content_richtext = EXCLUDED.content_richtext,
      recorded_at = EXCLUDED.recorded_at,
      updated_at = now();
  END IF;

  IF v_cycle_joao IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.care_sessions WHERE cycle_id = v_cycle_joao AND session_number = 1
  ) THEN
    INSERT INTO public.medical_records (
      id, patient_id, session_id, cycle_id, professional_id,
      crefito_number, record_type, content_richtext, recorded_at, created_at
    ) VALUES
      (
        'f2000000-0000-4000-8000-000000000012', v_patient_joao,
        (SELECT id FROM public.care_sessions WHERE cycle_id = v_cycle_joao AND session_number = 1),
        v_cycle_joao, v_professional_id,
        v_crefito, 'avaliacao',
        '<p>Parkinson inicial. Rigidez em MMSS registrada.</p>',
        now() - interval '9 hours',
        now() - interval '9 hours'
      )
    ON CONFLICT (id) DO UPDATE SET
      content_richtext = EXCLUDED.content_richtext,
      recorded_at = EXCLUDED.recorded_at,
      updated_at = now();
  END IF;

  INSERT INTO public.medical_record_versions (medical_record_id, content_richtext, edited_at)
  SELECT
    'f1000000-0000-4000-8000-000000000002',
    '<p>Versão anterior: mobilização articular. Paciente referiu desconforto leve.</p>',
    now() - interval '6 days'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.medical_record_versions
    WHERE medical_record_id = 'f1000000-0000-4000-8000-000000000002'
  );

  RAISE NOTICE 'Seed prontuários: % registros',
    (SELECT count(*) FROM public.medical_records WHERE id::text LIKE 'f1000000-%' OR id::text LIKE 'f2000000-%');
END $$;
