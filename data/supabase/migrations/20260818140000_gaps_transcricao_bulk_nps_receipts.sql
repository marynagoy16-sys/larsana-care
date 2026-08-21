-- Gaps transcrição 17/08: Alumínio 60%, prazo evolução 7d, importação, NPS pós-sessão, NF dupla

-- Alumínio repasse 60%
UPDATE public.pp_patente_tiers
SET base_pp_percent = 60
WHERE patente = 'ALUMINIO';

-- Período indiferente no formulário de solicitação
ALTER TYPE public.patient_attendance_period ADD VALUE IF NOT EXISTS 'INDIFERENTE';

-- Prazo evolução clínica: 7 dias (alertas operacionais)
CREATE OR REPLACE FUNCTION public.check_prontuario_24h()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  v_session record;
BEGIN
  FOR v_session IN
    SELECT s.id, s.cycle_id, s.professional_id, c.patient_id
    FROM public.care_sessions s
    JOIN public.care_cycles c ON c.id = s.cycle_id
    WHERE s.status = 'realizada'
      AND COALESCE(s.check_out_at, s.updated_at) < now() - interval '7 days'
      AND NOT EXISTS (
        SELECT 1 FROM public.medical_records mr WHERE mr.session_id = s.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.operational_alerts oa
        WHERE oa.entity_type = 'care_session'
          AND oa.entity_id = s.id
          AND oa.alert_type = 'prontuario_incompleto_24h'
          AND oa.resolved_at IS NULL
      )
  LOOP
    INSERT INTO public.operational_alerts (
      alert_type, entity_type, entity_id, severity, title, message
    ) VALUES (
      'prontuario_incompleto_24h',
      'care_session',
      v_session.id,
      'critical',
      'Prontuário incompleto',
      'Sessão realizada sem evolução registrada em 7 dias'
    );
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.check_prontuario_24h IS
  'Executar via pg_cron ou Edge Function diariamente. Prazo de evolução: 7 dias.';

-- NPS por sessão
ALTER TABLE public.nps_surveys
  ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.care_sessions (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_nps_session ON public.nps_surveys (session_id)
  WHERE session_id IS NOT NULL;

ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'nps_sessao';

-- NF dupla (intermediação + prestação PP)
DO $$
BEGIN
  CREATE TYPE public.patient_receipt_kind AS ENUM ('intermediacao', 'pp_prestacao');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.patient_receipts
  ADD COLUMN IF NOT EXISTS receipt_kind public.patient_receipt_kind;

-- Notificar paciente para NPS após sessão realizada
CREATE OR REPLACE FUNCTION public.notify_patient_nps_after_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle public.care_cycles%ROWTYPE;
  v_user_id uuid;
BEGIN
  IF TG_OP <> 'UPDATE' OR NEW.status IS DISTINCT FROM 'realizada' OR OLD.status = 'realizada' THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = NEW.cycle_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  SELECT pr.user_id INTO v_user_id
  FROM public.patient_responsibles pr
  WHERE pr.patient_id = v_cycle.patient_id
    AND pr.user_id IS NOT NULL
  ORDER BY pr.is_primary DESC, pr.created_at ASC
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.nps_surveys ns
    WHERE ns.session_id = NEW.id AND ns.rater_type = 'paciente'
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, payload)
  VALUES (
    v_user_id,
    'nps_sessao',
    'Como foi a visita?',
    'Avalie a experiência da terapia domiciliar de hoje.',
    jsonb_build_object(
      'cycle_id', NEW.cycle_id,
      'session_id', NEW.id,
      'professional_id', NEW.professional_id,
      'href', '/paciente/nps/' || NEW.cycle_id::text || '?session=' || NEW.id::text
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_patient_nps_after_session ON public.care_sessions;
CREATE TRIGGER trg_notify_patient_nps_after_session
  AFTER UPDATE OF status ON public.care_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_patient_nps_after_session();

-- Importação em lote — pacientes legados
CREATE OR REPLACE FUNCTION public.bulk_import_patients(p_rows jsonb)
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
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN
    RAISE EXCEPTION 'p_rows deve ser um array JSON';
  END IF;

  FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows)
  LOOP
    v_idx := v_idx + 1;
    BEGIN
      IF coalesce(trim(v_row->>'full_name'), '') = '' THEN
        RAISE EXCEPTION 'full_name obrigatório';
      END IF;

      v_region_id := NULL;
      v_city_id := NULL;

      IF coalesce(trim(v_row->>'region_code'), '') <> '' THEN
        SELECT id INTO v_region_id FROM public.regions WHERE code = upper(trim(v_row->>'region_code')) LIMIT 1;
      END IF;

      IF coalesce(trim(v_row->>'city_name'), '') <> '' THEN
        SELECT c.id INTO v_city_id
        FROM public.cities c
        WHERE lower(c.name) = lower(trim(v_row->>'city_name'))
        LIMIT 1;
      END IF;

      INSERT INTO public.patients (
        full_name,
        cpf,
        birth_date,
        patient_level,
        region_id,
        city_id,
        asaas_customer_id,
        clinical_summary,
        is_data_complete
      ) VALUES (
        trim(v_row->>'full_name'),
        nullif(trim(v_row->>'cpf'), ''),
        nullif(v_row->>'birth_date', '')::date,
        coalesce(nullif(trim(v_row->>'patient_level'), ''), 'N1')::public.patient_level,
        v_region_id,
        v_city_id,
        nullif(trim(v_row->>'asaas_customer_id'), ''),
        nullif(trim(v_row->>'clinical_summary'), ''),
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

  RETURN jsonb_build_object('created', v_created, 'errors', v_errors);
END;
$$;

-- Importação em lote — profissionais legados (patente Bronze default)
CREATE OR REPLACE FUNCTION public.bulk_import_professionals(p_rows jsonb)
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
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN
    RAISE EXCEPTION 'p_rows deve ser um array JSON';
  END IF;

  FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows)
  LOOP
    v_idx := v_idx + 1;
    BEGIN
      IF coalesce(trim(v_row->>'full_name'), '') = '' OR coalesce(trim(v_row->>'email'), '') = '' THEN
        RAISE EXCEPTION 'full_name e email obrigatórios';
      END IF;

      v_patente := coalesce(nullif(trim(v_row->>'patente'), ''), 'BRONZE')::public.pp_patente;
      v_pp_class := CASE v_patente
        WHEN 'OURO' THEN 'OURO'::public.pp_class
        WHEN 'PRATA' THEN 'PRATA'::public.pp_class
        ELSE 'BRONZE'::public.pp_class
      END;

      INSERT INTO public.professionals (
        full_name,
        cpf_cnpj,
        email,
        phone,
        address,
        pp_class,
        patente,
        asaas_wallet_id,
        credentialing_status,
        is_active,
        points_grandfathered
      ) VALUES (
        trim(v_row->>'full_name'),
        nullif(trim(v_row->>'cpf_cnpj'), ''),
        lower(trim(v_row->>'email')),
        nullif(trim(v_row->>'phone'), ''),
        nullif(trim(v_row->>'address'), ''),
        v_pp_class,
        v_patente,
        nullif(trim(v_row->>'asaas_wallet_id'), ''),
        coalesce(nullif(trim(v_row->>'credentialing_status'), ''), 'ativo')::public.credentialing_status,
        coalesce((v_row->>'is_active')::boolean, true),
        coalesce((v_row->>'points_grandfathered')::boolean, true)
      )
      RETURNING id INTO v_pp_id;

      IF coalesce(trim(v_row->>'crefito_number'), '') <> '' THEN
        INSERT INTO public.professional_councils (professional_id, council_type, registration_number)
        VALUES (v_pp_id, 'CREFITO', trim(v_row->>'crefito_number'))
        ON CONFLICT (professional_id, council_type) DO UPDATE
          SET registration_number = EXCLUDED.registration_number;
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

  RETURN jsonb_build_object('created', v_created, 'errors', v_errors);
END;
$$;

GRANT EXECUTE ON FUNCTION public.bulk_import_patients(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_import_professionals(jsonb) TO authenticated;
