-- Seed credenciamentos pendentes — fila admin /admin/credenciamento
-- Aplicar após seed.sql:
--   node data/supabase/scripts/apply-sql-remote.mjs data/supabase/seed-credentialing-pending.sql
-- Login PP (Juliana): juliana.rocha@larsanacare.com.br / LarsanaCare2026!

DO $$
DECLARE
  v_pw text := extensions.crypt('LarsanaCare2026!', extensions.gen_salt('bf'));
  v_juliana_user uuid := 'c1000000-0000-4000-8000-000000000007';
  v_ricardo_user uuid := 'c1000000-0000-4000-8000-000000000008';
  v_pp_juliana uuid := 'd1000000-0000-4000-8000-000000000020';
  v_pp_ricardo uuid := 'd1000000-0000-4000-8000-000000000021';
  v_pp_paula uuid := 'd1000000-0000-4000-8000-000000000022';
  v_pp_bruno uuid := 'd1000000-0000-4000-8000-000000000023';
  v_pp_carla uuid := 'd1000000-0000-4000-8000-000000000024';
BEGIN
  -- ===== Auth: PPs em credenciamento (opcional login) =====
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES
    (
      v_juliana_user, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'juliana.rocha@larsanacare.com.br', v_pw, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Juliana Rocha","primary_role":"pp"}'::jsonb,
      now(), now(), '', '', '', ''
    ),
    (
      v_ricardo_user, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'ricardo.mendes@larsanacare.com.br', v_pw, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Ricardo Mendes","primary_role":"pp"}'::jsonb,
      now(), now(), '', '', '', ''
    )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) VALUES
    (
      v_juliana_user, v_juliana_user,
      jsonb_build_object('sub', v_juliana_user::text, 'email', 'juliana.rocha@larsanacare.com.br'),
      'email', v_juliana_user::text, now(), now(), now()
    ),
    (
      v_ricardo_user, v_ricardo_user,
      jsonb_build_object('sub', v_ricardo_user::text, 'email', 'ricardo.mendes@larsanacare.com.br'),
      'email', v_ricardo_user::text, now(), now(), now()
    )
  ON CONFLICT DO NOTHING;

  INSERT INTO public.profiles (id, email, full_name, primary_role)
  VALUES
    (v_juliana_user, 'juliana.rocha@larsanacare.com.br', 'Juliana Rocha', 'pp'),
    (v_ricardo_user, 'ricardo.mendes@larsanacare.com.br', 'Ricardo Mendes', 'pp')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

  -- ===== 1–2: Aguardando aprovação (fila completa para gestão) =====
  INSERT INTO public.professionals (
    id, user_id, full_name, cpf_cnpj, person_type, birth_date, email, phone, address,
    pp_class, profession, specialty, credentialing_status,
    flag_encaminhado, flag_assinado, is_active, updated_at
  ) VALUES
    (
      v_pp_juliana, v_juliana_user,
      'Juliana Rocha', '39053344705', 'PF', '1990-04-12',
      'juliana.rocha@larsanacare.com.br', '11988881111',
      'Rua Ipiranga, 45 - Centro, Mauá - SP',
      'BRONZE', 'FISIO', 'Reabilitação cardíaca',
      'aguardando_aprovacao', false, true, false, now() - interval '2 days'
    ),
    (
      v_pp_ricardo, v_ricardo_user,
      'Ricardo Mendes', '15350946056', 'PF', '1988-11-03',
      'ricardo.mendes@larsanacare.com.br', '11988882222',
      'Av. Yolanda Saad Abuzaid, 200 - Mauá - SP',
      'PRATA', 'NUTI', 'Nutrição clínica',
      'aguardando_aprovacao', false, true, false, now() - interval '1 day'
    ),
    -- ===== 3: Documentos pendentes =====
    (
      v_pp_paula, NULL,
      'Paula Santos', '52998224726', 'PF', '1992-07-20',
      'paula.santos@larsanacare.com.br', '11988883333',
      'Rua Barão de Mauá, 88 - Mauá - SP',
      'BRONZE', 'FISIO', 'Neurologia funcional',
      'documentos_pendentes', false, false, false, now() - interval '5 days'
    ),
    -- ===== 4: Rascunho =====
    (
      v_pp_bruno, NULL,
      'Bruno Lima', '39053344706', 'PF', '1995-01-08',
      'bruno.lima@larsanacare.com.br', '11988884444',
      NULL,
      'BRONZE', 'CUID', NULL,
      'rascunho', false, false, false, now() - interval '8 days'
    ),
    -- ===== 5: Contrato pendente =====
    (
      v_pp_carla, NULL,
      'Carla Nunes', '15350946057', 'PF', '1987-09-15',
      'carla.nunes@larsanacare.com.br', '11988885555',
      'Rua João Batista, 12 - Santo André - SP',
      'OURO', 'FONO', 'Motricidade orofacial',
      'contrato_pendente', false, false, false, now() - interval '3 days'
    )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    credentialing_status = EXCLUDED.credentialing_status,
    profession = EXCLUDED.profession,
    specialty = EXCLUDED.specialty,
    updated_at = EXCLUDED.updated_at,
    flag_assinado = EXCLUDED.flag_assinado,
    is_active = EXCLUDED.is_active;

  -- Conselhos
  INSERT INTO public.professional_councils (professional_id, council_type, registration_number)
  VALUES
    (v_pp_juliana, 'CREFITO', '312456-F'),
    (v_pp_ricardo, 'CREFITO', '298877-F'),
    (v_pp_paula, 'CREFITO', '301122-F'),
    (v_pp_carla, 'CREFITO', '287654-F')
  ON CONFLICT (professional_id, council_type) DO UPDATE SET registration_number = EXCLUDED.registration_number;

  -- Contas bancárias (completas para fila de aprovação e Carla)
  INSERT INTO public.professional_bank_accounts (
    professional_id, bank_code, bank_name, agency, account_number,
    account_type, pix_key, holder_name, holder_document
  ) VALUES
    (v_pp_juliana, '341', 'Itaú Unibanco', '4521', '12345-6', 'corrente', 'juliana.rocha@larsanacare.com.br', 'Juliana Rocha', '39053344705'),
    (v_pp_ricardo, '033', 'Santander', '3301', '98765-4', 'corrente', 'ricardo.mendes@larsanacare.com.br', 'Ricardo Mendes', '15350946056'),
    (v_pp_carla, '104', 'Caixa', '1240', '556677-8', 'corrente', 'carla.nunes@larsanacare.com.br', 'Carla Nunes', '15350946057')
  ON CONFLICT (professional_id) DO UPDATE SET
    bank_name = EXCLUDED.bank_name,
    pix_key = EXCLUDED.pix_key;

  -- Documentos
  DELETE FROM public.professional_documents
  WHERE professional_id IN (v_pp_juliana, v_pp_ricardo, v_pp_paula, v_pp_carla);

  INSERT INTO public.professional_documents (professional_id, document_type, file_name) VALUES
    (v_pp_juliana, 'RG_CNH', 'rg-juliana-rocha.pdf'),
    (v_pp_juliana, 'COUNCIL_CARD', 'crefito-312456-f.pdf'),
    (v_pp_juliana, 'CRIMINAL_BACKGROUND', 'antecedentes-juliana.pdf'),
    (v_pp_ricardo, 'RG_CNH', 'rg-ricardo-mendes.pdf'),
    (v_pp_ricardo, 'COUNCIL_CARD', 'crefito-298877-f.pdf'),
    (v_pp_ricardo, 'CRIMINAL_BACKGROUND', 'antecedentes-ricardo.pdf'),
    (v_pp_ricardo, 'CERTIFICATE', 'pos-nutricao-clinica.pdf'),
    (v_pp_paula, 'RG_CNH', 'rg-paula-santos.pdf'),
    (v_pp_carla, 'RG_CNH', 'rg-carla-nunes.pdf'),
    (v_pp_carla, 'COUNCIL_CARD', 'crefito-287654-f.pdf'),
    (v_pp_carla, 'CRIMINAL_BACKGROUND', 'antecedentes-carla.pdf');

  -- Termos PP + contratos (aguardando aprovação)
  INSERT INTO public.digital_acceptances (acceptor_role, acceptor_user_id, professional_id, term_id, ip_address)
  SELECT
    'pp'::public.user_role,
    p.user_id,
    p.id,
    lt.id,
    '127.0.0.1'::inet
  FROM public.professionals p
  CROSS JOIN public.legal_terms lt
  WHERE p.id IN (v_pp_juliana, v_pp_ricardo)
    AND lt.is_current = true
    AND lt.term_type IN ('DIRETRIZES_PP', 'LGPD_PP')
    AND p.user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.digital_acceptances da
      WHERE da.professional_id = p.id AND da.term_id = lt.id
    );

  INSERT INTO public.contracts (id, professional_id, contract_number, status, signed_at)
  VALUES
    ('e1000000-0000-4000-8000-000000000020', v_pp_juliana, 'LRS-PROF.FISIO-2026-0002', 'assinado', now() - interval '2 days'),
    ('e1000000-0000-4000-8000-000000000021', v_pp_ricardo, 'LRS-PROF.NUTI-2026-0001', 'assinado', now() - interval '1 day')
  ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    signed_at = EXCLUDED.signed_at;

  INSERT INTO public.credentialing_workflow_log (professional_id, from_status, to_status, notes)
  VALUES
    (v_pp_juliana, 'contrato_pendente', 'aguardando_aprovacao', 'Envio simulado — seed dev'),
    (v_pp_ricardo, 'contrato_pendente', 'aguardando_aprovacao', 'Envio simulado — seed dev'),
    (v_pp_paula, 'rascunho', 'documentos_pendentes', 'Conselho informado — docs pendentes'),
    (v_pp_carla, 'termos_pendentes', 'contrato_pendente', 'Aguardando assinatura LRS-PROF');

END $$;
