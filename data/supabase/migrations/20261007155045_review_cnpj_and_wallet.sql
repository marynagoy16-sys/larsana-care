-- Preserva CNPJ (14 dígitos) na importação de profissionais.
-- normalize_cpf continua cortando em 11 para pacientes.

CREATE OR REPLACE FUNCTION public.normalize_cpf_cnpj(p_value text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_digits text;
BEGIN
  IF p_value IS NULL OR trim(p_value) = '' THEN
    RETURN NULL;
  END IF;

  IF p_value ~* '^[\d,.]+[eE][+\-]?\d+$' THEN
    v_digits := regexp_replace(trim((trunc(p_value::numeric))::text), '\D', '', 'g');
  ELSE
    v_digits := regexp_replace(p_value, '\D', '', 'g');
  END IF;

  IF length(v_digits) = 0 THEN
    RETURN NULL;
  END IF;

  IF length(v_digits) > 11 THEN
    RETURN left(v_digits, 14);
  END IF;

  RETURN left(v_digits, 11);
END;
$$;

CREATE OR REPLACE FUNCTION public.bulk_import_professionals(
  p_rows jsonb,
  p_skip_duplicates boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row jsonb;
  v_idx integer := 0;
  v_created integer := 0;
  v_errors jsonb := '[]'::jsonb;
  v_pp_id uuid;
  v_patente public.pp_patente;
  v_pp_class public.pp_class;
  v_wallet_id text;
  v_contract_number text;
  v_email text;
  v_document text;
  v_person_type public.person_type;
  v_run_id uuid;
BEGIN
  IF NOT public.is_staff() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN
    RAISE EXCEPTION 'p_rows deve ser um array JSON';
  END IF;

  INSERT INTO public.bulk_import_runs (import_kind, started_by, row_count)
  VALUES ('professionals', auth.uid(), jsonb_array_length(p_rows))
  RETURNING id INTO v_run_id;

  FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows)
  LOOP
    v_idx := v_idx + 1;
    BEGIN
      IF coalesce(trim(v_row->>'full_name'), '') = '' OR coalesce(trim(v_row->>'email'), '') = '' THEN
        RAISE EXCEPTION 'full_name e email obrigatórios';
      END IF;

      v_email := lower(trim(v_row->>'email'));
      v_document := public.normalize_cpf_cnpj(v_row->>'cpf_cnpj');
      v_person_type := CASE WHEN length(v_document) = 14 THEN 'PJ'::public.person_type ELSE 'PF'::public.person_type END;
      v_wallet_id := nullif(trim(v_row->>'asaas_wallet_id'), '');
      IF v_wallet_id IS NOT NULL AND v_wallet_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        RAISE EXCEPTION 'asaas_wallet_id deve ser um UUID válido';
      END IF;
      v_patente := coalesce(nullif(upper(trim(v_row->>'patente')), ''), 'BRONZE')::public.pp_patente;
      v_pp_class := CASE v_patente
        WHEN 'OURO' THEN 'OURO'::public.pp_class
        WHEN 'PRATA' THEN 'PRATA'::public.pp_class
        ELSE 'BRONZE'::public.pp_class
      END;

      IF p_skip_duplicates THEN
        SELECT id INTO v_pp_id FROM public.professionals WHERE email = v_email LIMIT 1;
        IF v_pp_id IS NOT NULL THEN
          UPDATE public.professionals SET
            full_name = trim(v_row->>'full_name'),
            cpf_cnpj = coalesce(v_document, cpf_cnpj),
            person_type = CASE WHEN v_document IS NULL THEN person_type ELSE v_person_type END,
            phone = coalesce(nullif(regexp_replace(coalesce(v_row->>'phone', ''), '\D', '', 'g'), ''), phone),
            address = coalesce(nullif(trim(v_row->>'address'), ''), address),
            pp_class = v_pp_class,
            patente = v_patente,
            asaas_wallet_id = coalesce(v_wallet_id, asaas_wallet_id),
            credentialing_status = coalesce(nullif(trim(v_row->>'credentialing_status'), ''), 'ativo')::public.credentialing_status,
            is_active = public.parse_import_boolean(v_row->>'is_active', is_active),
            points_grandfathered = public.parse_import_boolean(v_row->>'points_grandfathered', points_grandfathered)
          WHERE id = v_pp_id;

          IF coalesce(trim(v_row->>'crefito_number'), '') <> '' THEN
            INSERT INTO public.professional_councils (professional_id, council_type, registration_number)
            VALUES (v_pp_id, 'CREFITO', trim(v_row->>'crefito_number'))
            ON CONFLICT (professional_id, council_type) DO UPDATE
              SET registration_number = EXCLUDED.registration_number;
          END IF;

          v_created := v_created + 1;
          CONTINUE;
        END IF;
      END IF;

      INSERT INTO public.professionals (
        full_name, cpf_cnpj, person_type, email, phone, address, pp_class, patente,
        asaas_wallet_id, credentialing_status, is_active, points_grandfathered
      ) VALUES (
        trim(v_row->>'full_name'),
        v_document,
        v_person_type,
        v_email,
        nullif(regexp_replace(coalesce(v_row->>'phone', ''), '\D', '', 'g'), ''),
        nullif(trim(v_row->>'address'), ''),
        v_pp_class,
        v_patente,
        v_wallet_id,
        coalesce(nullif(trim(v_row->>'credentialing_status'), ''), 'ativo')::public.credentialing_status,
        public.parse_import_boolean(v_row->>'is_active', true),
        public.parse_import_boolean(v_row->>'points_grandfathered', true)
      ) RETURNING id INTO v_pp_id;

      IF coalesce(trim(v_row->>'crefito_number'), '') <> '' THEN
        INSERT INTO public.professional_councils (professional_id, council_type, registration_number)
        VALUES (v_pp_id, 'CREFITO', trim(v_row->>'crefito_number'))
        ON CONFLICT (professional_id, council_type) DO UPDATE SET registration_number = EXCLUDED.registration_number;
      END IF;

      v_contract_number := nullif(trim(v_row->>'contract_number'), '');
      IF v_contract_number IS NOT NULL THEN
        INSERT INTO public.contracts (professional_id, contract_number, status, signed_at)
        VALUES (v_pp_id, v_contract_number, 'assinado', now())
        ON CONFLICT (contract_number) DO NOTHING;
      END IF;

      v_created := v_created + 1;
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object('row', v_idx, 'message', SQLERRM, 'data', v_row);
    END;
  END LOOP;

  UPDATE public.bulk_import_runs
  SET created_count = v_created,
      error_count = jsonb_array_length(v_errors)
  WHERE id = v_run_id;

  RETURN jsonb_build_object('created', v_created, 'errors', v_errors, 'run_id', v_run_id);
END;
$$;
