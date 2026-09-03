-- Corrige gate de prontuário: care_sessions usa professional_id, não assigned_professional_id.

CREATE OR REPLACE FUNCTION public.enforce_pp_clinical_access_gate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pp_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'medical_records' THEN
    v_pp_id := NEW.professional_id;

    IF v_pp_id IS NULL AND NEW.session_id IS NOT NULL THEN
      SELECT cs.professional_id INTO v_pp_id
      FROM public.care_sessions cs
      WHERE cs.id = NEW.session_id;
    END IF;
  END IF;

  IF v_pp_id IS NOT NULL THEN
    PERFORM public.assert_pp_can_access_clinical_data(v_pp_id);
  END IF;

  RETURN NEW;
END;
$$;
