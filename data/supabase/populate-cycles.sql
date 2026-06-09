-- LarsanaCare — Seed care cycles and sessions for testing

DO $$
DECLARE
  v_patient_id uuid := 'd1000000-0000-4000-8000-000000000002';
  v_professional_id uuid := 'd1000000-0000-4000-8000-000000000001';
  v_pricing_version_id uuid := 'b0000000-0000-4000-8000-000000000001';
  v_region_a_id uuid := 'a0000000-0000-4000-8000-000000000001';
  v_cycle_1_id uuid := 'e1000000-0000-4000-8000-000000000001';
  v_cycle_2_id uuid := 'e1000000-0000-4000-8000-000000000002';
  v_cycle_3_id uuid := 'e1000000-0000-4000-8000-000000000003';
BEGIN
  -- Cleanup existing testing cycles to allow clean re-run
  DELETE FROM public.care_sessions WHERE cycle_id IN (v_cycle_1_id, v_cycle_2_id, v_cycle_3_id);
  DELETE FROM public.care_cycles WHERE id IN (v_cycle_1_id, v_cycle_2_id, v_cycle_3_id);

  -- 1. Active Cycle (8 sessions, 4 realized, 1 missed, 3 scheduled)
  INSERT INTO public.care_cycles (
    id, patient_id, cycle_number, session_count, assigned_professional_id,
    pricing_version_id, region_id, patient_level, session_unit_price_cents,
    total_amount_cents, status, payment_status, started_at, created_at
  ) VALUES (
    v_cycle_1_id, v_patient_id, 1, 8, v_professional_id,
    v_pricing_version_id, v_region_a_id, 'N2', 13000,
    104000, 'ativo', 'pago', now() - interval '10 days', now() - interval '10 days'
  );

  -- 1.1 Sessions for Active Cycle
  INSERT INTO public.care_sessions (
    cycle_id, session_number, status, professional_id, is_assessment_session,
    scheduled_at, check_in_at, check_out_at
  ) VALUES
    (v_cycle_1_id, 1, 'realizada', v_professional_id, true, now() - interval '9 days', now() - interval '9 days' + interval '9 hours', now() - interval '9 days' + interval '10 hours'),
    (v_cycle_1_id, 2, 'realizada', v_professional_id, false, now() - interval '7 days', now() - interval '7 days' + interval '9 hours', now() - interval '7 days' + interval '10 hours'),
    (v_cycle_1_id, 3, 'falta', v_professional_id, false, now() - interval '5 days', null, null),
    (v_cycle_1_id, 4, 'realizada', v_professional_id, false, now() - interval '3 days', now() - interval '3 days' + interval '9 hours', now() - interval '3 days' + interval '10 hours'),
    (v_cycle_1_id, 5, 'realizada', v_professional_id, false, now() - interval '1 days', now() - interval '1 days' + interval '9 hours', now() - interval '1 days' + interval '10 hours'),
    (v_cycle_1_id, 6, 'prevista', v_professional_id, false, now() + interval '1 days', null, null),
    (v_cycle_1_id, 7, 'prevista', v_professional_id, false, now() + interval '3 days', null, null),
    (v_cycle_1_id, 8, 'prevista', v_professional_id, false, now() + interval '5 days', null, null);


  -- 2. Completed Cycle (4 sessions, all realized)
  INSERT INTO public.care_cycles (
    id, patient_id, cycle_number, session_count, assigned_professional_id,
    pricing_version_id, region_id, patient_level, session_unit_price_cents,
    total_amount_cents, status, payment_status, started_at, closed_at, created_at
  ) VALUES (
    v_cycle_2_id, v_patient_id, 2, 4, v_professional_id,
    v_pricing_version_id, v_region_a_id, 'N2', 13000,
    52000, 'encerrado', 'pago', now() - interval '25 days', now() - interval '15 days', now() - interval '25 days'
  );

  -- 2.1 Sessions for Completed Cycle
  INSERT INTO public.care_sessions (
    cycle_id, session_number, status, professional_id, is_assessment_session,
    scheduled_at, check_in_at, check_out_at
  ) VALUES
    (v_cycle_2_id, 1, 'realizada', v_professional_id, false, now() - interval '24 days', now() - interval '24 days' + interval '10 hours', now() - interval '24 days' + interval '11 hours'),
    (v_cycle_2_id, 2, 'realizada', v_professional_id, false, now() - interval '22 days', now() - interval '22 days' + interval '10 hours', now() - interval '22 days' + interval '11 hours'),
    (v_cycle_2_id, 3, 'realizada', v_professional_id, false, now() - interval '20 days', now() - interval '20 days' + interval '10 hours', now() - interval '20 days' + interval '11 hours'),
    (v_cycle_2_id, 4, 'realizada', v_professional_id, false, now() - interval '18 days', now() - interval '18 days' + interval '10 hours', now() - interval '18 days' + interval '11 hours');


  -- 3. Pending Payment Cycle (12 sessions, all scheduled)
  INSERT INTO public.care_cycles (
    id, patient_id, cycle_number, session_count, assigned_professional_id,
    pricing_version_id, region_id, patient_level, session_unit_price_cents,
    total_amount_cents, status, payment_status, created_at
  ) VALUES (
    v_cycle_3_id, v_patient_id, 3, 12, v_professional_id,
    v_pricing_version_id, v_region_a_id, 'N2', 13000,
    156000, 'aguardando_pagamento', 'pendente', now()
  );

  -- 3.1 Sessions for Pending Payment Cycle
  INSERT INTO public.care_sessions (
    cycle_id, session_number, status, professional_id, is_assessment_session, scheduled_at
  ) VALUES
    (v_cycle_3_id, 1, 'prevista', v_professional_id, false, now() + interval '2 days'),
    (v_cycle_3_id, 2, 'prevista', v_professional_id, false, now() + interval '4 days'),
    (v_cycle_3_id, 3, 'prevista', v_professional_id, false, now() + interval '6 days'),
    (v_cycle_3_id, 4, 'prevista', v_professional_id, false, now() + interval '8 days'),
    (v_cycle_3_id, 5, 'prevista', v_professional_id, false, now() + interval '10 days'),
    (v_cycle_3_id, 6, 'prevista', v_professional_id, false, now() + interval '12 days'),
    (v_cycle_3_id, 7, 'prevista', v_professional_id, false, now() + interval '14 days'),
    (v_cycle_3_id, 8, 'prevista', v_professional_id, false, now() + interval '16 days'),
    (v_cycle_3_id, 9, 'prevista', v_professional_id, false, now() + interval '18 days'),
    (v_cycle_3_id, 10, 'prevista', v_professional_id, false, now() + interval '20 days'),
    (v_cycle_3_id, 11, 'prevista', v_professional_id, false, now() + interval '22 days'),
    (v_cycle_3_id, 12, 'prevista', v_professional_id, false, now() + interval '24 days');

END;
$$;
