-- Fase 2: paciente canônico (duplicatas) + demanda ativa em qualquer vínculo

CREATE OR REPLACE FUNCTION public.current_patient_id_for_user()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pr.patient_id
  FROM public.patient_responsibles pr
  JOIN public.patients pt ON pt.id = pr.patient_id
  WHERE pr.user_id = auth.uid()
  ORDER BY
    (
      EXISTS (
        SELECT 1
        FROM public.demands d
        WHERE d.patient_id = pt.id
          AND d.status IN ('aberta', 'alocada')
      )
    ) DESC,
    (
      EXISTS (
        SELECT 1
        FROM public.patient_addresses pa
        WHERE pa.patient_id = pt.id
      )
    ) DESC,
    (pt.region_id IS NOT NULL) DESC,
    pt.is_data_complete DESC,
    pr.is_primary DESC,
    pr.created_at ASC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.patient_get_service_status()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id uuid;
  v_patient public.patients%ROWTYPE;
  v_region public.regions%ROWTYPE;
  v_demand public.demands%ROWTYPE;
  v_waitlist public.patient_waitlist%ROWTYPE;
  v_primary_address_id uuid;
BEGIN
  v_patient_id := public.current_patient_id_for_user();
  IF v_patient_id IS NULL THEN
    RETURN jsonb_build_object('linked', false);
  END IF;

  SELECT * INTO v_demand
  FROM public.demands d
  WHERE d.patient_id = ANY (public.current_patient_ids())
    AND d.status IN ('aberta', 'alocada')
  ORDER BY d.created_at DESC
  LIMIT 1;

  IF v_demand.id IS NOT NULL AND v_demand.patient_id IS DISTINCT FROM v_patient_id THEN
    v_patient_id := v_demand.patient_id;
  END IF;

  SELECT * INTO v_patient FROM public.patients WHERE id = v_patient_id;

  IF v_patient.region_id IS NOT NULL THEN
    SELECT * INTO v_region FROM public.regions WHERE id = v_patient.region_id;
  END IF;

  SELECT pa.id INTO v_primary_address_id
  FROM public.patient_addresses pa
  WHERE pa.patient_id = v_patient_id
  ORDER BY pa.is_primary DESC, pa.created_at ASC
  LIMIT 1;

  IF v_demand.id IS NULL THEN
    SELECT * INTO v_demand
    FROM public.demands d
    WHERE d.patient_id = v_patient_id
      AND d.status IN ('aberta', 'alocada')
    ORDER BY d.created_at DESC
    LIMIT 1;
  END IF;

  SELECT * INTO v_waitlist
  FROM public.patient_waitlist w
  WHERE w.patient_id = v_patient_id
    AND w.status = 'pendente'
  ORDER BY w.created_at DESC
  LIMIT 1;

  RETURN jsonb_build_object(
    'linked', true,
    'patient_id', v_patient_id,
    'patient_name', v_patient.full_name,
    'region_id', v_patient.region_id,
    'region_code', v_region.code,
    'region_name', v_region.name,
    'service_available', public.region_has_patient_service(v_patient.region_id),
    'primary_address_id', v_primary_address_id,
    'active_demand', CASE
      WHEN v_demand.id IS NULL THEN NULL
      ELSE jsonb_build_object(
        'id', v_demand.id,
        'status', v_demand.status,
        'demand_type', v_demand.demand_type,
        'request_source', v_demand.request_source,
        'created_at', v_demand.created_at,
        'assigned_professional_id', v_demand.assigned_professional_id
      )
    END,
    'waitlist', CASE
      WHEN v_waitlist.id IS NULL THEN NULL
      ELSE jsonb_build_object(
        'id', v_waitlist.id,
        'status', v_waitlist.status,
        'created_at', v_waitlist.created_at
      )
    END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.bootstrap_patient_account()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile public.profiles%ROWTYPE;
  v_patient_id uuid;
  v_full_name text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  v_patient_id := public.current_patient_id_for_user();
  IF v_patient_id IS NOT NULL THEN
    RETURN v_patient_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.patient_responsibles pr WHERE pr.user_id = v_user_id
  ) THEN
    RETURN public.current_patient_id_for_user();
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
  IF NOT FOUND OR v_profile.primary_role <> 'paciente'::public.user_role THEN
    RAISE EXCEPTION 'Apenas contas de paciente/responsável';
  END IF;

  v_full_name := COALESCE(v_profile.full_name, split_part(v_profile.email, '@', 1));

  INSERT INTO public.patients (full_name, is_data_complete, care_status)
  VALUES (v_full_name, false, 'ATIVO'::public.patient_care_status)
  RETURNING id INTO v_patient_id;

  INSERT INTO public.patient_responsibles (
    patient_id,
    user_id,
    full_name,
    email,
    is_primary
  ) VALUES (
    v_patient_id,
    v_user_id,
    v_full_name,
    v_profile.email,
    true
  );

  RETURN v_patient_id;
END;
$$;
