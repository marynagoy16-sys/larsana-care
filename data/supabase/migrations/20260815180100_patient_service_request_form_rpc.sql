-- Formulário de solicitação do paciente: termos legais e RPC

INSERT INTO public.legal_terms (term_type, version, title, content, is_current) VALUES
  (
    'CONTRATO_INTERMEDIACAO',
    '1.0',
    'Contrato de Intermediação',
    'Contrato de intermediação da plataforma Larsana Care entre paciente/responsável e profissionais parceiros autônomos.',
    true
  ),
  (
    'TERMO_CONSENTIMENTO',
    '1.0',
    'Termo de Consentimento',
    'Termo de consentimento para tratamento de dados e condições de uso dos serviços de saúde domiciliar intermediados pela Larsana Care.',
    true
  )
ON CONFLICT (term_type, version) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  is_current = EXCLUDED.is_current;

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
  v_patient public.patients%ROWTYPE;
  v_primary_address_id uuid;
  v_existing public.demands%ROWTYPE;
  v_new_id uuid;
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

  IF NULLIF(trim(p_patient_full_name), '') IS NULL THEN
    RAISE EXCEPTION 'Informe o nome do paciente';
  END IF;

  v_cpf := regexp_replace(COALESCE(p_patient_cpf, ''), '\D', '', 'g');
  IF length(v_cpf) <> 11 THEN
    RAISE EXCEPTION 'CPF do paciente inválido';
  END IF;

  IF p_birth_date IS NULL OR p_birth_date > current_date THEN
    RAISE EXCEPTION 'Data de nascimento inválida';
  END IF;

  IF p_attendance_period IS NULL THEN
    RAISE EXCEPTION 'Informe o melhor período para atendimento';
  END IF;

  IF NULLIF(trim(p_diagnostic_hypothesis), '') IS NULL THEN
    RAISE EXCEPTION 'Informe a hipótese diagnóstica';
  END IF;

  IF p_referral_source IS NULL THEN
    RAISE EXCEPTION 'Informe como nos conheceu';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.cpf = v_cpf AND p.id <> v_patient_id
  ) THEN
    RAISE EXCEPTION 'CPF do paciente já cadastrado';
  END IF;

  v_age := date_part('year', age(current_date, p_birth_date))::integer;

  IF v_age < 18 OR v_age >= 60 THEN
    IF NULLIF(trim(p_responsible_full_name), '') IS NULL THEN
      RAISE EXCEPTION 'Informe o nome do responsável';
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

  SELECT pa.id INTO v_primary_address_id
  FROM public.patient_addresses pa
  WHERE pa.patient_id = v_patient_id
  ORDER BY pa.is_primary DESC, pa.created_at ASC
  LIMIT 1;

  IF v_primary_address_id IS NULL THEN
    RAISE EXCEPTION 'Complete seu endereço antes de solicitar atendimento';
  END IF;

  SELECT * INTO v_patient FROM public.patients WHERE id = v_patient_id;

  IF NOT public.region_has_patient_service(v_patient.region_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'no_coverage',
      'message', 'Ainda não estamos atendendo na sua região.'
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
    is_data_complete = true,
    updated_at = now()
  WHERE id = v_patient_id;

  SELECT pr.id INTO v_responsible_id
  FROM public.patient_responsibles pr
  WHERE pr.patient_id = v_patient_id
    AND pr.user_id = auth.uid()
  ORDER BY pr.is_primary DESC, pr.created_at ASC
  LIMIT 1;

  IF v_responsible_id IS NULL THEN
    RAISE EXCEPTION 'Responsável não encontrado';
  END IF;

  UPDATE public.patient_responsibles
  SET
    full_name = COALESCE(NULLIF(trim(p_responsible_full_name), ''), full_name),
    cpf = COALESCE(v_resp_cpf, cpf),
    updated_at = now()
  WHERE id = v_responsible_id;

  INSERT INTO public.digital_acceptances (
    acceptor_role,
    acceptor_user_id,
    patient_id,
    term_id
  )
  SELECT
    'paciente'::public.user_role,
    auth.uid(),
    v_patient_id,
    lt.id
  FROM public.legal_terms lt
  WHERE lt.is_current = true
    AND lt.term_type IN (
      'CONTRATO_INTERMEDIACAO'::public.legal_term_type,
      'TERMO_CONSENTIMENTO'::public.legal_term_type,
      'LGPD'::public.legal_term_type
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.digital_acceptances da
      WHERE da.patient_id = v_patient_id
        AND da.term_id = lt.id
    );

  SELECT * INTO v_existing
  FROM public.demands d
  WHERE d.patient_id = v_patient_id
    AND d.status IN ('aberta', 'alocada')
  ORDER BY d.created_at DESC
  LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'demand_id', v_existing.id,
      'already_exists', true,
      'status', v_existing.status
    );
  END IF;

  INSERT INTO public.demands (
    patient_id,
    address_id,
    region_id,
    status,
    request_source
  )
  VALUES (
    v_patient_id,
    v_primary_address_id,
    v_patient.region_id,
    'aberta',
    'paciente_app'
  )
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'success', true,
    'demand_id', v_new_id,
    'already_exists', false,
    'status', 'aberta'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.patient_submit_service_request(
  text,
  text,
  date,
  public.patient_attendance_period,
  text,
  public.patient_referral_source,
  text,
  text,
  boolean
) TO authenticated;
