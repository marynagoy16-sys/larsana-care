-- LarsanaCare: aceite de demanda (alocação) + RLS avaliação PP + leitura demanda alocada
-- Migration: 20260614120000_demand_accept_and_assessment_rls

ALTER TYPE public.alert_type ADD VALUE IF NOT EXISTS 'demanda_alocada';

CREATE OR REPLACE FUNCTION public.accept_demand(p_demand_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pp_id uuid;
  v_demand public.demands%ROWTYPE;
  v_patient_name text;
BEGIN
  v_pp_id := public.current_professional_id();
  IF v_pp_id IS NULL THEN
    RAISE EXCEPTION 'Profissional não encontrado';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.professionals p
    WHERE p.id = v_pp_id
      AND p.credentialing_status = 'ativo'
  ) THEN
    RAISE EXCEPTION 'Credenciamento inativo';
  END IF;

  SELECT * INTO v_demand
  FROM public.demands
  WHERE id = p_demand_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demanda não encontrada';
  END IF;

  IF v_demand.status <> 'aberta' THEN
    RAISE EXCEPTION 'Demanda não está aberta';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.demand_responses dr
    WHERE dr.demand_id = p_demand_id
      AND dr.professional_id = v_pp_id
      AND dr.response = 'accepted'
  ) THEN
    IF v_demand.status = 'alocada' AND v_demand.assigned_professional_id = v_pp_id THEN
      RETURN jsonb_build_object(
        'demand_id', p_demand_id,
        'patient_id', v_demand.patient_id,
        'demand_type', v_demand.demand_type
      );
    END IF;

    UPDATE public.demands
    SET
      status = 'alocada',
      assigned_professional_id = v_pp_id,
      updated_at = now()
    WHERE id = p_demand_id;

    UPDATE public.patients
    SET
      allocated_professional_id = v_pp_id,
      updated_at = now()
    WHERE id = v_demand.patient_id;

    RETURN jsonb_build_object(
      'demand_id', p_demand_id,
      'patient_id', v_demand.patient_id,
      'demand_type', v_demand.demand_type
    );
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.demand_responses dr
    WHERE dr.demand_id = p_demand_id
      AND dr.professional_id = v_pp_id
  ) THEN
    RAISE EXCEPTION 'Você já respondeu esta demanda';
  END IF;

  INSERT INTO public.demand_responses (demand_id, professional_id, response)
  VALUES (p_demand_id, v_pp_id, 'accepted');

  UPDATE public.demands
  SET
    status = 'alocada',
    assigned_professional_id = v_pp_id,
    updated_at = now()
  WHERE id = p_demand_id;

  UPDATE public.patients
  SET
    allocated_professional_id = v_pp_id,
    updated_at = now()
  WHERE id = v_demand.patient_id;

  SELECT p.full_name INTO v_patient_name
  FROM public.patients p
  WHERE p.id = v_demand.patient_id;

  INSERT INTO public.operational_alerts (
    alert_type,
    entity_type,
    entity_id,
    severity,
    title,
    message
  ) VALUES (
    'demanda_alocada',
    'demand',
    p_demand_id,
    'info',
    'Demanda alocada a profissional',
    coalesce(v_patient_name, 'Paciente') || ' — demanda assumida pelo profissional parceiro.'
  );

  RETURN jsonb_build_object(
    'demand_id', p_demand_id,
    'patient_id', v_demand.patient_id,
    'demand_type', v_demand.demand_type
  );
END;
$$;

REVOKE ALL ON FUNCTION public.accept_demand(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_demand(uuid) TO authenticated;

-- PP pode criar avaliação inicial para paciente alocado
CREATE POLICY assessments_pp_insert ON public.initial_assessments
  FOR INSERT TO authenticated
  WITH CHECK (
    evaluator_professional_id = public.current_professional_id()
    AND public.is_assigned_pp(patient_id)
  );

-- PP pode ler demandas alocadas a ele (histórico)
CREATE POLICY demands_pp_allocated_read ON public.demands
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() = 'pp'
    AND status = 'alocada'
    AND assigned_professional_id = public.current_professional_id()
  );
