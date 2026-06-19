-- Seed evoluções pendentes — sessões realizadas sem registro clínico
-- Login PP: parceiro@larsanacare.com.br / LarsanaCare2026!
-- Aplicar remoto: node data/supabase/scripts/apply-sql-remote.mjs data/supabase/seed-pp-evolucoes-pendentes.sql

DO $$
DECLARE
  v_professional_id uuid := 'd1000000-0000-4000-8000-000000000001';
  v_region_a_id uuid := 'a0000000-0000-4000-8000-000000000001';
  v_pricing_id uuid := 'b0000000-0000-4000-8000-000000000001';
  v_maua_city_id uuid;
  v_patient_maria uuid := 'd1000000-0000-4000-8000-000000000010';
  v_patient_joao uuid := 'd1000000-0000-4000-8000-000000000011';
  v_cycle_maria uuid := 'e1000000-0000-4000-8000-000000000010';
  v_cycle_joao uuid := 'e1000000-0000-4000-8000-000000000011';
  v_sess_maria_1 uuid := 'e3000000-0000-4000-8000-000000000001';
  v_sess_maria_2 uuid := 'e3000000-0000-4000-8000-000000000002';
  v_sess_joao_1 uuid := 'e3000000-0000-4000-8000-000000000003';
  v_demo_paciente_user uuid := 'c1000000-0000-4000-8000-000000000005';
BEGIN
  SELECT id INTO v_maua_city_id FROM public.cities WHERE name = 'Mauá' LIMIT 1;

  INSERT INTO public.patients (
    id, full_name, cpf, birth_date, sex, care_status, patient_level,
    region_id, city_id, allocated_professional_id,
    suggested_weekly_frequency, attendance_period, clinical_summary, is_data_complete
  ) VALUES
    (
      v_patient_maria,
      'Maria Helena Costa',
      '66666666666',
      '1952-05-14',
      'F',
      'ATIVO',
      'N2',
      v_region_a_id,
      v_maua_city_id,
      v_professional_id,
      2,
      'MANHA',
      'Reabilitação pós-artroplastia de quadril. Deambula com bengala.',
      true
    ),
    (
      v_patient_joao,
      'João Pereira Santos',
      '77777777777',
      '1945-11-03',
      'M',
      'ATIVO',
      'N1',
      v_region_a_id,
      v_maua_city_id,
      v_professional_id,
      1,
      'TARDE',
      'Parkinson em estágio inicial. Queixa de rigidez em MMSS.',
      true
    )
  ON CONFLICT (id) DO UPDATE SET
    allocated_professional_id = EXCLUDED.allocated_professional_id,
    full_name = EXCLUDED.full_name;

  DELETE FROM public.patient_addresses
  WHERE patient_id IN (v_patient_maria, v_patient_joao);

  INSERT INTO public.patient_addresses (patient_id, full_address, street, number, neighborhood, city_id, postal_code, is_primary)
  VALUES
    (v_patient_maria, 'Rua Ipiranga, 45 - Vila Bocaina, Mauá/SP', 'Rua Ipiranga', '45', 'Vila Bocaina', v_maua_city_id, '09350000', true),
    (v_patient_joao, 'Av. Papa João XXIII, 890 - Centro, Mauá/SP', 'Av. Papa João XXIII', '890', 'Centro', v_maua_city_id, '09370000', true);

  -- Aceites obrigatórios (trigger block_cycle_without_acceptance)
  INSERT INTO public.digital_acceptances (acceptor_role, acceptor_user_id, patient_id, term_id, ip_address)
  SELECT
    'paciente'::public.user_role,
    v_demo_paciente_user,
    p.patient_id,
    lt.id,
    '127.0.0.1'::inet
  FROM (VALUES (v_patient_maria), (v_patient_joao)) AS p(patient_id)
  CROSS JOIN public.legal_terms lt
  WHERE lt.is_current = true
    AND lt.term_type IN ('TERMO_ADESAO', 'DIRETRIZES', 'LGPD')
    AND NOT EXISTS (
      SELECT 1 FROM public.digital_acceptances da
      WHERE da.patient_id = p.patient_id AND da.term_id = lt.id
    );

  DELETE FROM public.medical_records
  WHERE session_id IN (v_sess_maria_1, v_sess_maria_2, v_sess_joao_1);

  DELETE FROM public.care_sessions
  WHERE id IN (v_sess_maria_1, v_sess_maria_2, v_sess_joao_1);

  DELETE FROM public.care_cycles
  WHERE id IN (v_cycle_maria, v_cycle_joao);

  INSERT INTO public.care_cycles (
    id, patient_id, cycle_number, session_count, assigned_professional_id,
    pricing_version_id, region_id, patient_level, session_unit_price_cents,
    total_amount_cents, status, payment_status, started_at, created_at
  ) VALUES
    (
      v_cycle_maria, v_patient_maria, 1, 8, v_professional_id,
      v_pricing_id, v_region_a_id, 'N2', 13000, 104000,
      'ativo', 'pago', now() - interval '14 days', now() - interval '14 days'
    ),
    (
      v_cycle_joao, v_patient_joao, 1, 4, v_professional_id,
      v_pricing_id, v_region_a_id, 'N1', 13000, 52000,
      'ativo', 'pago', now() - interval '7 days', now() - interval '7 days'
    );

  -- Sessões realizadas SEM evolução (pendentes de registro)
  INSERT INTO public.care_sessions (
    id, cycle_id, session_number, status, professional_id, is_assessment_session,
    scheduled_at, check_in_at, check_out_at, updated_at
  ) VALUES
    (
      v_sess_maria_1, v_cycle_maria, 1, 'realizada', v_professional_id, true,
      now() - interval '2 days 2 hours',
      now() - interval '2 days 2 hours',
      now() - interval '2 days 1 hour',
      now() - interval '2 days 1 hour'
    ),
    (
      v_sess_maria_2, v_cycle_maria, 2, 'realizada', v_professional_id, false,
      now() - interval '30 hours',
      now() - interval '30 hours',
      now() - interval '29 hours',
      now() - interval '29 hours'
    ),
    (
      v_sess_joao_1, v_cycle_joao, 1, 'realizada', v_professional_id, true,
      now() - interval '10 hours',
      now() - interval '10 hours',
      now() - interval '9 hours',
      now() - interval '9 hours'
    );

  RAISE NOTICE 'Seed evoluções pendentes: 3 sessões sem registro para PP demo';
END $$;
