-- Passo 2 da solicitação aceita TCLE e privacidade.
-- O contrato de intermediação já foi aceito no início do cadastro.

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

  v_patient_id := public.reconcile_patient_by_cpf_for_user(v_patient_id, v_cpf);

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
    AND lt.term_type IN ('TCLE_FISIO', 'LGPD')
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

UPDATE public.legal_terms
SET
  content = regexp_replace(
    regexp_replace(content, '-1424394986', '', 'g'),
    '(^|\n)\s*47626251175\s*(\n|$)',
    E'\n',
    'g'
  ),
  title = CASE
    WHEN term_type = 'TCLE_FISIO' AND is_current THEN 'Termo de Consentimento Livre e Esclarecido (TCLE)'
    ELSE title
  END
WHERE content LIKE '%-1424394986%'
   OR content LIKE '%47626251175%'
   OR (term_type = 'TCLE_FISIO' AND is_current);
