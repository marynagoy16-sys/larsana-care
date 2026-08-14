-- Repasses demo — Profissional Parceiro Demo (parceiro@larsanacare.com.br)
-- Aplicar remoto: node data/supabase/scripts/apply-sql-remote.mjs data/supabase/seed-pp-repasses-demo.sql
-- Ou: cd data/supabase && npx supabase db query --linked -f seed-pp-repasses-demo.sql

DO $$
DECLARE
  v_professional_id uuid;
  v_patient_id uuid;
  v_pricing_id uuid := 'b0000000-0000-4000-8000-000000000001';
  v_region_id uuid := 'a0000000-0000-4000-8000-000000000001';
  v_demo_paciente_user uuid := 'c1000000-0000-4000-8000-000000000005';
  rec record;
BEGIN
  SELECT p.id INTO v_professional_id
  FROM public.professionals p
  JOIN auth.users u ON u.id = p.user_id
  WHERE u.email = 'parceiro@larsanacare.com.br'
  LIMIT 1;

  IF v_professional_id IS NULL THEN
    RAISE EXCEPTION 'Profissional demo não encontrado (parceiro@larsanacare.com.br)';
  END IF;

  SELECT id INTO v_patient_id
  FROM public.patients
  WHERE allocated_professional_id = v_professional_id
  ORDER BY created_at NULLS LAST
  LIMIT 1;

  IF v_patient_id IS NULL THEN
    SELECT id INTO v_patient_id FROM public.patients LIMIT 1;
  END IF;

  IF v_patient_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum paciente disponível para vincular ciclos de repasse demo';
  END IF;

  -- Aceites legais (trigger block_cycle_without_acceptance)
  INSERT INTO public.digital_acceptances (acceptor_role, acceptor_user_id, patient_id, term_id, ip_address)
  SELECT
    'paciente'::public.user_role,
    v_demo_paciente_user,
    v_patient_id,
    lt.id,
    '127.0.0.1'::inet
  FROM public.legal_terms lt
  WHERE lt.is_current = true
    AND lt.term_type IN ('TERMO_ADESAO', 'DIRETRIZES', 'LGPD')
    AND NOT EXISTS (
      SELECT 1 FROM public.digital_acceptances da
      WHERE da.patient_id = v_patient_id AND da.term_id = lt.id
    );

  -- Limpa dados demo anteriores (IDs fixos)
  DELETE FROM public.transfers
  WHERE id IN (
    'f5000000-0000-4000-8000-000000000001',
    'f5000000-0000-4000-8000-000000000002',
    'f5000000-0000-4000-8000-000000000003',
    'f5000000-0000-4000-8000-000000000004',
    'f5000000-0000-4000-8000-000000000005',
    'f5000000-0000-4000-8000-000000000006',
    'f5000000-0000-4000-8000-000000000007',
    'f5000000-0000-4000-8000-000000000008',
    'f5000000-0000-4000-8000-000000000009',
    'f5000000-0000-4000-8000-00000000000a'
  );

  DELETE FROM public.care_cycles
  WHERE id IN (
    'e5000000-0000-4000-8000-000000000001',
    'e5000000-0000-4000-8000-000000000002',
    'e5000000-0000-4000-8000-000000000003',
    'e5000000-0000-4000-8000-000000000004',
    'e5000000-0000-4000-8000-000000000005',
    'e5000000-0000-4000-8000-000000000006',
    'e5000000-0000-4000-8000-000000000007',
    'e5000000-0000-4000-8000-000000000008',
    'e5000000-0000-4000-8000-000000000009',
    'e5000000-0000-4000-8000-00000000000a'
  );

  -- Ciclos encerrados (1 repasse por ciclo)
  FOR rec IN
    SELECT *
    FROM (
      VALUES
        ('e5000000-0000-4000-8000-000000000001'::uuid, 101, 4, 52000,  36400, 15600, 'transferido'::public.transfer_status, interval '45 days', interval '42 days'),
        ('e5000000-0000-4000-8000-000000000002'::uuid, 102, 8, 104000, 72800, 31200, 'transferido'::public.transfer_status, interval '38 days', interval '35 days'),
        ('e5000000-0000-4000-8000-000000000003'::uuid, 103, 4, 48000,  33600, 14400, 'liberado'::public.transfer_status, interval '28 days', NULL),
        ('e5000000-0000-4000-8000-000000000004'::uuid, 104, 8, 96000,  67200, 28800, 'liberado'::public.transfer_status, interval '21 days', NULL),
        ('e5000000-0000-4000-8000-000000000005'::uuid, 105, 4, 44000,  30800, 13200, 'aguardando_validacao'::public.transfer_status, interval '14 days', NULL),
        ('e5000000-0000-4000-8000-000000000006'::uuid, 106, 8, 88000,  61600, 26400, 'aguardando_validacao'::public.transfer_status, interval '10 days', NULL),
        ('e5000000-0000-4000-8000-000000000007'::uuid, 107, 4, 40000,  28000, 12000, 'aguardando_nf'::public.transfer_status, interval '7 days', NULL),
        ('e5000000-0000-4000-8000-000000000008'::uuid, 108, 8, 80000,  56000, 24000, 'aguardando_nf'::public.transfer_status, interval '5 days', NULL),
        ('e5000000-0000-4000-8000-000000000009'::uuid, 109, 4, 36000,  25200, 10800, 'falhou'::public.transfer_status, interval '3 days', NULL),
        ('e5000000-0000-4000-8000-00000000000a'::uuid, 110, 8, 72000,  50400, 21600, 'transferido'::public.transfer_status, interval '1 day', interval '12 hours')
    ) AS t(cycle_id, cycle_number, session_count, total_cents, pp_cents, margin_cents, transfer_status, created_ago, transferred_ago)
  LOOP
    INSERT INTO public.care_cycles (
      id,
      patient_id,
      cycle_number,
      session_count,
      assigned_professional_id,
      pricing_version_id,
      region_id,
      patient_level,
      session_unit_price_cents,
      total_amount_cents,
      status,
      payment_status,
      started_at,
      closed_at,
      created_at
    ) VALUES (
      rec.cycle_id,
      v_patient_id,
      rec.cycle_number,
      rec.session_count,
      v_professional_id,
      v_pricing_id,
      v_region_id,
      'N2',
      rec.total_cents / rec.session_count,
      rec.total_cents,
      'encerrado',
      'pago',
      now() - rec.created_ago - interval '5 days',
      now() - rec.created_ago,
      now() - rec.created_ago
    );

    INSERT INTO public.transfers (
      id,
      cycle_id,
      professional_id,
      patient_charged_amount_cents,
      pp_transfer_amount_cents,
      larsana_margin_cents,
      pp_class,
      commission_percent,
      first_month_retention_applied,
      status,
      transferred_at,
      created_at
    ) VALUES (
      replace(rec.cycle_id::text, 'e5000000', 'f5000000')::uuid,
      rec.cycle_id,
      v_professional_id,
      rec.total_cents,
      rec.pp_cents,
      rec.margin_cents,
      'BRONZE',
      70.00,
      rec.cycle_number = 101,
      rec.transfer_status,
      CASE
        WHEN rec.transferred_ago IS NULL THEN NULL
        ELSE now() - rec.transferred_ago
      END,
      now() - rec.created_ago
    );
  END LOOP;

  RAISE NOTICE 'Seed repasses demo: % repasses para professional_id=%', 10, v_professional_id;
END $$;
