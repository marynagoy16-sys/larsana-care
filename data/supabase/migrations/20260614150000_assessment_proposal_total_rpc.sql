-- Estimativa de valor total da proposta (PP alocado / staff)

CREATE OR REPLACE FUNCTION public.estimate_assessment_proposal_total_cents(
  p_patient_id uuid,
  p_patient_level public.patient_level,
  p_session_count integer
)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_region_id uuid;
  v_unit_price integer;
BEGIN
  IF p_session_count NOT IN (4, 8, 12) THEN
    RAISE EXCEPTION 'Ciclo inválido';
  END IF;

  IF NOT (
    public.is_staff()
    OR EXISTS (
      SELECT 1
      FROM public.patients p
      WHERE p.id = p_patient_id
        AND p.allocated_professional_id = public.current_professional_id()
    )
  ) THEN
    RAISE EXCEPTION 'Sem permissão para estimar valor da proposta';
  END IF;

  SELECT p.region_id INTO v_region_id
  FROM public.patients p
  WHERE p.id = p_patient_id;

  IF v_region_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT e.session_price_cents INTO v_unit_price
  FROM public.pricing_matrix_entries e
  JOIN public.pricing_matrix_versions v ON v.id = e.version_id AND v.is_active = true
  WHERE e.region_id = v_region_id
    AND e.patient_level = p_patient_level
  LIMIT 1;

  IF v_unit_price IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN v_unit_price * p_session_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.estimate_assessment_proposal_total_cents(uuid, public.patient_level, integer)
  TO authenticated;
