-- normalize_region_code deve retornar enum region_code (não text) para comparar com regions.code.

DROP FUNCTION IF EXISTS public.normalize_region_code(text);

CREATE OR REPLACE FUNCTION public.normalize_region_code(p_value text)
RETURNS public.region_code
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_raw text := upper(trim(coalesce(p_value, '')));
  v_match text;
BEGIN
  IF v_raw = '' THEN
    RETURN NULL;
  END IF;

  IF v_raw ~ '^[ABC]$' THEN
    RETURN v_raw::public.region_code;
  END IF;

  IF v_raw ~ 'REGI[ÃA]O\s*([ABC])' THEN
    v_match := (regexp_match(v_raw, 'REGI[ÃA]O\s*([ABC])'))[1];
    RETURN v_match::public.region_code;
  END IF;

  RETURN v_raw::public.region_code;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;
