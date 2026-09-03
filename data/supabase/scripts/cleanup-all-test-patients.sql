-- Remove todos os pacientes de teste do banco (carga, seed demo, contas manuais de QA).
-- Mantém pacientes reais (ex.: sem padrão de teste no nome/e-mail/ID).
-- Aplicar: npx supabase db query --linked -f data/supabase/scripts/cleanup-all-test-patients.sql

DO $$
DECLARE
  v_patient_ids uuid[];
  v_demand_ids uuid[];
  v_cycle_ids uuid[];
  v_charge_ids uuid[];
  v_user_ids uuid[];
  v_deleted_patients integer;
BEGIN
  SELECT coalesce(array_agg(DISTINCT p.id), '{}')
  INTO v_patient_ids
  FROM public.patients p
  WHERE p.id::text LIKE 'e3000000-%'
     OR p.id::text LIKE 'e4100000-%'
     OR p.id::text LIKE 'd1000000-%'
     OR p.diagnostic_hypothesis IN ('Teste de carga', 'Teste carga avaliação')
     OR p.full_name ILIKE 'Load Test%'
     OR p.full_name ILIKE 'Load Charge%'
     OR p.full_name ILIKE '%Demonstração%'
     OR p.full_name ~* '\m(demo|teste)\M'
     OR EXISTS (
       SELECT 1
       FROM public.patient_addresses pa
       WHERE pa.patient_id = p.id
         AND (
           pa.street ILIKE 'Rua Load Test%'
           OR pa.full_address ILIKE '%Load Test%'
         )
     )
     OR EXISTS (
       SELECT 1
       FROM public.patient_responsibles pr
       LEFT JOIN public.profiles prof ON prof.id = pr.user_id
       WHERE pr.patient_id = p.id
         AND lower(coalesce(prof.email, pr.email, '')) IN (
           'cliente@larsanacare.com.br',
           'pedrop@gmail.com',
           'pedrog@gmail.com',
           'pedrob@gmail.com',
           'eduteste@gmail.com',
           'eduardo+1@gmail.com',
           'er+1@gmail.com',
           'er7579345@gmail.com',
           'teste.phil@larsana.app',
           'eds@gmail.com'
         )
     )
     OR EXISTS (
       SELECT 1
       FROM public.patient_responsibles pr
       LEFT JOIN public.profiles prof ON prof.id = pr.user_id
       WHERE pr.patient_id = p.id
         AND lower(coalesce(prof.email, pr.email, '')) LIKE 'familia.%@larsanacare.com.br'
     );

  IF cardinality(v_patient_ids) = 0 THEN
    RAISE NOTICE 'Nenhum paciente de teste encontrado.';
    RETURN;
  END IF;

  RAISE NOTICE 'Pacientes de teste identificados: %', cardinality(v_patient_ids);

  SELECT coalesce(array_agg(d.id), '{}')
  INTO v_demand_ids
  FROM public.demands d
  WHERE d.patient_id = ANY (v_patient_ids);

  SELECT coalesce(array_agg(cc.id), '{}')
  INTO v_cycle_ids
  FROM public.care_cycles cc
  WHERE cc.patient_id = ANY (v_patient_ids);

  SELECT coalesce(array_agg(c.id), '{}')
  INTO v_charge_ids
  FROM public.charges c
  WHERE c.patient_id = ANY (v_patient_ids);

  SELECT coalesce(array_agg(DISTINCT pr.user_id), '{}')
  INTO v_user_ids
  FROM public.patient_responsibles pr
  WHERE pr.patient_id = ANY (v_patient_ids)
    AND pr.user_id IS NOT NULL;

  DELETE FROM public.scheduling_messages sm
  USING public.scheduling_proposals sp
  WHERE sm.proposal_id = sp.id
    AND sp.patient_id = ANY (v_patient_ids);

  DELETE FROM public.scheduling_proposal_slots sps
  USING public.scheduling_proposals sp
  WHERE sps.proposal_id = sp.id
    AND sp.patient_id = ANY (v_patient_ids);

  DELETE FROM public.scheduling_proposals
  WHERE patient_id = ANY (v_patient_ids);

  DELETE FROM public.session_reschedule_requests
  WHERE patient_id = ANY (v_patient_ids);

  IF cardinality(v_demand_ids) > 0 THEN
    DELETE FROM public.demand_responses
    WHERE demand_id = ANY (v_demand_ids);

    DELETE FROM public.demand_commercial_snapshots
    WHERE demand_id = ANY (v_demand_ids);
  END IF;

  IF cardinality(v_charge_ids) > 0 THEN
    DELETE FROM public.assessment_pp_repasses
    WHERE charge_id = ANY (v_charge_ids);
  END IF;

  UPDATE public.patients
  SET
    assessment_fee_paid_charge_id = NULL,
    allocated_professional_id = NULL
  WHERE id = ANY (v_patient_ids);

  DELETE FROM public.sub_pp_repasses
  WHERE patient_id = ANY (v_patient_ids);

  IF cardinality(v_cycle_ids) > 0 THEN
    DELETE FROM public.cycle_legal_acceptances
    WHERE cycle_id = ANY (v_cycle_ids);

    UPDATE public.care_cycles
    SET active_pause_id = NULL
    WHERE id = ANY (v_cycle_ids);

    DELETE FROM public.refunds
    WHERE cycle_id = ANY (v_cycle_ids);

    DELETE FROM public.financial_ledger
    WHERE cycle_id = ANY (v_cycle_ids);

    DELETE FROM public.pause_events
    WHERE cycle_id = ANY (v_cycle_ids);

    DELETE FROM public.reschedule_events
    WHERE cycle_id = ANY (v_cycle_ids);

    DELETE FROM public.financial_closures
    WHERE cycle_id = ANY (v_cycle_ids);

    DELETE FROM public.sub_pp_repasses
    WHERE cycle_id = ANY (v_cycle_ids);

    DELETE FROM public.professional_invoices
    WHERE cycle_id = ANY (v_cycle_ids);

    DELETE FROM public.transfers
    WHERE cycle_id = ANY (v_cycle_ids);

    DELETE FROM public.transfer_queue
    WHERE cycle_id = ANY (v_cycle_ids);
  END IF;

  DELETE FROM public.session_adjustments sa
  USING public.care_sessions cs
  JOIN public.care_cycles cc ON cc.id = cs.cycle_id
  WHERE sa.session_id = cs.id
    AND cc.patient_id = ANY (v_patient_ids);

  DELETE FROM public.care_sessions cs
  USING public.care_cycles cc
  WHERE cs.cycle_id = cc.id
    AND cc.patient_id = ANY (v_patient_ids);

  DELETE FROM public.assessment_charges ac
  USING public.initial_assessments ia
  WHERE ac.assessment_id = ia.id
    AND ia.patient_id = ANY (v_patient_ids);

  DELETE FROM public.medical_records
  WHERE patient_id = ANY (v_patient_ids);

  DELETE FROM public.digital_acceptances
  WHERE patient_id = ANY (v_patient_ids);

  UPDATE public.charges
  SET
    cycle_id = NULL,
    assessment_id = NULL,
    demand_id = NULL,
    updated_at = now()
  WHERE patient_id = ANY (v_patient_ids);

  DELETE FROM public.charges
  WHERE patient_id = ANY (v_patient_ids);

  DELETE FROM public.care_cycles
  WHERE patient_id = ANY (v_patient_ids);

  DELETE FROM public.initial_assessments
  WHERE patient_id = ANY (v_patient_ids);

  DELETE FROM public.demands
  WHERE patient_id = ANY (v_patient_ids);

  DELETE FROM public.patient_waitlist
  WHERE patient_id = ANY (v_patient_ids);

  DELETE FROM public.treatment_pauses
  WHERE patient_id = ANY (v_patient_ids);

  DELETE FROM public.patient_addresses
  WHERE patient_id = ANY (v_patient_ids);

  DELETE FROM public.pill_orders
  WHERE patient_id = ANY (v_patient_ids);

  DELETE FROM public.attendance_sheets
  WHERE patient_id = ANY (v_patient_ids);

  DELETE FROM public.pause_events
  WHERE patient_id = ANY (v_patient_ids);

  DELETE FROM public.patient_responsibles
  WHERE patient_id = ANY (v_patient_ids);

  DELETE FROM public.patients
  WHERE id = ANY (v_patient_ids);

  GET DIAGNOSTICS v_deleted_patients = ROW_COUNT;
  RAISE NOTICE 'Pacientes removidos: %', v_deleted_patients;

  DELETE FROM auth.identities
  WHERE user_id::text LIKE 'e4000000-%'
     OR user_id = ANY (v_user_ids);

  DELETE FROM public.profiles
  WHERE id::text LIKE 'e4000000-%'
     OR id = ANY (v_user_ids);

  DELETE FROM auth.users
  WHERE id::text LIKE 'e4000000-%'
     OR id = ANY (v_user_ids);
END $$;

SELECT count(*) AS remaining_test_patients
FROM public.patients p
WHERE p.id::text LIKE 'e3000000-%'
   OR p.id::text LIKE 'e4100000-%'
   OR p.id::text LIKE 'd1000000-%'
   OR p.diagnostic_hypothesis IN ('Teste de carga', 'Teste carga avaliação')
   OR p.full_name ILIKE 'Load Test%'
   OR p.full_name ILIKE 'Load Charge%'
   OR p.full_name ILIKE '%Demonstração%'
   OR p.full_name ~* '\m(demo|teste)\M'
   OR EXISTS (
     SELECT 1
     FROM public.patient_responsibles pr
     LEFT JOIN public.profiles prof ON prof.id = pr.user_id
     WHERE pr.patient_id = p.id
       AND (
         lower(coalesce(prof.email, pr.email, '')) IN (
           'cliente@larsanacare.com.br',
           'pedrop@gmail.com',
           'pedrog@gmail.com',
           'pedrob@gmail.com',
           'eduteste@gmail.com',
           'eduardo+1@gmail.com',
           'er+1@gmail.com',
           'er7579345@gmail.com',
           'teste.phil@larsana.app',
           'eds@gmail.com'
         )
         OR lower(coalesce(prof.email, pr.email, '')) LIKE 'familia.%@larsanacare.com.br'
       )
   );

SELECT count(*) AS total_patients_remaining FROM public.patients;

SELECT id, full_name, cpf
FROM public.patients
ORDER BY full_name;
