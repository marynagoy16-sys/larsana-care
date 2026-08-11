-- LarsanaCare V1.1: solicitação de atendimento pelo paciente + lista de espera regional
-- Migration: 20260811120000_patient_service_request_waitlist

DO $$
BEGIN
  CREATE TYPE public.demand_request_source AS ENUM ('gestao', 'paciente_app');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.patient_waitlist_status AS ENUM (
    'pendente',
    'contatado',
    'convertido',
    'cancelado'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.regions
  ADD COLUMN IF NOT EXISTS patient_service_available boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.regions.patient_service_available IS
  'Quando true, pacientes desta região podem solicitar atendimento pelo app (soft launch por região).';

ALTER TABLE public.demands
  ADD COLUMN IF NOT EXISTS request_source public.demand_request_source NOT NULL DEFAULT 'gestao';

COMMENT ON COLUMN public.demands.request_source IS
  'Origem da demanda: gestão ou app do paciente/responsável.';

CREATE TABLE IF NOT EXISTS public.patient_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  region_id uuid REFERENCES public.regions (id) ON DELETE SET NULL,
  status public.patient_waitlist_status NOT NULL DEFAULT 'pendente',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  contacted_at timestamptz,
  created_by_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_patient_waitlist_active_patient
  ON public.patient_waitlist (patient_id)
  WHERE status = 'pendente';

CREATE INDEX IF NOT EXISTS idx_patient_waitlist_region ON public.patient_waitlist (region_id, status);
CREATE INDEX IF NOT EXISTS idx_demands_patient_status ON public.demands (patient_id, status);

UPDATE public.regions
SET patient_service_available = true
WHERE code IN ('A', 'B', 'C');

CREATE OR REPLACE FUNCTION public.current_patient_id_for_user()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pr.patient_id
  FROM public.patient_responsibles pr
  WHERE pr.user_id = auth.uid()
  ORDER BY pr.is_primary DESC, pr.created_at ASC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.region_has_patient_service(p_region_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT r.patient_service_available
      FROM public.regions r
      WHERE r.id = p_region_id
    ),
    false
  );
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

  SELECT * INTO v_patient FROM public.patients WHERE id = v_patient_id;

  IF v_patient.region_id IS NOT NULL THEN
    SELECT * INTO v_region FROM public.regions WHERE id = v_patient.region_id;
  END IF;

  SELECT pa.id INTO v_primary_address_id
  FROM public.patient_addresses pa
  WHERE pa.patient_id = v_patient_id
  ORDER BY pa.is_primary DESC, pa.created_at ASC
  LIMIT 1;

  SELECT * INTO v_demand
  FROM public.demands d
  WHERE d.patient_id = v_patient_id
    AND d.status IN ('aberta', 'alocada')
  ORDER BY d.created_at DESC
  LIMIT 1;

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

CREATE OR REPLACE FUNCTION public.patient_request_attendance(p_notes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id uuid;
  v_patient public.patients%ROWTYPE;
  v_primary_address_id uuid;
  v_existing public.demands%ROWTYPE;
  v_new_id uuid;
BEGIN
  IF public.current_user_role() <> 'paciente' THEN
    RAISE EXCEPTION 'Apenas responsáveis/pacientes podem solicitar atendimento';
  END IF;

  v_patient_id := public.current_patient_id_for_user();
  IF v_patient_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum paciente vinculado à sua conta';
  END IF;

  SELECT * INTO v_patient FROM public.patients WHERE id = v_patient_id;

  IF NOT public.region_has_patient_service(v_patient.region_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'no_coverage',
      'message', 'Ainda não estamos atendendo na sua região.'
    );
  END IF;

  SELECT * INTO v_existing
  FROM public.demands d
  WHERE d.patient_id = v_patient_id
    AND d.status IN ('aberta', 'alocada')
  ORDER BY d.created_at DESC
  LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'demand_id', v_existing.id,
      'already_exists', true,
      'status', v_existing.status
    );
  END IF;

  SELECT pa.id INTO v_primary_address_id
  FROM public.patient_addresses pa
  WHERE pa.patient_id = v_patient_id
  ORDER BY pa.is_primary DESC, pa.created_at ASC
  LIMIT 1;

  INSERT INTO public.demands (
    patient_id,
    address_id,
    region_id,
    status,
    notes,
    request_source
  )
  VALUES (
    v_patient_id,
    v_primary_address_id,
    v_patient.region_id,
    'aberta',
    NULLIF(trim(p_notes), ''),
    'paciente_app'
  )
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'success', true,
    'demand_id', v_new_id,
    'already_exists', false,
    'status', 'aberta'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.patient_join_waitlist(p_notes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id uuid;
  v_patient public.patients%ROWTYPE;
  v_existing public.patient_waitlist%ROWTYPE;
  v_new_id uuid;
BEGIN
  IF public.current_user_role() <> 'paciente' THEN
    RAISE EXCEPTION 'Apenas responsáveis/pacientes podem entrar na lista de espera';
  END IF;

  v_patient_id := public.current_patient_id_for_user();
  IF v_patient_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum paciente vinculado à sua conta';
  END IF;

  SELECT * INTO v_patient FROM public.patients WHERE id = v_patient_id;

  IF public.region_has_patient_service(v_patient.region_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'already_available',
      'message', 'Sua região já possui atendimento. Use Solicitar atendimento.'
    );
  END IF;

  SELECT * INTO v_existing
  FROM public.patient_waitlist w
  WHERE w.patient_id = v_patient_id
    AND w.status = 'pendente'
  LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'waitlist_id', v_existing.id,
      'already_exists', true
    );
  END IF;

  INSERT INTO public.patient_waitlist (
    patient_id,
    region_id,
    notes,
    created_by_user_id
  )
  VALUES (
    v_patient_id,
    v_patient.region_id,
    NULLIF(trim(p_notes), ''),
    auth.uid()
  )
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'success', true,
    'waitlist_id', v_new_id,
    'already_exists', false
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.patient_get_service_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.patient_request_attendance(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.patient_join_waitlist(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.region_has_patient_service(uuid) TO authenticated;

ALTER TABLE public.patient_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY patient_waitlist_staff ON public.patient_waitlist
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]));

CREATE POLICY patient_waitlist_patient_read ON public.patient_waitlist
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() = 'paciente'
    AND patient_id = public.current_patient_id_for_user()
  );

DROP POLICY IF EXISTS demands_patient_read ON public.demands;

CREATE POLICY demands_patient_read ON public.demands
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() = 'paciente'
    AND patient_id = public.current_patient_id_for_user()
  );
