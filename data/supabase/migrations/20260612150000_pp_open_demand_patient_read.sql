-- PP pode ler dados do paciente/endereço vinculados a demandas abertas (antes da alocação)

CREATE OR REPLACE FUNCTION public.pp_can_view_open_demand_patient(p_patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.current_user_role() = 'pp'
    AND EXISTS (
      SELECT 1
      FROM public.professionals pr
      WHERE pr.user_id = auth.uid()
        AND pr.credentialing_status = 'ativo'
    )
    AND EXISTS (
      SELECT 1
      FROM public.demands d
      WHERE d.patient_id = p_patient_id
        AND d.status = 'aberta'
    );
$$;

DROP POLICY IF EXISTS patients_pp_read ON public.patients;
CREATE POLICY patients_pp_read ON public.patients
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() = 'pp'
    AND (
      public.is_assigned_pp(id)
      OR public.pp_can_view_open_demand_patient(id)
    )
  );

DROP POLICY IF EXISTS patient_addresses_pp_read ON public.patient_addresses;
CREATE POLICY patient_addresses_pp_read ON public.patient_addresses
  FOR SELECT TO authenticated
  USING (
    public.is_assigned_pp(patient_id)
    OR public.pp_can_view_open_demand_patient(patient_id)
  );
