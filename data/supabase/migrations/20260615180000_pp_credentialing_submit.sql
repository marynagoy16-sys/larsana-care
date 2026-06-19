-- LarsanaCare: PP self-service credentialing submit
-- Migration: 20260615180000_pp_credentialing_submit

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
    updated_at = now()
  WHERE id = v_pp_id;

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

GRANT EXECUTE ON FUNCTION public.submit_pp_credentialing() TO authenticated;

CREATE OR REPLACE FUNCTION public.record_pp_term_acceptances()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pp_id uuid;
  v_user_id uuid := auth.uid();
  v_term record;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT id INTO v_pp_id FROM public.professionals WHERE user_id = v_user_id LIMIT 1;
  IF v_pp_id IS NULL THEN
    RAISE EXCEPTION 'Profissional não encontrado';
  END IF;

  FOR v_term IN
    SELECT lt.id FROM public.legal_terms lt
    WHERE lt.is_current = true AND lt.term_type IN ('DIRETRIZES_PP', 'LGPD_PP')
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.digital_acceptances da
      WHERE da.professional_id = v_pp_id AND da.term_id = v_term.id
    ) THEN
      INSERT INTO public.digital_acceptances (
        acceptor_role, acceptor_user_id, professional_id, term_id
      ) VALUES ('pp', v_user_id, v_pp_id, v_term.id);
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_pp_term_acceptances() TO authenticated;
