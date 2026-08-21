-- LarsanaCare: adequação transcrição alinhamento 20/08/2026
-- Pagamento avaliação na solicitação, planos dinâmicos, CREFITO, confirmação sessão, limites PP

-- ===== enums =====
DO $$ BEGIN
  CREATE TYPE public.charge_kind AS ENUM (
    'cycle',
    'assessment_request',
    'assessment_fee'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.patient_gender AS ENUM ('FEMININO', 'MASCULINO', 'OUTRO', 'NAO_INFORMADO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.patient_marital_status AS ENUM (
    'SOLTEIRO', 'CASADO', 'DIVORCIADO', 'VIUVO', 'UNIAO_ESTAVEL', 'NAO_INFORMADO'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.cycle_payment_timing AS ENUM ('antecipado', 'pos_ciclo');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===== platform settings (admin editável) =====
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_fee_cents integer NOT NULL DEFAULT 15000 CHECK (assessment_fee_cents > 0),
  assessment_pp_share_cents integer NOT NULL DEFAULT 5000 CHECK (assessment_pp_share_cents >= 0),
  early_cycle_discount_pct numeric(5, 2) NOT NULL DEFAULT 0 CHECK (early_cycle_discount_pct >= 0 AND early_cycle_discount_pct <= 100),
  late_interest_pct_month numeric(5, 2) NOT NULL DEFAULT 0 CHECK (late_interest_pct_month >= 0),
  late_fine_pct numeric(5, 2) NOT NULL DEFAULT 0 CHECK (late_fine_pct >= 0),
  max_weekly_sessions_pp integer NOT NULL DEFAULT 40 CHECK (max_weekly_sessions_pp > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.platform_settings (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM public.platform_settings LIMIT 1);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS platform_settings_staff_read ON public.platform_settings;
CREATE POLICY platform_settings_staff_read ON public.platform_settings
  FOR SELECT TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS platform_settings_admin_write ON public.platform_settings;
CREATE POLICY platform_settings_admin_write ON public.platform_settings
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin']::public.user_role[]));

CREATE OR REPLACE FUNCTION public.get_platform_settings()
RETURNS public.platform_settings
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.platform_settings ORDER BY updated_at DESC LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_platform_settings() TO authenticated;

CREATE OR REPLACE FUNCTION public.update_platform_settings(
  p_assessment_fee_cents integer,
  p_assessment_pp_share_cents integer,
  p_early_cycle_discount_pct numeric,
  p_late_interest_pct_month numeric,
  p_late_fine_pct numeric,
  p_max_weekly_sessions_pp integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff_role(ARRAY['admin']::public.user_role[]) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  UPDATE public.platform_settings
  SET
    assessment_fee_cents = p_assessment_fee_cents,
    assessment_pp_share_cents = p_assessment_pp_share_cents,
    early_cycle_discount_pct = p_early_cycle_discount_pct,
    late_interest_pct_month = p_late_interest_pct_month,
    late_fine_pct = p_late_fine_pct,
    max_weekly_sessions_pp = p_max_weekly_sessions_pp,
    updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_platform_settings(integer, integer, numeric, numeric, numeric, integer) TO authenticated;

-- ===== patient CREFITO fields =====
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS birth_place text,
  ADD COLUMN IF NOT EXISTS marital_status public.patient_marital_status,
  ADD COLUMN IF NOT EXISTS gender public.patient_gender,
  ADD COLUMN IF NOT EXISTS occupation text,
  ADD COLUMN IF NOT EXISTS assessment_fee_paid_charge_id uuid REFERENCES public.charges (id) ON DELETE SET NULL;

ALTER TABLE public.initial_assessments
  ADD COLUMN IF NOT EXISTS patient_occupation text;

-- ===== charges extensions =====
ALTER TABLE public.charges
  ADD COLUMN IF NOT EXISTS charge_kind public.charge_kind NOT NULL DEFAULT 'cycle',
  ADD COLUMN IF NOT EXISTS demand_id uuid REFERENCES public.demands (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assessment_credit_cents integer NOT NULL DEFAULT 0 CHECK (assessment_credit_cents >= 0),
  ADD COLUMN IF NOT EXISTS payment_timing public.cycle_payment_timing;

CREATE INDEX IF NOT EXISTS idx_charges_demand ON public.charges (demand_id);
CREATE INDEX IF NOT EXISTS idx_charges_kind ON public.charges (charge_kind);

-- ===== session presence + check-in =====
ALTER TABLE public.care_sessions
  ADD COLUMN IF NOT EXISTS check_out_at timestamptz,
  ADD COLUMN IF NOT EXISTS presence_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS presence_confirmed_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS presence_reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS pp_unconfirmed_alert_sent_at timestamptz;

-- ===== helpers =====
CREATE OR REPLACE FUNCTION public.scale_session_count_for_frequency(
  p_proposed_sessions integer,
  p_proposed_frequency integer,
  p_chosen_frequency integer
)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_raw numeric;
  v_snapped integer;
BEGIN
  IF p_proposed_frequency IS NULL OR p_proposed_frequency < 1 THEN
    RETURN p_proposed_sessions;
  END IF;

  v_raw := p_proposed_sessions * (p_chosen_frequency::numeric / p_proposed_frequency::numeric);

  IF v_raw <= 5 THEN
    v_snapped := 4;
  ELSIF v_raw <= 10 THEN
    v_snapped := 8;
  ELSE
    v_snapped := 12;
  END IF;

  RETURN v_snapped;
END;
$$;

CREATE OR REPLACE FUNCTION public.proposal_frequency_options(p_proposed_frequency integer)
RETURNS integer[]
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_lo integer;
  v_hi integer;
BEGIN
  v_lo := GREATEST(1, COALESCE(p_proposed_frequency, 2) - 1);
  v_hi := LEAST(5, COALESCE(p_proposed_frequency, 2) + 1);
  RETURN ARRAY[v_lo, COALESCE(p_proposed_frequency, 2), v_hi];
END;
$$;

CREATE OR REPLACE FUNCTION public.patient_has_paid_assessment_fee(p_patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.charges c
    WHERE c.patient_id = p_patient_id
      AND c.charge_kind = 'assessment_request'
      AND c.payment_status = 'pago'
  );
$$;

-- ===== prepare service request (passos 1-2, sem demanda) =====
CREATE OR REPLACE FUNCTION public.patient_prepare_service_request(
  p_patient_full_name text,
  p_patient_cpf text,
  p_birth_date date,
  p_attendance_period public.patient_attendance_period,
  p_diagnostic_hypothesis text,
  p_referral_source public.patient_referral_source,
  p_responsible_full_name text DEFAULT NULL,
  p_responsible_cpf text DEFAULT NULL,
  p_birth_place text DEFAULT NULL,
  p_marital_status public.patient_marital_status DEFAULT NULL,
  p_gender public.patient_gender DEFAULT NULL,
  p_terms_accepted boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id uuid;
  v_patient public.patients%ROWTYPE;
  v_settings public.platform_settings%ROWTYPE;
  v_responsible_id uuid;
  v_age integer;
  v_cpf text;
  v_resp_cpf text;
BEGIN
  IF public.current_user_role() <> 'paciente'::public.user_role THEN
    RAISE EXCEPTION 'Apenas responsáveis/pacientes podem solicitar atendimento';
  END IF;

  IF COALESCE(p_terms_accepted, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'É necessário aceitar os termos para continuar';
  END IF;

  v_patient_id := public.current_patient_id_for_user();
  IF v_patient_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum paciente vinculado à sua conta';
  END IF;

  v_cpf := regexp_replace(COALESCE(p_patient_cpf, ''), '\D', '', 'g');
  IF length(v_cpf) <> 11 THEN
    RAISE EXCEPTION 'CPF do paciente inválido';
  END IF;

  IF p_birth_date IS NULL OR p_birth_date > current_date THEN
    RAISE EXCEPTION 'Data de nascimento inválida';
  END IF;

  v_age := date_part('year', age(current_date, p_birth_date))::integer;

  IF v_age < 18 THEN
    IF NULLIF(trim(p_responsible_full_name), '') IS NULL THEN
      RAISE EXCEPTION 'Informe o nome do responsável (obrigatório para menores de 18 anos)';
    END IF;
    v_resp_cpf := regexp_replace(COALESCE(p_responsible_cpf, ''), '\D', '', 'g');
    IF length(v_resp_cpf) <> 11 THEN
      RAISE EXCEPTION 'CPF do responsável inválido';
    END IF;
  ELSE
    v_resp_cpf := NULLIF(regexp_replace(COALESCE(p_responsible_cpf, ''), '\D', '', 'g'), '');
    IF v_resp_cpf IS NOT NULL AND length(v_resp_cpf) <> 11 THEN
      RAISE EXCEPTION 'CPF do responsável inválido';
    END IF;
  END IF;

  SELECT * INTO v_patient FROM public.patients WHERE id = v_patient_id;

  IF NOT public.region_has_patient_service(v_patient.region_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'no_coverage',
      'message', 'Ainda não estamos atendendo na sua região. Registramos seu interesse na lista de espera.',
      'can_checkout', false
    );
  END IF;

  UPDATE public.patients
  SET
    full_name = trim(p_patient_full_name),
    cpf = v_cpf,
    birth_date = p_birth_date,
    attendance_period = p_attendance_period,
    diagnostic_hypothesis = trim(p_diagnostic_hypothesis),
    referral_source = p_referral_source,
    birth_place = NULLIF(trim(p_birth_place), ''),
    marital_status = p_marital_status,
    gender = p_gender,
    is_data_complete = true,
    updated_at = now()
  WHERE id = v_patient_id;

  SELECT pr.id INTO v_responsible_id
  FROM public.patient_responsibles pr
  WHERE pr.patient_id = v_patient_id AND pr.user_id = auth.uid()
  LIMIT 1;

  IF v_responsible_id IS NOT NULL THEN
    UPDATE public.patient_responsibles
    SET
      full_name = COALESCE(NULLIF(trim(p_responsible_full_name), ''), full_name),
      cpf = COALESCE(v_resp_cpf, cpf),
      updated_at = now()
    WHERE id = v_responsible_id;
  END IF;

  INSERT INTO public.digital_acceptances (acceptor_role, acceptor_user_id, patient_id, term_id)
  SELECT 'paciente'::public.user_role, auth.uid(), v_patient_id, lt.id
  FROM public.legal_terms lt
  WHERE lt.is_current = true
    AND lt.term_type IN ('CONTRATO_INTERMEDIACAO', 'TERMO_CONSENTIMENTO', 'LGPD')
    AND NOT EXISTS (
      SELECT 1 FROM public.digital_acceptances da
      WHERE da.patient_id = v_patient_id AND da.term_id = lt.id
    );

  SELECT * INTO v_settings FROM public.get_platform_settings();

  RETURN jsonb_build_object(
    'success', true,
    'patient_id', v_patient_id,
    'can_checkout', true,
    'assessment_fee_cents', v_settings.assessment_fee_cents,
    'assessment_fee_message', 'Valor da avaliação domiciliar. Se você fechar o pacote de tratamento, este valor será descontado no primeiro ciclo.',
    'already_paid_assessment', public.patient_has_paid_assessment_fee(v_patient_id)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.patient_prepare_service_request(
  text, text, date, public.patient_attendance_period, text, public.patient_referral_source,
  text, text, text, public.patient_marital_status, public.patient_gender, boolean
) TO authenticated;

-- ===== create assessment request charge (passo 3) =====
CREATE OR REPLACE FUNCTION public.patient_create_assessment_request_charge(
  p_payment_method public.payment_method DEFAULT 'PIX'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id uuid;
  v_patient public.patients%ROWTYPE;
  v_settings public.platform_settings%ROWTYPE;
  v_existing_charge uuid;
  v_charge_id uuid;
BEGIN
  IF public.current_user_role() <> 'paciente'::public.user_role THEN
    RAISE EXCEPTION 'Apenas pacientes podem criar cobrança de avaliação';
  END IF;

  v_patient_id := public.current_patient_id_for_user();
  IF v_patient_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum paciente vinculado';
  END IF;

  SELECT * INTO v_patient FROM public.patients WHERE id = v_patient_id;

  IF NOT public.region_has_patient_service(v_patient.region_id) THEN
    RAISE EXCEPTION 'Região sem cobertura — não é possível pagar avaliação';
  END IF;

  IF public.patient_has_paid_assessment_fee(v_patient_id) THEN
    RETURN jsonb_build_object(
      'already_paid', true,
      'message', 'Taxa de avaliação já paga'
    );
  END IF;

  SELECT c.id INTO v_existing_charge
  FROM public.charges c
  WHERE c.patient_id = v_patient_id
    AND c.charge_kind = 'assessment_request'
    AND c.payment_status = 'pendente'
  ORDER BY c.created_at DESC
  LIMIT 1;

  IF v_existing_charge IS NOT NULL THEN
    RETURN jsonb_build_object('charge_id', v_existing_charge, 'already_exists', true);
  END IF;

  SELECT * INTO v_settings FROM public.get_platform_settings();

  INSERT INTO public.charges (
    patient_id,
    amount_cents,
    payment_method,
    payment_status,
    due_date,
    description,
    charge_kind
  ) VALUES (
    v_patient_id,
    v_settings.assessment_fee_cents,
    p_payment_method,
    'pendente',
    current_date,
    'Taxa de avaliação domiciliar Larsana Care',
    'assessment_request'
  )
  RETURNING id INTO v_charge_id;

  RETURN jsonb_build_object(
    'charge_id', v_charge_id,
    'amount_cents', v_settings.assessment_fee_cents,
    'already_exists', false
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.patient_create_assessment_request_charge(public.payment_method) TO authenticated;

-- ===== finalize demand after assessment payment =====
CREATE OR REPLACE FUNCTION public.patient_finalize_service_request_after_payment(p_charge_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_charge public.charges%ROWTYPE;
  v_patient public.patients%ROWTYPE;
  v_primary_address_id uuid;
  v_existing public.demands%ROWTYPE;
  v_new_id uuid;
BEGIN
  SELECT * INTO v_charge FROM public.charges WHERE id = p_charge_id FOR UPDATE;

  IF NOT FOUND OR v_charge.charge_kind <> 'assessment_request' THEN
    RAISE EXCEPTION 'Cobrança de avaliação inválida';
  END IF;

  IF v_charge.payment_status <> 'pago' THEN
    RAISE EXCEPTION 'Pagamento da avaliação ainda não confirmado';
  END IF;

  UPDATE public.patients
  SET assessment_fee_paid_charge_id = p_charge_id, updated_at = now()
  WHERE id = v_charge.patient_id;

  SELECT * INTO v_patient FROM public.patients WHERE id = v_charge.patient_id;

  SELECT pa.id INTO v_primary_address_id
  FROM public.patient_addresses pa
  WHERE pa.patient_id = v_charge.patient_id
  ORDER BY pa.is_primary DESC, pa.created_at ASC
  LIMIT 1;

  IF v_primary_address_id IS NULL THEN
    RAISE EXCEPTION 'Endereço do paciente não encontrado';
  END IF;

  SELECT * INTO v_existing
  FROM public.demands d
  WHERE d.patient_id = v_charge.patient_id
    AND d.status IN ('aberta', 'alocada')
  ORDER BY d.created_at DESC
  LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    UPDATE public.charges SET demand_id = v_existing.id WHERE id = p_charge_id;
    RETURN jsonb_build_object(
      'success', true,
      'demand_id', v_existing.id,
      'already_exists', true,
      'status', v_existing.status
    );
  END IF;

  INSERT INTO public.demands (patient_id, address_id, region_id, status, request_source)
  VALUES (v_charge.patient_id, v_primary_address_id, v_patient.region_id, 'aberta', 'paciente_app')
  RETURNING id INTO v_new_id;

  UPDATE public.charges SET demand_id = v_new_id WHERE id = p_charge_id;

  RETURN jsonb_build_object(
    'success', true,
    'demand_id', v_new_id,
    'already_exists', false,
    'status', 'aberta'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.patient_finalize_service_request_after_payment(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.patient_finalize_service_request_after_payment(uuid) TO service_role;

-- ===== update confirm_charge_payment =====
CREATE OR REPLACE FUNCTION public.confirm_charge_payment(p_charge_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_charge public.charges%ROWTYPE;
  v_cycle public.care_cycles%ROWTYPE;
  v_weekly_freq integer;
  v_days_between numeric;
  v_i integer;
  v_assessment_at timestamptz;
  v_sessions_before integer;
  v_sessions_after integer;
  v_patient_name text;
  v_finalize jsonb;
  v_pp_id uuid;
  v_settings public.platform_settings%ROWTYPE;
BEGIN
  SELECT * INTO v_charge FROM public.charges WHERE id = p_charge_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cobrança não encontrada';
  END IF;

  IF v_charge.payment_status = 'pago' THEN
    IF v_charge.charge_kind = 'assessment_request' THEN
      v_finalize := public.patient_finalize_service_request_after_payment(p_charge_id);
      RETURN v_finalize || jsonb_build_object('charge_id', p_charge_id, 'already_paid', true);
    END IF;

    SELECT count(*) INTO v_sessions_after FROM public.care_sessions WHERE cycle_id = v_charge.cycle_id;
    RETURN jsonb_build_object(
      'charge_id', p_charge_id,
      'cycle_id', v_charge.cycle_id,
      'already_paid', true,
      'sessions_count', v_sessions_after
    );
  END IF;

  IF v_charge.payment_status NOT IN ('pendente', 'vencido') THEN
    RAISE EXCEPTION 'Cobrança não pode ser confirmada no status atual';
  END IF;

  UPDATE public.charges
  SET payment_status = 'pago', paid_at = now(), updated_at = now()
  WHERE id = p_charge_id;

  IF v_charge.charge_kind = 'assessment_request' THEN
    v_finalize := public.patient_finalize_service_request_after_payment(p_charge_id);

    SELECT p.full_name INTO v_patient_name FROM public.patients p WHERE p.id = v_charge.patient_id;

    PERFORM public.notify_patient_responsibles(
      v_charge.patient_id,
      'geral'::public.notification_type,
      'Pagamento da avaliação confirmado',
      coalesce(v_patient_name, 'Paciente') || ': estamos procurando um profissional parceiro para sua avaliação.',
      jsonb_build_object('charge_id', p_charge_id, 'href', '/paciente/solicitar')
    );

    RETURN v_finalize || jsonb_build_object('charge_id', p_charge_id, 'already_paid', false);
  END IF;

  IF v_charge.cycle_id IS NOT NULL THEN
    SELECT * INTO v_cycle FROM public.care_cycles WHERE id = v_charge.cycle_id;

    UPDATE public.care_cycles
    SET status = 'ativo', payment_status = 'pago', updated_at = now()
    WHERE id = v_cycle.id;

    SELECT count(*) INTO v_sessions_before FROM public.care_sessions WHERE cycle_id = v_cycle.id;

    IF v_sessions_before = 0 THEN
      SELECT COALESCE(
        LEAST(5, GREATEST(1, ROUND(p.suggested_weekly_frequency)::integer)),
        2
      ) INTO v_weekly_freq
      FROM public.patients p WHERE p.id = v_cycle.patient_id;

      v_days_between := 7.0 / v_weekly_freq;

      SELECT ia.created_at INTO v_assessment_at
      FROM public.initial_assessments ia
      WHERE ia.patient_id = v_cycle.patient_id
      ORDER BY ia.created_at DESC LIMIT 1;

      FOR v_i IN 1..v_cycle.session_count LOOP
        INSERT INTO public.care_sessions (
          cycle_id, session_number, status, professional_id,
          is_assessment_session, scheduled_at
        ) VALUES (
          v_cycle.id, v_i,
          CASE WHEN v_i = 1 AND v_cycle.cycle_number = 1 THEN 'realizada'::public.session_status ELSE 'prevista'::public.session_status END,
          v_cycle.assigned_professional_id,
          v_i = 1 AND v_cycle.cycle_number = 1,
          CASE
            WHEN v_i = 1 AND v_cycle.cycle_number = 1 THEN COALESCE(v_assessment_at, now() - interval '7 days')
            ELSE now() + ((v_i - 1) * v_days_between) * interval '1 day'
          END
        );
      END LOOP;
    END IF;

    SELECT pr.full_name INTO v_patient_name FROM public.patients pr WHERE pr.id = v_cycle.patient_id;

    PERFORM public.notify_patient_responsibles(
      v_charge.patient_id, 'cobranca'::public.notification_type,
      'Pagamento confirmado',
      coalesce(v_patient_name, 'Paciente') || ': pagamento confirmado. Sessões liberadas.',
      jsonb_build_object('charge_id', p_charge_id, 'cycle_id', v_charge.cycle_id, 'href', '/paciente/pagamentos/' || p_charge_id::text)
    );

    IF v_cycle.assigned_professional_id IS NOT NULL THEN
      SELECT user_id INTO v_pp_id FROM public.professionals WHERE id = v_cycle.assigned_professional_id;
      IF v_pp_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, type, title, body, payload)
        VALUES (
          v_pp_id, 'geral', 'Agende o paciente',
          coalesce(v_patient_name, 'Paciente') || ' confirmou o tratamento. Organize a agenda conforme disponibilidade.',
          jsonb_build_object('patient_id', v_cycle.patient_id, 'cycle_id', v_cycle.id, 'href', '/profissional/agenda')
        );
      END IF;
    END IF;
  END IF;

  SELECT count(*) INTO v_sessions_after FROM public.care_sessions WHERE cycle_id = v_charge.cycle_id;

  RETURN jsonb_build_object(
    'charge_id', p_charge_id,
    'cycle_id', v_charge.cycle_id,
    'sessions_count', coalesce(v_sessions_after, 0),
    'already_paid', false
  );
END;
$$;

-- ===== proposal preview with dynamic options =====
CREATE OR REPLACE FUNCTION public.get_patient_proposal_preview(p_assessment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assessment public.initial_assessments%ROWTYPE;
  v_patient_name text;
  v_professional_name text;
  v_region_id uuid;
  v_settings public.platform_settings%ROWTYPE;
  v_options jsonb := '[]'::jsonb;
  v_freq integer;
  v_sessions integer;
  v_total integer;
  v_credit integer := 0;
BEGIN
  SELECT * INTO v_assessment FROM public.initial_assessments WHERE id = p_assessment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Avaliação não encontrada'; END IF;
  IF NOT (v_assessment.patient_id = ANY (public.current_patient_ids())) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;
  IF v_assessment.status NOT IN ('proposta_enviada', 'em_analise') OR v_assessment.family_response IS NOT NULL THEN
    RAISE EXCEPTION 'Não há proposta pendente';
  END IF;

  SELECT p.full_name, p.region_id INTO v_patient_name, v_region_id
  FROM public.patients p WHERE p.id = v_assessment.patient_id;

  SELECT pr.full_name INTO v_professional_name
  FROM public.professionals pr WHERE pr.id = v_assessment.evaluator_professional_id;

  SELECT * INTO v_settings FROM public.get_platform_settings();

  IF public.patient_has_paid_assessment_fee(v_assessment.patient_id) THEN
    v_credit := v_settings.assessment_fee_cents;
  END IF;

  FOREACH v_freq IN ARRAY public.proposal_frequency_options(v_assessment.proposed_weekly_frequency)
  LOOP
    v_sessions := public.scale_session_count_for_frequency(
      v_assessment.proposed_session_count,
      v_assessment.proposed_weekly_frequency,
      v_freq
    );
    v_total := public.compute_proposal_total_cents(v_region_id, v_assessment.proposed_patient_level, v_sessions);
    IF v_total IS NOT NULL THEN
      v_options := v_options || jsonb_build_object(
        'weekly_frequency', v_freq,
        'session_count', v_sessions,
        'total_amount_cents', GREATEST(0, v_total - v_credit),
        'gross_amount_cents', v_total,
        'assessment_credit_cents', v_credit,
        'is_recommended', v_freq = v_assessment.proposed_weekly_frequency
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'assessment_id', v_assessment.id,
    'patient_id', v_assessment.patient_id,
    'patient_name', v_patient_name,
    'professional_name', v_professional_name,
    'proposed_weekly_frequency', v_assessment.proposed_weekly_frequency,
    'proposed_session_count', v_assessment.proposed_session_count,
    'proposed_patient_level', v_assessment.proposed_patient_level,
    'proposal_sent_at', v_assessment.proposal_sent_at,
    'response_deadline_at', v_assessment.response_deadline_at,
    'status', v_assessment.status,
    'options', v_options,
    'early_cycle_discount_pct', v_settings.early_cycle_discount_pct
  );
END;
$$;

-- ===== accept proposal with credit + dynamic sessions =====
CREATE OR REPLACE FUNCTION public.accept_assessment_proposal(
  p_assessment_id uuid,
  p_response public.family_response,
  p_chosen_weekly_frequency integer DEFAULT NULL,
  p_payment_timing public.cycle_payment_timing DEFAULT 'antecipado'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assessment public.initial_assessments%ROWTYPE;
  v_patient public.patients%ROWTYPE;
  v_settings public.platform_settings%ROWTYPE;
  v_pricing_version_id uuid;
  v_unit_price integer;
  v_gross integer;
  v_total integer;
  v_credit integer := 0;
  v_discount integer := 0;
  v_session_count integer;
  v_cycle_id uuid;
  v_charge_id uuid;
  v_cycle_number integer;
  v_now timestamptz := now();
  v_due_date date;
BEGIN
  SELECT * INTO v_assessment FROM public.initial_assessments WHERE id = p_assessment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Avaliação não encontrada'; END IF;
  IF NOT (v_assessment.patient_id = ANY (public.current_patient_ids())) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;
  IF v_assessment.family_response IS NOT NULL THEN RAISE EXCEPTION 'Proposta já respondida'; END IF;
  IF v_assessment.status NOT IN ('proposta_enviada', 'em_analise') THEN
    RAISE EXCEPTION 'Proposta não aguarda resposta';
  END IF;

  SELECT * INTO v_settings FROM public.get_platform_settings();

  IF p_response = 'NAO' THEN
    UPDATE public.initial_assessments
    SET family_response = 'NAO', responded_at = v_now, responded_by_user_id = auth.uid(),
        status = 'respondida_nao', updated_at = v_now
    WHERE id = p_assessment_id;

    RETURN jsonb_build_object('assessment_id', p_assessment_id, 'family_response', 'NAO');
  END IF;

  IF p_chosen_weekly_frequency IS NULL THEN
    RAISE EXCEPTION 'Informe a frequência semanal escolhida';
  END IF;

  IF p_chosen_weekly_frequency NOT IN (SELECT unnest(public.proposal_frequency_options(v_assessment.proposed_weekly_frequency))) THEN
    RAISE EXCEPTION 'Frequência escolhida inválida para esta proposta';
  END IF;

  v_session_count := public.scale_session_count_for_frequency(
    v_assessment.proposed_session_count,
    v_assessment.proposed_weekly_frequency,
    p_chosen_weekly_frequency
  );

  SELECT * INTO v_patient FROM public.patients WHERE id = v_assessment.patient_id;

  v_gross := public.compute_proposal_total_cents(v_patient.region_id, v_assessment.proposed_patient_level, v_session_count);
  IF v_gross IS NULL THEN RAISE EXCEPTION 'Não foi possível calcular valor do ciclo'; END IF;

  IF public.patient_has_paid_assessment_fee(v_assessment.patient_id) THEN
    v_credit := v_settings.assessment_fee_cents;
  END IF;

  v_total := GREATEST(0, v_gross - v_credit);

  IF p_payment_timing = 'antecipado' AND v_settings.early_cycle_discount_pct > 0 THEN
    v_discount := ROUND(v_total * v_settings.early_cycle_discount_pct / 100.0)::integer;
    v_total := GREATEST(0, v_total - v_discount);
  END IF;

  SELECT id INTO v_pricing_version_id FROM public.pricing_matrix_versions WHERE is_active = true LIMIT 1;
  SELECT e.session_price_cents INTO v_unit_price
  FROM public.pricing_matrix_entries e
  WHERE e.version_id = v_pricing_version_id
    AND e.region_id = v_patient.region_id
    AND e.patient_level = v_assessment.proposed_patient_level
  LIMIT 1;

  UPDATE public.initial_assessments
  SET family_response = 'SIM', accepted_weekly_frequency = p_chosen_weekly_frequency,
      responded_at = v_now, responded_by_user_id = auth.uid(), status = 'respondida_sim', updated_at = v_now
  WHERE id = p_assessment_id;

  UPDATE public.patients
  SET suggested_weekly_frequency = p_chosen_weekly_frequency,
      patient_level = v_assessment.proposed_patient_level, updated_at = v_now
  WHERE id = v_assessment.patient_id;

  SELECT COALESCE(max(cycle_number), 0) + 1 INTO v_cycle_number
  FROM public.care_cycles WHERE patient_id = v_assessment.patient_id;

  INSERT INTO public.care_cycles (
    patient_id, cycle_number, session_count, assigned_professional_id,
    pricing_version_id, region_id, patient_level, session_unit_price_cents,
    total_amount_cents, status, payment_status
  ) VALUES (
    v_assessment.patient_id, v_cycle_number, v_session_count,
    v_assessment.evaluator_professional_id, v_pricing_version_id, v_patient.region_id,
    v_assessment.proposed_patient_level, v_unit_price, v_total,
    'aguardando_pagamento', 'pendente'
  ) RETURNING id INTO v_cycle_id;

  IF p_payment_timing = 'pos_ciclo' THEN
    v_due_date := (v_now + (v_session_count * interval '7 days') / GREATEST(1, p_chosen_weekly_frequency))::date;
    v_total := v_gross - v_credit;
    IF v_settings.late_fine_pct > 0 THEN
      v_total := v_total + ROUND(v_total * v_settings.late_fine_pct / 100.0)::integer;
    END IF;
  ELSE
    v_due_date := v_now::date;
  END IF;

  INSERT INTO public.charges (
    patient_id, cycle_id, assessment_id, amount_cents, payment_method,
    payment_status, due_date, description, charge_kind, assessment_credit_cents, payment_timing
  ) VALUES (
    v_assessment.patient_id, v_cycle_id, p_assessment_id, v_total, 'PIX', 'pendente',
    v_due_date,
    format('Pagamento ciclo %s — %s sessões (%sx/semana)', v_cycle_number, v_session_count, p_chosen_weekly_frequency),
    'cycle', v_credit, p_payment_timing
  ) RETURNING id INTO v_charge_id;

  RETURN jsonb_build_object(
    'assessment_id', p_assessment_id,
    'family_response', 'SIM',
    'cycle_id', v_cycle_id,
    'charge_id', v_charge_id,
    'session_count', v_session_count,
    'amount_cents', v_total,
    'assessment_credit_cents', v_credit,
    'early_discount_cents', v_discount
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_assessment_proposal(uuid, public.family_response, integer, public.cycle_payment_timing) TO authenticated;

-- ===== PP weekly session limit =====
CREATE OR REPLACE FUNCTION public.pp_weekly_scheduled_session_count(p_professional_id uuid, p_week_start date)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer
  FROM public.care_sessions cs
  JOIN public.care_cycles cc ON cc.id = cs.cycle_id
  WHERE cs.professional_id = p_professional_id
    AND cs.status NOT IN ('cancelada_sem_justificativa')
    AND cs.scheduled_at >= p_week_start::timestamptz
    AND cs.scheduled_at < (p_week_start + interval '7 days')::timestamptz;
$$;

CREATE OR REPLACE FUNCTION public.assert_pp_weekly_session_limit(p_professional_id uuid, p_scheduled_at timestamptz)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max integer;
  v_count integer;
  v_week_start date;
BEGIN
  SELECT max_weekly_sessions_pp INTO v_max FROM public.get_platform_settings();
  v_week_start := date_trunc('week', p_scheduled_at)::date;
  v_count := public.pp_weekly_scheduled_session_count(p_professional_id, v_week_start);

  IF v_count >= v_max THEN
    RAISE EXCEPTION 'Limite de % atendimentos por semana (CREFITO). Semana de % já possui % agendamentos.',
      v_max, to_char(v_week_start, 'DD/MM/YYYY'), v_count;
  END IF;
END;
$$;

-- ===== session check-in / check-out =====
CREATE OR REPLACE FUNCTION public.pp_session_check_in(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pp uuid := public.current_professional_id();
BEGIN
  IF v_pp IS NULL THEN RAISE EXCEPTION 'Profissional não identificado'; END IF;

  UPDATE public.care_sessions
  SET check_in_at = now()
  WHERE id = p_session_id AND professional_id = v_pp AND check_in_at IS NULL;

  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão não encontrada ou check-in já realizado'; END IF;

  RETURN jsonb_build_object('session_id', p_session_id, 'check_in_at', now());
END;
$$;

CREATE OR REPLACE FUNCTION public.pp_session_check_out(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pp uuid := public.current_professional_id();
BEGIN
  IF v_pp IS NULL THEN RAISE EXCEPTION 'Profissional não identificado'; END IF;

  UPDATE public.care_sessions
  SET check_out_at = now()
  WHERE id = p_session_id AND professional_id = v_pp AND check_in_at IS NOT NULL AND check_out_at IS NULL;

  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão não encontrada ou checkout indisponível'; END IF;

  RETURN jsonb_build_object('session_id', p_session_id, 'check_out_at', now());
END;
$$;

GRANT EXECUTE ON FUNCTION public.pp_session_check_in(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pp_session_check_out(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pp_weekly_scheduled_session_count(uuid, date) TO authenticated;

-- ===== patient confirm presence =====
CREATE OR REPLACE FUNCTION public.patient_confirm_session_presence(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.care_sessions%ROWTYPE;
BEGIN
  SELECT cs.* INTO v_session
  FROM public.care_sessions cs
  JOIN public.care_cycles cc ON cc.id = cs.cycle_id
  WHERE cs.id = p_session_id
    AND cc.patient_id = ANY (public.current_patient_ids());

  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão não encontrada'; END IF;

  UPDATE public.care_sessions
  SET presence_confirmed_at = now(), presence_confirmed_by = auth.uid()
  WHERE id = p_session_id;

  RETURN jsonb_build_object('session_id', p_session_id, 'confirmed', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.patient_confirm_session_presence(uuid) TO authenticated;

-- ===== presence reminders (12h) — callable by cron =====
CREATE OR REPLACE FUNCTION public.process_session_presence_reminders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row record;
  v_count integer := 0;
BEGIN
  FOR v_row IN
    SELECT cs.id, cs.scheduled_at, cc.patient_id, cs.professional_id, p.full_name AS patient_name
    FROM public.care_sessions cs
    JOIN public.care_cycles cc ON cc.id = cs.cycle_id
    JOIN public.patients p ON p.id = cc.patient_id
    WHERE cs.status = 'prevista'
      AND cs.scheduled_at BETWEEN now() + interval '11 hours' AND now() + interval '13 hours'
      AND cs.presence_confirmed_at IS NULL
      AND cs.presence_reminder_sent_at IS NULL
  LOOP
    PERFORM public.notify_patient_responsibles(
      v_row.patient_id, 'geral', 'Confirme sua sessão',
      'Você tem fisioterapia agendada. Confirme sua presença no aplicativo.',
      jsonb_build_object('session_id', v_row.id, 'href', '/paciente/tratamento')
    );
    UPDATE public.care_sessions SET presence_reminder_sent_at = now() WHERE id = v_row.id;
    v_count := v_count + 1;
  END LOOP;

  FOR v_row IN
    SELECT cs.id, pr.user_id AS pp_user_id, p.full_name AS patient_name
    FROM public.care_sessions cs
    JOIN public.care_cycles cc ON cc.id = cs.cycle_id
    JOIN public.patients p ON p.id = cc.patient_id
    JOIN public.professionals pr ON pr.id = cs.professional_id
    WHERE cs.status = 'prevista'
      AND cs.scheduled_at BETWEEN now() AND now() + interval '12 hours'
      AND cs.presence_confirmed_at IS NULL
      AND cs.pp_unconfirmed_alert_sent_at IS NULL
      AND pr.user_id IS NOT NULL
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, payload)
    VALUES (
      v_row.pp_user_id, 'geral', 'Paciente ainda não confirmou',
      v_row.patient_name || ' ainda não confirmou presença. Verifique com o paciente (WhatsApp).',
      jsonb_build_object('session_id', v_row.id, 'href', '/profissional/agenda')
    );
    UPDATE public.care_sessions SET pp_unconfirmed_alert_sent_at = now() WHERE id = v_row.id;
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.process_session_presence_reminders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_session_presence_reminders() TO service_role;

-- ===== bulk import contract_number =====
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
  v_wallet_id text;
  v_contract_number text;
BEGIN
  IF NOT public.is_staff() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
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

      v_wallet_id := nullif(trim(v_row->>'asaas_wallet_id'), '');
      v_patente := coalesce(nullif(trim(v_row->>'patente'), ''), 'BRONZE')::public.pp_patente;
      v_pp_class := CASE v_patente WHEN 'OURO' THEN 'OURO'::public.pp_class WHEN 'PRATA' THEN 'PRATA'::public.pp_class ELSE 'BRONZE'::public.pp_class END;

      INSERT INTO public.professionals (
        full_name, cpf_cnpj, email, phone, address, pp_class, patente,
        asaas_wallet_id, credentialing_status, is_active, points_grandfathered
      ) VALUES (
        trim(v_row->>'full_name'), nullif(trim(v_row->>'cpf_cnpj'), ''),
        lower(trim(v_row->>'email')), nullif(trim(v_row->>'phone'), ''),
        nullif(trim(v_row->>'address'), ''), v_pp_class, v_patente,
        v_wallet_id,
        coalesce(nullif(trim(v_row->>'credentialing_status'), ''), 'ativo')::public.credentialing_status,
        coalesce((v_row->>'is_active')::boolean, true),
        coalesce((v_row->>'points_grandfathered')::boolean, true)
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

  RETURN jsonb_build_object('created', v_created, 'errors', v_errors);
END;
$$;

-- ===== legacy submit still works but delegates to prepare + requires paid assessment =====
CREATE OR REPLACE FUNCTION public.patient_submit_service_request(
  p_patient_full_name text,
  p_patient_cpf text,
  p_birth_date date,
  p_attendance_period public.patient_attendance_period,
  p_diagnostic_hypothesis text,
  p_referral_source public.patient_referral_source,
  p_responsible_full_name text DEFAULT NULL,
  p_responsible_cpf text DEFAULT NULL,
  p_terms_accepted boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id uuid;
  v_prep jsonb;
BEGIN
  v_prep := public.patient_prepare_service_request(
    p_patient_full_name, p_patient_cpf, p_birth_date, p_attendance_period,
    p_diagnostic_hypothesis, p_referral_source, p_responsible_full_name, p_responsible_cpf,
    NULL, NULL, NULL, p_terms_accepted
  );

  IF NOT (v_prep->>'success')::boolean THEN
    RETURN v_prep;
  END IF;

  v_patient_id := (v_prep->>'patient_id')::uuid;

  IF public.patient_has_paid_assessment_fee(v_patient_id) THEN
    RETURN public.patient_finalize_service_request_after_payment(
      (SELECT c.id FROM public.charges c
       WHERE c.patient_id = v_patient_id AND c.charge_kind = 'assessment_request' AND c.payment_status = 'pago'
       ORDER BY c.paid_at DESC NULLS LAST LIMIT 1)
    );
  END IF;

  RETURN jsonb_build_object(
    'success', false,
    'reason', 'payment_required',
    'message', 'É necessário pagar a taxa de avaliação antes de abrir a demanda.',
    'assessment_fee_cents', v_prep->'assessment_fee_cents'
  );
END;
$$;
