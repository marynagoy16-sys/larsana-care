-- LarsanaCare: dados e RPCs após categorias técnicas PP
-- Migration: 20260630150100_pp_technical_categories_data

-- Migração best-effort de specialty legado para categorias estruturadas
UPDATE public.professionals p
SET technical_categories = COALESCE(
  (
    SELECT array_agg(DISTINCT cat ORDER BY cat)
    FROM (
      SELECT unnest(COALESCE(p.technical_categories, '{}'::public.pp_technical_category[])) AS cat
      UNION
      SELECT 'ortopedico'::public.pp_technical_category
      WHERE p.specialty ILIKE '%ortop%'
      UNION
      SELECT 'pos_operatorio'::public.pp_technical_category
      WHERE p.specialty ILIKE '%pós-op%' OR p.specialty ILIKE '%pos-op%' OR p.specialty ILIKE '%pos operator%'
      UNION
      SELECT 'neurologico'::public.pp_technical_category
      WHERE p.specialty ILIKE '%neuro%'
      UNION
      SELECT 'idoso_gerontologia'::public.pp_technical_category
      WHERE p.specialty ILIKE '%geriat%' OR p.specialty ILIKE '%idoso%' OR p.specialty ILIKE '%geront%'
      UNION
      SELECT 'funcional_condicionamento'::public.pp_technical_category
      WHERE p.specialty ILIKE '%funcional%' OR p.specialty ILIKE '%condicion%'
      UNION
      SELECT 'pediatrico_geral'::public.pp_technical_category
      WHERE p.specialty ILIKE '%pediatr%'
      UNION
      SELECT 'cardiorrespiratoria'::public.pp_technical_category
      WHERE p.specialty ILIKE '%cardio%'
        OR p.specialty ILIKE '%cardíac%'
        OR p.specialty ILIKE '%cardiac%'
        OR p.specialty ILIKE '%respirat%'
        OR p.specialty ILIKE '%reabilit%card%'
    ) mapped
    WHERE cat IS NOT NULL
  ),
  '{}'::public.pp_technical_category[]
)
WHERE p.specialty IS NOT NULL AND trim(p.specialty) <> '';

-- Garantia: nenhum registro com array nulo após migração
UPDATE public.professionals
SET technical_categories = '{}'::public.pp_technical_category[]
WHERE technical_categories IS NULL;

CREATE OR REPLACE FUNCTION public.review_cardiorrespiratory_habilitation(
  p_professional_id uuid,
  p_new_status public.cardiorrespiratory_habilitation_status,
  p_admin_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_old_status public.cardiorrespiratory_habilitation_status;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.staff_profiles sp
    WHERE sp.user_id = v_user_id AND sp.can_approve_credenciamento = true
  ) AND public.current_user_role() <> 'admin' THEN
    RAISE EXCEPTION 'Sem permissão para revisar habilitação cardiorrespiratória';
  END IF;

  IF p_new_status NOT IN ('em_analise', 'habilitado', 'nao_habilitado', 'suspenso') THEN
    RAISE EXCEPTION 'Status de habilitação inválido para revisão admin';
  END IF;

  SELECT cardiorrespiratory_habilitation_status INTO v_old_status
  FROM public.professionals
  WHERE id = p_professional_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profissional não encontrado';
  END IF;

  UPDATE public.professionals
  SET
    cardiorrespiratory_habilitation_status = p_new_status,
    updated_at = now()
  WHERE id = p_professional_id;

  INSERT INTO public.cardiorrespiratory_habilitation_log (
    professional_id,
    from_status,
    to_status,
    changed_by,
    admin_notes
  ) VALUES (
    p_professional_id,
    v_old_status,
    p_new_status,
    v_user_id,
    p_admin_notes
  );
END;
$$;

REVOKE ALL ON FUNCTION public.review_cardiorrespiratory_habilitation(uuid, public.cardiorrespiratory_habilitation_status, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_cardiorrespiratory_habilitation(uuid, public.cardiorrespiratory_habilitation_status, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_pp_credentialing()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pp_id uuid;
  v_prof public.professionals%ROWTYPE;
  v_contract_id uuid;
  v_contract_number text;
  v_doc_count integer;
  v_term record;
  v_user_id uuid := auth.uid();
  v_categories public.pp_technical_category[];
  v_cardio_status public.cardiorrespiratory_habilitation_status := 'nao_solicitado';
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT id INTO v_pp_id
  FROM public.professionals
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_pp_id IS NULL THEN
    RAISE EXCEPTION 'Profissional não encontrado';
  END IF;

  SELECT * INTO v_prof
  FROM public.professionals
  WHERE id = v_pp_id
  FOR UPDATE;

  IF v_prof.credentialing_status NOT IN (
    'rascunho', 'documentos_pendentes', 'termos_pendentes', 'contrato_pendente'
  ) THEN
    RAISE EXCEPTION 'Credenciamento não pode ser enviado no status atual: %', v_prof.credentialing_status;
  END IF;

  IF v_prof.full_name IS NULL OR trim(v_prof.full_name) = ''
     OR v_prof.cpf_cnpj IS NULL OR trim(v_prof.cpf_cnpj) = ''
     OR v_prof.email IS NULL OR trim(v_prof.email) = ''
     OR v_prof.phone IS NULL OR trim(v_prof.phone) = ''
     OR v_prof.birth_date IS NULL
  THEN
    RAISE EXCEPTION 'Complete a etapa Dados antes de enviar';
  END IF;

  IF cardinality(v_prof.technical_categories) < 1 THEN
    RAISE EXCEPTION 'Selecione ao menos uma categoria técnica antes de enviar';
  END IF;

  v_categories := v_prof.technical_categories;

  IF 'cardiorrespiratoria'::public.pp_technical_category = ANY (v_categories) THEN
    IF v_prof.cardiorrespiratory_request_basis IS NULL THEN
      RAISE EXCEPTION 'Informe a base da solicitação de habilitação Cardiorrespiratória';
    END IF;

    IF v_prof.cardiorrespiratory_experience_description IS NULL
       OR trim(v_prof.cardiorrespiratory_experience_description) = '' THEN
      RAISE EXCEPTION 'Descreva sua experiência em Cardiorrespiratória';
    END IF;

    v_cardio_status := 'em_analise';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.professional_councils pc
    WHERE pc.professional_id = v_pp_id
      AND pc.registration_number IS NOT NULL
      AND trim(pc.registration_number) <> ''
  ) THEN
    RAISE EXCEPTION 'Complete a etapa Conselho antes de enviar';
  END IF;

  SELECT count(*)::integer INTO v_doc_count
  FROM public.professional_documents pd
  WHERE pd.professional_id = v_pp_id
    AND pd.document_type IN ('RG_CNH', 'COUNCIL_CARD', 'CRIMINAL_BACKGROUND');

  IF v_doc_count < 3 THEN
    RAISE EXCEPTION 'Envie todos os documentos obrigatórios antes de enviar';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.professional_bank_accounts pba
    WHERE pba.professional_id = v_pp_id
      AND pba.bank_name IS NOT NULL AND trim(pba.bank_name) <> ''
      AND pba.agency IS NOT NULL AND trim(pba.agency) <> ''
      AND pba.account_number IS NOT NULL AND trim(pba.account_number) <> ''
      AND pba.pix_key IS NOT NULL AND trim(pba.pix_key) <> ''
      AND pba.holder_name IS NOT NULL AND trim(pba.holder_name) <> ''
      AND pba.holder_document IS NOT NULL AND trim(pba.holder_document) <> ''
  ) THEN
    RAISE EXCEPTION 'Complete a etapa Banco antes de enviar';
  END IF;

  FOR v_term IN
    SELECT lt.id, lt.term_type
    FROM public.legal_terms lt
    WHERE lt.is_current = true
      AND lt.term_type IN ('DIRETRIZES_PP', 'LGPD_PP')
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.digital_acceptances da
      WHERE da.professional_id = v_pp_id AND da.term_id = v_term.id
    ) THEN
      INSERT INTO public.digital_acceptances (
        acceptor_role, acceptor_user_id, professional_id, term_id
      ) VALUES (
        'pp', v_user_id, v_pp_id, v_term.id
      );
    END IF;
  END LOOP;

  SELECT c.id, c.contract_number
  INTO v_contract_id, v_contract_number
  FROM public.contracts c
  WHERE c.professional_id = v_pp_id
  ORDER BY c.created_at DESC
  LIMIT 1;

  IF v_contract_id IS NULL THEN
    v_contract_number := public.generate_contract_number(v_prof.profession);
    INSERT INTO public.contracts (professional_id, contract_number, status, signed_at)
    VALUES (v_pp_id, v_contract_number, 'assinado', now())
    RETURNING id INTO v_contract_id;
  ELSE
    UPDATE public.contracts
    SET status = 'assinado', signed_at = now(), updated_at = now()
    WHERE id = v_contract_id;
  END IF;

  UPDATE public.professionals
  SET
    credentialing_status = 'aguardando_aprovacao',
    flag_assinado = true,
    technical_categories = v_categories,
    cardiorrespiratory_habilitation_status = v_cardio_status,
    updated_at = now()
  WHERE id = v_pp_id;

  IF v_cardio_status = 'em_analise' AND v_prof.cardiorrespiratory_habilitation_status IS DISTINCT FROM 'em_analise' THEN
    INSERT INTO public.cardiorrespiratory_habilitation_log (
      professional_id,
      from_status,
      to_status,
      changed_by,
      admin_notes
    ) VALUES (
      v_pp_id,
      v_prof.cardiorrespiratory_habilitation_status,
      'em_analise',
      v_user_id,
      'Solicitação enviada no credenciamento PP'
    );
  END IF;

  INSERT INTO public.credentialing_workflow_log (
    professional_id, from_status, to_status, changed_by, notes
  ) VALUES (
    v_pp_id,
    v_prof.credentialing_status,
    'aguardando_aprovacao',
    v_user_id,
    'Envio pelo portal PP'
  );

  RETURN jsonb_build_object(
    'professional_id', v_pp_id,
    'contract_id', v_contract_id,
    'contract_number', v_contract_number,
    'credentialing_status', 'aguardando_aprovacao'
  );
END;
$$;

DROP POLICY IF EXISTS demands_pp_read ON public.demands;

CREATE POLICY demands_pp_read ON public.demands
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() = 'pp'
    AND status = 'aberta'
    AND EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.user_id = auth.uid()
        AND public.pp_can_see_demand(p.id, demands.id)
    )
  );

CREATE OR REPLACE FUNCTION public.accept_demand(p_demand_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pp_id uuid;
  v_demand public.demands%ROWTYPE;
  v_patient_name text;
BEGIN
  v_pp_id := public.current_professional_id();
  IF v_pp_id IS NULL THEN
    RAISE EXCEPTION 'Profissional não encontrado';
  END IF;

  IF NOT public.pp_is_operational_regular(v_pp_id) THEN
    RAISE EXCEPTION 'Credenciamento inativo ou incompleto';
  END IF;

  IF NOT public.pp_can_see_demand(v_pp_id, p_demand_id) THEN
    RAISE EXCEPTION 'Você não está habilitado para demandas Cardiorrespiratórias';
  END IF;

  SELECT * INTO v_demand
  FROM public.demands
  WHERE id = p_demand_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demanda não encontrada';
  END IF;

  IF v_demand.status <> 'aberta' THEN
    RAISE EXCEPTION 'Demanda não está aberta';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.demand_responses dr
    WHERE dr.demand_id = p_demand_id
      AND dr.professional_id = v_pp_id
      AND dr.response = 'accepted'
  ) THEN
    IF v_demand.status = 'alocada' AND v_demand.assigned_professional_id = v_pp_id THEN
      RETURN jsonb_build_object(
        'demand_id', p_demand_id,
        'patient_id', v_demand.patient_id,
        'demand_type', v_demand.demand_type
      );
    END IF;

    UPDATE public.demands
    SET
      status = 'alocada',
      assigned_professional_id = v_pp_id,
      updated_at = now()
    WHERE id = p_demand_id;

    UPDATE public.patients
    SET
      allocated_professional_id = v_pp_id,
      updated_at = now()
    WHERE id = v_demand.patient_id;

    RETURN jsonb_build_object(
      'demand_id', p_demand_id,
      'patient_id', v_demand.patient_id,
      'demand_type', v_demand.demand_type
    );
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.demand_responses dr
    WHERE dr.demand_id = p_demand_id
      AND dr.professional_id = v_pp_id
  ) THEN
    RAISE EXCEPTION 'Você já respondeu esta demanda';
  END IF;

  INSERT INTO public.demand_responses (demand_id, professional_id, response)
  VALUES (p_demand_id, v_pp_id, 'accepted');

  UPDATE public.demands
  SET
    status = 'alocada',
    assigned_professional_id = v_pp_id,
    updated_at = now()
  WHERE id = p_demand_id;

  UPDATE public.patients
  SET
    allocated_professional_id = v_pp_id,
    updated_at = now()
  WHERE id = v_demand.patient_id;

  SELECT p.full_name INTO v_patient_name
  FROM public.patients p
  WHERE p.id = v_demand.patient_id;

  INSERT INTO public.operational_alerts (
    alert_type,
    entity_type,
    entity_id,
    severity,
    title,
    message
  ) VALUES (
    'demanda_alocada',
    'demand',
    p_demand_id,
    'info',
    'Demanda alocada a profissional',
    coalesce(v_patient_name, 'Paciente') || ' — demanda assumida pelo profissional parceiro.'
  );

  RETURN jsonb_build_object(
    'demand_id', p_demand_id,
    'patient_id', v_demand.patient_id,
    'demand_type', v_demand.demand_type
  );
END;
$$;
