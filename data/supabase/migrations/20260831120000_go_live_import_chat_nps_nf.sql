-- go_live_import_chat_nps_nf

CREATE TABLE IF NOT EXISTS public.bulk_import_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_kind text NOT NULL CHECK (import_kind IN ('patients', 'professionals')),
  started_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  row_count integer NOT NULL DEFAULT 0,
  created_count integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bulk_import_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY bulk_import_runs_staff ON public.bulk_import_runs
  FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE OR REPLACE FUNCTION public.normalize_cpf(p_value text)
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

  RETURN left(v_digits, 11);
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_region_code(p_value text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_raw text := upper(trim(coalesce(p_value, '')));
BEGIN
  IF v_raw = '' THEN RETURN NULL; END IF;
  IF v_raw ~ '^[ABC]$' THEN RETURN v_raw; END IF;
  IF v_raw ~ 'REGI[ÃA]O\s*([ABC])' THEN
    RETURN (regexp_match(v_raw, 'REGI[ÃA]O\s*([ABC])'))[1];
  END IF;
  RETURN v_raw;
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_patient_level(p_value text)
RETURNS public.patient_level
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_raw text := upper(trim(coalesce(p_value, '')));
  v_num text;
BEGIN
  IF v_raw = '' OR v_raw IN ('N1', 'N2', 'N3') THEN
    RETURN coalesce(nullif(v_raw, ''), 'N1')::public.patient_level;
  END IF;

  v_num := (regexp_match(v_raw, 'N[ÍI]VEL\s*(\d)'))[1];
  IF v_num IS NOT NULL THEN
    RETURN ('N' || v_num)::public.patient_level;
  END IF;

  RETURN v_raw::public.patient_level;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'N1'::public.patient_level;
END;
$$;

CREATE OR REPLACE FUNCTION public.parse_excel_date(p_value text)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_raw text := trim(coalesce(p_value, ''));
  v_serial numeric;
BEGIN
  IF v_raw = '' THEN RETURN NULL; END IF;

  IF v_raw ~ '^\d{4}-\d{2}-\d{2}' THEN
    RETURN left(v_raw, 10)::date;
  END IF;

  IF v_raw ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN
    RETURN to_date(v_raw, 'DD/MM/YYYY');
  END IF;

  IF v_raw ~ '^\d+(\.\d+)?$' THEN
    v_serial := v_raw::numeric;
    IF v_serial > 1000 THEN
      RETURN (timestamp '1899-12-30' + (v_serial * interval '1 day'))::date;
    END IF;
  END IF;

  RETURN v_raw::date;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.parse_import_boolean(p_value text, p_default boolean DEFAULT true)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_raw text := lower(trim(coalesce(p_value, '')));
BEGIN
  IF v_raw = '' THEN RETURN p_default; END IF;
  IF v_raw IN ('1', 'true', 'sim', 's', 'yes', 'y') THEN RETURN true; END IF;
  IF v_raw IN ('0', 'false', 'nao', 'não', 'n', 'no') THEN RETURN false; END IF;
  RETURN p_default;
END;
$$;

CREATE OR REPLACE FUNCTION public.bulk_import_patients(
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
  v_patient_id uuid;
  v_region_id uuid;
  v_city_id uuid;
  v_run_id uuid;
  v_cpf text;
  v_clinical text;
  v_asaas text;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN
    RAISE EXCEPTION 'p_rows deve ser um array JSON';
  END IF;

  INSERT INTO public.bulk_import_runs (import_kind, started_by, row_count)
  VALUES ('patients', auth.uid(), jsonb_array_length(p_rows))
  RETURNING id INTO v_run_id;

  FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows)
  LOOP
    v_idx := v_idx + 1;
    BEGIN
      IF coalesce(trim(v_row->>'full_name'), '') = '' THEN
        RAISE EXCEPTION 'full_name obrigatório';
      END IF;

      v_cpf := public.normalize_cpf(v_row->>'cpf');
      v_asaas := nullif(trim(v_row->>'asaas_customer_id'), '');
      v_clinical := nullif(trim(v_row->>'clinical_summary'), '');

      IF v_asaas IS NOT NULL AND length(v_asaas) > 50 AND v_clinical IS NULL THEN
        v_clinical := v_asaas;
        v_asaas := NULL;
      END IF;

      v_region_id := NULL;
      v_city_id := NULL;

      IF coalesce(trim(v_row->>'region_code'), '') <> '' THEN
        SELECT id INTO v_region_id
        FROM public.regions
        WHERE code = public.normalize_region_code(v_row->>'region_code')
        LIMIT 1;
      END IF;

      IF coalesce(trim(v_row->>'city_name'), '') <> '' THEN
        SELECT c.id INTO v_city_id
        FROM public.cities c
        WHERE lower(c.name) = lower(trim(v_row->>'city_name'))
        LIMIT 1;
      END IF;

      IF p_skip_duplicates AND v_cpf IS NOT NULL THEN
        SELECT id INTO v_patient_id FROM public.patients WHERE cpf = v_cpf LIMIT 1;
        IF v_patient_id IS NOT NULL THEN
          UPDATE public.patients SET
            full_name = trim(v_row->>'full_name'),
            birth_date = coalesce(public.parse_excel_date(v_row->>'birth_date'), birth_date),
            patient_level = public.normalize_patient_level(v_row->>'patient_level'),
            region_id = coalesce(v_region_id, region_id),
            city_id = coalesce(v_city_id, city_id),
            asaas_customer_id = coalesce(v_asaas, asaas_customer_id),
            clinical_summary = coalesce(v_clinical, clinical_summary),
            is_data_complete = true
          WHERE id = v_patient_id;

          IF coalesce(trim(v_row->>'full_address'), '') <> '' THEN
            IF NOT EXISTS (
              SELECT 1 FROM public.patient_addresses pa
              WHERE pa.patient_id = v_patient_id AND pa.is_primary = true
            ) THEN
              INSERT INTO public.patient_addresses (patient_id, full_address, is_primary)
              VALUES (v_patient_id, trim(v_row->>'full_address'), true);
            END IF;
          END IF;

          v_created := v_created + 1;
          CONTINUE;
        END IF;
      END IF;

      INSERT INTO public.patients (
        full_name, cpf, birth_date, patient_level, region_id, city_id,
        asaas_customer_id, clinical_summary, is_data_complete
      ) VALUES (
        trim(v_row->>'full_name'),
        v_cpf,
        public.parse_excel_date(v_row->>'birth_date'),
        public.normalize_patient_level(v_row->>'patient_level'),
        v_region_id,
        v_city_id,
        v_asaas,
        v_clinical,
        true
      )
      RETURNING id INTO v_patient_id;

      IF coalesce(trim(v_row->>'full_address'), '') <> '' THEN
        INSERT INTO public.patient_addresses (patient_id, full_address, is_primary)
        VALUES (v_patient_id, trim(v_row->>'full_address'), true);
      END IF;

      v_created := v_created + 1;
    EXCEPTION
      WHEN OTHERS THEN
        v_errors := v_errors || jsonb_build_object(
          'row', v_idx,
          'message', SQLERRM,
          'data', v_row
        );
    END;
  END LOOP;

  UPDATE public.bulk_import_runs
  SET created_count = v_created,
      error_count = jsonb_array_length(v_errors)
  WHERE id = v_run_id;

  RETURN jsonb_build_object('created', v_created, 'errors', v_errors, 'run_id', v_run_id);
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
      v_wallet_id := nullif(trim(v_row->>'asaas_wallet_id'), '');
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
            cpf_cnpj = coalesce(public.normalize_cpf(v_row->>'cpf_cnpj'), cpf_cnpj),
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
        full_name, cpf_cnpj, email, phone, address, pp_class, patente,
        asaas_wallet_id, credentialing_status, is_active, points_grandfathered
      ) VALUES (
        trim(v_row->>'full_name'),
        public.normalize_cpf(v_row->>'cpf_cnpj'),
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

-- NPS rolling 100
CREATE OR REPLACE FUNCTION public.pp_nps_score(p_professional_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ROUND(AVG(n.score)::numeric, 1)
  FROM (
    SELECT score
    FROM public.nps_surveys
    WHERE rated_entity_type = 'professional'
      AND rated_entity_id = p_professional_id
      AND rater_type = 'paciente'
    ORDER BY submitted_at DESC
    LIMIT 100
  ) n;
$$;

GRANT EXECUTE ON FUNCTION public.pp_nps_score(uuid) TO authenticated;

-- Chat Sara MVP
CREATE TABLE IF NOT EXISTS public.patient_chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (patient_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.patient_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.patient_chat_threads (id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('sara', 'paciente', 'sistema')),
  template_code text,
  body text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patient_chat_messages_thread ON public.patient_chat_messages (thread_id, created_at);

ALTER TABLE public.patient_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY patient_chat_threads_access ON public.patient_chat_threads
  FOR ALL
  USING (user_id = auth.uid() OR public.is_staff())
  WITH CHECK (user_id = auth.uid() OR public.is_staff());

CREATE POLICY patient_chat_messages_access ON public.patient_chat_messages
  FOR ALL
  USING (
    thread_id IN (
      SELECT t.id FROM public.patient_chat_threads t
      WHERE t.user_id = auth.uid() OR public.is_staff()
    )
  )
  WITH CHECK (
    thread_id IN (
      SELECT t.id FROM public.patient_chat_threads t
      WHERE t.user_id = auth.uid() OR public.is_staff()
    )
  );

CREATE OR REPLACE FUNCTION public.patient_get_or_create_chat_thread()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id uuid;
  v_thread_id uuid;
BEGIN
  v_patient_id := public.current_patient_id_for_user();
  IF v_patient_id IS NULL THEN
    RAISE EXCEPTION 'Paciente não vinculado';
  END IF;

  SELECT id INTO v_thread_id
  FROM public.patient_chat_threads
  WHERE patient_id = v_patient_id AND user_id = auth.uid();

  IF v_thread_id IS NULL THEN
    INSERT INTO public.patient_chat_threads (patient_id, user_id)
    VALUES (v_patient_id, auth.uid())
    RETURNING id INTO v_thread_id;

    INSERT INTO public.patient_chat_messages (thread_id, sender_role, template_code, body)
    VALUES (
      v_thread_id,
      'sara',
      'welcome',
      'Oi! Meu nome é Sara. Sou assistente da Larsana e estou aqui para te ajudar com confirmações de horário, lembretes e orientações sobre seu tratamento.'
    );
  END IF;

  RETURN v_thread_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.patient_post_chat_message(
  p_thread_id uuid,
  p_body text,
  p_template_code text DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_message_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.patient_chat_threads t
    WHERE t.id = p_thread_id AND t.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Thread não encontrada';
  END IF;

  INSERT INTO public.patient_chat_messages (thread_id, sender_role, template_code, body, payload)
  VALUES (p_thread_id, 'paciente', p_template_code, trim(p_body), coalesce(p_payload, '{}'::jsonb))
  RETURNING id INTO v_message_id;

  UPDATE public.patient_chat_threads SET updated_at = now() WHERE id = p_thread_id;
  RETURN v_message_id;
END;
$$;

-- Admin upload NF intermediação
CREATE OR REPLACE FUNCTION public.admin_upload_patient_receipt(
  p_charge_id uuid,
  p_storage_path text,
  p_receipt_kind public.patient_receipt_kind DEFAULT 'intermediacao'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_charge public.charges%ROWTYPE;
  v_receipt_id uuid;
BEGIN
  IF NOT public.is_staff_role(ARRAY['admin', 'financeiro']::public.user_role[]) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT * INTO v_charge FROM public.charges WHERE id = p_charge_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cobrança não encontrada'; END IF;

  INSERT INTO public.patient_receipts (
    charge_id, patient_id, cycle_id, receipt_kind, storage_path, issued_at
  ) VALUES (
    p_charge_id,
    v_charge.patient_id,
    v_charge.cycle_id,
    p_receipt_kind,
    p_storage_path,
    now()
  )
  RETURNING id INTO v_receipt_id;

  RETURN v_receipt_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.bulk_import_patients(jsonb, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_import_professionals(jsonb, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.patient_get_or_create_chat_thread() TO authenticated;
GRANT EXECUTE ON FUNCTION public.patient_post_chat_message(uuid, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upload_patient_receipt(uuid, text, public.patient_receipt_kind) TO authenticated;
