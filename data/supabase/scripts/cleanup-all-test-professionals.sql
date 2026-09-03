-- Remove profissionais de teste (seed demo, @larsanacare.com.br, contas QA manuais).
-- Mantém profissionais reais (ex.: e-mail corporativo externo, sem padrão de teste).
-- Aplicar: npx supabase db query --linked -f data/supabase/scripts/cleanup-all-test-professionals.sql

DO $$
DECLARE
  v_professional_ids uuid[];
  v_user_ids uuid[];
  v_cycle_ids uuid[];
  v_session_ids uuid[];
  v_demand_ids uuid[];
  v_deleted integer;
BEGIN
  SELECT coalesce(array_agg(DISTINCT p.id), '{}')
  INTO v_professional_ids
  FROM public.professionals p
  WHERE p.id::text LIKE 'd1000000-%'
     OR p.full_name ILIKE '%Demonstração%'
     OR p.full_name ~* '\m(demo|teste)\M'
     OR lower(coalesce(p.email, '')) LIKE '%@larsanacare.com.br'
     OR lower(coalesce(p.email, '')) IN ('edu+1@gmail.com');

  IF cardinality(v_professional_ids) = 0 THEN
    RAISE NOTICE 'Nenhum profissional de teste encontrado.';
    RETURN;
  END IF;

  RAISE NOTICE 'Profissionais de teste identificados: %', cardinality(v_professional_ids);

  SELECT coalesce(array_agg(DISTINCT p.user_id), '{}')
  INTO v_user_ids
  FROM public.professionals p
  WHERE p.id = ANY (v_professional_ids)
    AND p.user_id IS NOT NULL;

  SELECT coalesce(array_agg(cc.id), '{}')
  INTO v_cycle_ids
  FROM public.care_cycles cc
  WHERE cc.assigned_professional_id = ANY (v_professional_ids);

  SELECT coalesce(array_agg(cs.id), '{}')
  INTO v_session_ids
  FROM public.care_sessions cs
  WHERE cs.professional_id = ANY (v_professional_ids)
     OR cs.cycle_id = ANY (v_cycle_ids);

  SELECT coalesce(array_agg(DISTINCT d.id), '{}')
  INTO v_demand_ids
  FROM public.demands d
  WHERE d.assigned_professional_id = ANY (v_professional_ids);

  UPDATE public.demands
  SET assigned_professional_id = NULL, updated_at = now()
  WHERE assigned_professional_id = ANY (v_professional_ids);

  UPDATE public.patients
  SET allocated_professional_id = NULL, updated_at = now()
  WHERE allocated_professional_id = ANY (v_professional_ids);

  UPDATE public.pp_referrals
  SET referred_professional_id = NULL
  WHERE referred_professional_id = ANY (v_professional_ids);

  UPDATE public.session_reschedule_requests
  SET
    substitute_professional_id = NULL,
    original_professional_id = NULL,
    updated_at = now()
  WHERE substitute_professional_id = ANY (v_professional_ids)
     OR original_professional_id = ANY (v_professional_ids);

  DELETE FROM public.scheduling_messages sm
  USING public.scheduling_proposals sp
  WHERE sm.proposal_id = sp.id
    AND sp.professional_id = ANY (v_professional_ids);

  DELETE FROM public.scheduling_proposal_slots sps
  USING public.scheduling_proposals sp
  WHERE sps.proposal_id = sp.id
    AND sp.professional_id = ANY (v_professional_ids);

  DELETE FROM public.scheduling_proposals
  WHERE professional_id = ANY (v_professional_ids);

  DELETE FROM public.session_reschedule_requests
  WHERE responsible_professional_id = ANY (v_professional_ids);

  DELETE FROM public.assessment_pp_repasses
  WHERE professional_id = ANY (v_professional_ids);

  DELETE FROM public.attendance_sheets
  WHERE professional_id = ANY (v_professional_ids);

  IF cardinality(v_session_ids) > 0 THEN
    DELETE FROM public.session_adjustments
    WHERE session_id = ANY (v_session_ids);
  END IF;

  DELETE FROM public.sub_pp_repasses
  WHERE substitute_professional_id = ANY (v_professional_ids)
     OR assigned_professional_id = ANY (v_professional_ids);

  IF cardinality(v_cycle_ids) > 0 THEN
    DELETE FROM public.cycle_legal_acceptances
    WHERE cycle_id = ANY (v_cycle_ids);

    UPDATE public.care_cycles
    SET active_pause_id = NULL
    WHERE id = ANY (v_cycle_ids);

    DELETE FROM public.refunds WHERE cycle_id = ANY (v_cycle_ids);
    DELETE FROM public.financial_ledger WHERE cycle_id = ANY (v_cycle_ids);
    DELETE FROM public.pause_events WHERE cycle_id = ANY (v_cycle_ids);
    DELETE FROM public.reschedule_events WHERE cycle_id = ANY (v_cycle_ids);
    DELETE FROM public.financial_closures WHERE cycle_id = ANY (v_cycle_ids);
    DELETE FROM public.sub_pp_repasses WHERE cycle_id = ANY (v_cycle_ids);
    DELETE FROM public.professional_invoices WHERE cycle_id = ANY (v_cycle_ids);
    DELETE FROM public.transfers WHERE cycle_id = ANY (v_cycle_ids);
    DELETE FROM public.transfer_queue WHERE cycle_id = ANY (v_cycle_ids);
  END IF;

  DELETE FROM public.care_sessions
  WHERE professional_id = ANY (v_professional_ids)
     OR cycle_id = ANY (v_cycle_ids);

  DELETE FROM public.medical_records
  WHERE professional_id = ANY (v_professional_ids);

  DELETE FROM public.professional_invoices
  WHERE professional_id = ANY (v_professional_ids);

  DELETE FROM public.transfers
  WHERE professional_id = ANY (v_professional_ids);

  DELETE FROM public.transfer_queue
  WHERE professional_id = ANY (v_professional_ids);

  DELETE FROM public.initial_assessments
  WHERE evaluator_professional_id = ANY (v_professional_ids);

  DELETE FROM public.care_cycles
  WHERE assigned_professional_id = ANY (v_professional_ids);

  DELETE FROM public.professionals
  WHERE id = ANY (v_professional_ids);

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE NOTICE 'Profissionais removidos: %', v_deleted;

  DELETE FROM auth.identities
  WHERE user_id = ANY (v_user_ids);

  DELETE FROM public.profiles
  WHERE id = ANY (v_user_ids)
    AND primary_role = 'pp';

  DELETE FROM auth.users
  WHERE id = ANY (v_user_ids);
END $$;

SELECT count(*) AS remaining_test_professionals
FROM public.professionals p
WHERE p.id::text LIKE 'd1000000-%'
   OR p.full_name ~* '\m(demo|teste)\M'
   OR p.full_name ILIKE '%Demonstração%'
   OR lower(coalesce(p.email, '')) LIKE '%@larsanacare.com.br'
   OR lower(coalesce(p.email, '')) IN ('edu+1@gmail.com');

SELECT id, full_name, email, credentialing_status
FROM public.professionals
ORDER BY full_name;
