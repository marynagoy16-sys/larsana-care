-- Permite salvar coordenadas do endereço primário (geocoding no app do paciente).
-- Sem isso, UPDATE direto em patient_addresses falha silenciosamente por RLS.

CREATE OR REPLACE FUNCTION public.patient_set_primary_address_coordinates(
  p_latitude numeric,
  p_longitude numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id uuid;
  v_address_id uuid;
BEGIN
  IF public.current_user_role() <> 'paciente'::public.user_role THEN
    RAISE EXCEPTION 'Apenas pacientes podem atualizar coordenadas do endereço';
  END IF;

  v_patient_id := public.current_patient_id_for_user();
  IF v_patient_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum paciente vinculado';
  END IF;

  IF p_latitude IS NULL OR p_longitude IS NULL THEN
    RAISE EXCEPTION 'Coordenadas inválidas';
  END IF;

  IF p_latitude NOT BETWEEN -90 AND 90 OR p_longitude NOT BETWEEN -180 AND 180 THEN
    RAISE EXCEPTION 'Coordenadas fora do intervalo válido';
  END IF;

  SELECT pa.id INTO v_address_id
  FROM public.patient_addresses pa
  WHERE pa.patient_id = v_patient_id
  ORDER BY pa.is_primary DESC, pa.created_at ASC
  LIMIT 1;

  IF v_address_id IS NULL THEN
    RAISE EXCEPTION 'Endereço do paciente não encontrado';
  END IF;

  UPDATE public.patient_addresses
  SET
    latitude = p_latitude,
    longitude = p_longitude,
    updated_at = now()
  WHERE id = v_address_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.patient_set_primary_address_coordinates(numeric, numeric) TO authenticated;

COMMENT ON FUNCTION public.patient_set_primary_address_coordinates(numeric, numeric) IS
  'Salva lat/lng do endereço primário após geocoding no app (SECURITY DEFINER; bypass RLS).';
