-- Obsoleto: use cleanup-all-test-patients.sql (inclui carga + seed demo + contas QA).
-- Remove apenas pacientes de teste de carga (200 demandas + 100 cobranças + extras do script).
-- Aplicar: npx supabase db query --linked -f data/supabase/scripts/cleanup-load-test-patients.sql

DO $$
DECLARE
  v_patient_ids uuid[];
  v_demand_ids uuid[];
  v_cycle_ids uuid[];
  v_charge_ids uuid[];
  v_user_ids uuid[];
  v_deleted_patients integer;
BEGIN
  SELECT coalesce(array_agg(p.id), '{}')
  INTO v_patient_ids
  FROM public.patients p
  WHERE p.id::text LIKE 'e3000000-%'
     OR p.id::text LIKE 'e4100000-%'
     OR p.diagnostic_hypothesis IN ('Teste de carga', 'Teste carga avaliação')
     OR p.full_name ILIKE 'Load Test%'
     OR p.full_name ILIKE 'Load Charge%'
     OR EXISTS (
       SELECT 1
       FROM public.patient_addresses pa
       WHERE pa.patient_id = p.id
         AND (
           pa.street ILIKE 'Rua Load Test%'
           OR pa.full_address ILIKE '%Load Test%'
         )
     );

  IF cardinality(v_patient_ids) = 0 THEN
    RAISE NOTICE 'Nenhum paciente de teste de carga encontrado.';
    RETURN;
  END IF;

  RAISE NOTICE 'Pacientes de teste de carga: %', cardinality(v_patient_ids);

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
  WHERE pr.patient_id = ANY (v_patient_ids);

  -- Agendamento
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

  DELETE FROM public.patient_responsibles
  WHERE patient_id = ANY (v_patient_ids);

  DELETE FROM public.patients
  WHERE id = ANY (v_patient_ids);

  GET DIAGNOSTICS v_deleted_patients = ROW_COUNT;
  RAISE NOTICE 'Pacientes removidos: %', v_deleted_patients;

  -- Usuários auth sintéticos do seed de cobrança
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

-- Verificação
SELECT count(*) AS remaining_load_test_patients
FROM public.patients p
WHERE p.id::text LIKE 'e3000000-%'
   OR p.id::text LIKE 'e4100000-%'
   OR p.diagnostic_hypothesis IN ('Teste de carga', 'Teste carga avaliação')
   OR p.full_name ILIKE 'Load Test%'
   OR p.full_name ILIKE 'Load Charge%'
   OR EXISTS (
     SELECT 1
     FROM public.patient_addresses pa
     WHERE pa.patient_id = p.id
       AND (
         pa.street ILIKE 'Rua Load Test%'
         OR pa.full_address ILIKE '%Load Test%'
       )
   );
