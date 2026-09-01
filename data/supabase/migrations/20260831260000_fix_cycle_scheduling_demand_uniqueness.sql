-- Ao confirmar pagamento do ciclo, reutiliza demanda ativa existente do paciente
-- em vez de violar idx_demands_one_active_per_patient.

CREATE OR REPLACE FUNCTION public.ensure_cycle_start_scheduling_demand(p_cycle_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle public.care_cycles%ROWTYPE;
  v_patient public.patients%ROWTYPE;
  v_demand_id uuid;
  v_address_id uuid;
  v_pp_user_id uuid;
  v_patient_name text;
  v_reused boolean := false;
BEGIN
  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = p_cycle_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ciclo não encontrado';
  END IF;

  IF v_cycle.assigned_professional_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_demand_id
  FROM public.demands d
  WHERE d.cycle_id = p_cycle_id
    AND d.status = 'alocada'
  ORDER BY d.created_at DESC
  LIMIT 1;

  IF v_demand_id IS NOT NULL THEN
    RETURN v_demand_id;
  END IF;

  SELECT * INTO v_patient FROM public.patients WHERE id = v_cycle.patient_id;

  SELECT pa.id INTO v_address_id
  FROM public.patient_addresses pa
  WHERE pa.patient_id = v_cycle.patient_id
  ORDER BY pa.is_primary DESC, pa.created_at ASC
  LIMIT 1;

  -- Demanda ativa anterior (ex.: avaliação) — reaproveita para agendamento do ciclo.
  SELECT id INTO v_demand_id
  FROM public.demands d
  WHERE d.patient_id = v_cycle.patient_id
    AND d.status IN ('aberta', 'alocada')
  ORDER BY d.created_at DESC
  LIMIT 1;

  IF v_demand_id IS NOT NULL THEN
    UPDATE public.demands
    SET
      address_id = COALESCE(v_address_id, address_id),
      region_id = COALESCE(v_cycle.region_id, v_patient.region_id),
      status = 'alocada',
      assigned_professional_id = v_cycle.assigned_professional_id,
      demand_type = 'continuidade',
      request_source = 'gestao',
      cycle_id = p_cycle_id,
      updated_at = now()
    WHERE id = v_demand_id;

    v_reused := true;
  ELSE
    BEGIN
      INSERT INTO public.demands (
        patient_id,
        address_id,
        region_id,
        status,
        assigned_professional_id,
        demand_type,
        request_source,
        cycle_id
      ) VALUES (
        v_cycle.patient_id,
        v_address_id,
        COALESCE(v_cycle.region_id, v_patient.region_id),
        'alocada',
        v_cycle.assigned_professional_id,
        'continuidade',
        'gestao',
        p_cycle_id
      )
      RETURNING id INTO v_demand_id;
    EXCEPTION
      WHEN unique_violation THEN
        SELECT id INTO v_demand_id
        FROM public.demands d
        WHERE d.patient_id = v_cycle.patient_id
          AND d.status IN ('aberta', 'alocada')
        ORDER BY d.created_at DESC
        LIMIT 1;

        IF v_demand_id IS NULL THEN
          RAISE;
        END IF;

        UPDATE public.demands
        SET
          address_id = COALESCE(v_address_id, address_id),
          region_id = COALESCE(v_cycle.region_id, v_patient.region_id),
          status = 'alocada',
          assigned_professional_id = v_cycle.assigned_professional_id,
          demand_type = 'continuidade',
          request_source = 'gestao',
          cycle_id = p_cycle_id,
          updated_at = now()
        WHERE id = v_demand_id;

        v_reused := true;
    END;
  END IF;

  SELECT p.full_name INTO v_patient_name FROM public.patients p WHERE p.id = v_cycle.patient_id;

  SELECT pr.user_id INTO v_pp_user_id
  FROM public.professionals pr
  WHERE pr.id = v_cycle.assigned_professional_id;

  IF v_pp_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, payload)
    VALUES (
      v_pp_user_id,
      'agendamento'::public.notification_type,
      'Envie horários da primeira terapia',
      coalesce(v_patient_name, 'Paciente')
        || ' confirmou o pagamento. Envie opções de horário para a primeira sessão do ciclo.',
      jsonb_build_object(
        'patient_id', v_cycle.patient_id,
        'cycle_id', p_cycle_id,
        'demand_id', v_demand_id,
        'reused_demand', v_reused,
        'href', '/profissional/pacientes/' || v_cycle.patient_id::text
      )
    );
  END IF;

  RETURN v_demand_id;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_cycle_start_scheduling_demand(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_cycle_start_scheduling_demand(uuid) TO service_role;
