-- Mapa de Documentos Larsana Care — fundação (schema, RPCs, gates)
-- Migration: 20260903120000_legal_documents_foundation

-- ===== ENUMS =====

ALTER TYPE public.legal_term_type ADD VALUE IF NOT EXISTS 'TERMO_USO_PP';
ALTER TYPE public.legal_term_type ADD VALUE IF NOT EXISTS 'ANEXO_I_COMERCIAL_PP';
ALTER TYPE public.legal_term_type ADD VALUE IF NOT EXISTS 'ANEXO_II_OPERACIONAL_PP';
ALTER TYPE public.legal_term_type ADD VALUE IF NOT EXISTS 'ANEXO_III_CATEGORIAS_PP';
ALTER TYPE public.legal_term_type ADD VALUE IF NOT EXISTS 'ANEXO_IV_SIGILO_PP';
ALTER TYPE public.legal_term_type ADD VALUE IF NOT EXISTS 'CONTRATO_PARCERIA_PP';
ALTER TYPE public.legal_term_type ADD VALUE IF NOT EXISTS 'ANEXO_I_COMERCIAL_PACIENTE';
ALTER TYPE public.legal_term_type ADD VALUE IF NOT EXISTS 'ANEXO_II_CANCELAMENTO_PACIENTE';
ALTER TYPE public.legal_term_type ADD VALUE IF NOT EXISTS 'ANEXO_III_ESCOPO_PACIENTE';
ALTER TYPE public.legal_term_type ADD VALUE IF NOT EXISTS 'TCLE_FISIO';
ALTER TYPE public.legal_term_type ADD VALUE IF NOT EXISTS 'AUTORIZACAO_FAMILIAR';
ALTER TYPE public.legal_term_type ADD VALUE IF NOT EXISTS 'REPRESENTACAO_LEGAL';
ALTER TYPE public.legal_term_type ADD VALUE IF NOT EXISTS 'AVISO_DADOS_SAUDE';
ALTER TYPE public.legal_term_type ADD VALUE IF NOT EXISTS 'POLITICA_COOKIES';

DO $$ BEGIN
  CREATE TYPE public.legal_term_profile AS ENUM ('pp', 'paciente', 'publico');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.legal_acceptance_mode AS ENUM ('express', 'awareness', 'contextual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.legal_term_status AS ENUM ('vigente', 'inativo', 'rascunho');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.legal_acceptance_context AS ENUM (
    'registration', 'onboarding', 'credentialing', 'cycle', 'demand', 'session', 'reaccept'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.patient_representation_kind AS ENUM (
    'account_holder', 'family_contact', 'legal_representative'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===== legal_terms metadados =====

ALTER TABLE public.legal_terms
  ADD COLUMN IF NOT EXISTS profile public.legal_term_profile,
  ADD COLUMN IF NOT EXISTS acceptance_mode public.legal_acceptance_mode NOT NULL DEFAULT 'express',
  ADD COLUMN IF NOT EXISTS status public.legal_term_status NOT NULL DEFAULT 'vigente',
  ADD COLUMN IF NOT EXISTS effective_at timestamptz;

UPDATE public.legal_terms SET profile = 'paciente'
WHERE profile IS NULL AND term_type IN (
  'TERMO_ADESAO', 'DIRETRIZES', 'LGPD', 'CONTRATO_INTERMEDIACAO', 'TERMO_CONSENTIMENTO'
);

UPDATE public.legal_terms SET profile = 'pp'
WHERE profile IS NULL AND term_type IN ('DIRETRIZES_PP', 'LGPD_PP');

-- ===== digital_acceptances contexto =====

ALTER TABLE public.digital_acceptances
  ADD COLUMN IF NOT EXISTS context_type public.legal_acceptance_context,
  ADD COLUMN IF NOT EXISTS context_id uuid;

CREATE INDEX IF NOT EXISTS idx_digital_acceptances_context
  ON public.digital_acceptances (context_type, context_id)
  WHERE context_id IS NOT NULL;

-- Deduplicar aceites gerais antes do índice único (seed/dados legados)
DELETE FROM public.digital_acceptances da
WHERE da.context_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.digital_acceptances da2
    WHERE da2.context_id IS NULL
      AND da2.acceptor_user_id = da.acceptor_user_id
      AND da2.term_id = da.term_id
      AND da2.accepted_at < da.accepted_at
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_digital_acceptances_user_term_general
  ON public.digital_acceptances (acceptor_user_id, term_id)
  WHERE context_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_digital_acceptances_unique_context
  ON public.digital_acceptances (acceptor_user_id, term_id, context_type, context_id)
  WHERE context_id IS NOT NULL;

-- ===== Aceites por ciclo =====

CREATE TABLE IF NOT EXISTS public.cycle_legal_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.care_cycles (id) ON DELETE CASCADE,
  term_id uuid NOT NULL REFERENCES public.legal_terms (id) ON DELETE RESTRICT,
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  accepted_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  unit_price_cents integer CHECK (unit_price_cents IS NULL OR unit_price_cents >= 0),
  session_count integer CHECK (session_count IS NULL OR session_count > 0),
  total_cents integer CHECK (total_cents IS NULL OR total_cents >= 0),
  payment_terms text,
  discount_cents integer CHECK (discount_cents IS NULL OR discount_cents >= 0),
  ip_address inet,
  user_agent text,
  UNIQUE (cycle_id, term_id)
);

CREATE INDEX IF NOT EXISTS idx_cycle_legal_acceptances_patient
  ON public.cycle_legal_acceptances (patient_id);

-- ===== Snapshot comercial por demanda (PP) =====

CREATE TABLE IF NOT EXISTS public.demand_commercial_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id uuid NOT NULL REFERENCES public.demands (id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.professionals (id) ON DELETE CASCADE,
  term_id uuid NOT NULL REFERENCES public.legal_terms (id) ON DELETE RESTRICT,
  patente text,
  repasse_pct numeric(5,2) CHECK (repasse_pct IS NULL OR (repasse_pct >= 0 AND repasse_pct <= 100)),
  base_amount_cents integer CHECK (base_amount_cents IS NULL OR base_amount_cents >= 0),
  accepted_at timestamptz NOT NULL DEFAULT now(),
  accepted_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  ip_address inet,
  user_agent text,
  UNIQUE (demand_id, professional_id, term_id)
);

CREATE INDEX IF NOT EXISTS idx_demand_commercial_snapshots_demand
  ON public.demand_commercial_snapshots (demand_id);

-- ===== Representação / autorização familiar =====

CREATE TABLE IF NOT EXISTS public.patient_representation_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  kind public.patient_representation_kind NOT NULL,
  term_id uuid REFERENCES public.legal_terms (id) ON DELETE SET NULL,
  scope_description text,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  ip_address inet,
  user_agent text,
  UNIQUE (patient_id, profile_id, kind)
);

CREATE INDEX IF NOT EXISTS idx_patient_representation_links_patient
  ON public.patient_representation_links (patient_id)
  WHERE revoked_at IS NULL;

-- ===== Storage bucket =====

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'legal-documents',
  'legal-documents',
  false,
  52428800,
  ARRAY['application/pdf', 'text/plain', 'text/markdown']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- ===== Helpers =====

CREATE OR REPLACE FUNCTION public.request_client_ip()
RETURNS inet
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(
    split_part(
      COALESCE(
        current_setting('request.headers', true)::json->>'x-forwarded-for',
        current_setting('request.headers', true)::json->>'x-real-ip'
      ),
      ',',
      1
    ),
    ''
  )::inet;
$$;

CREATE OR REPLACE FUNCTION public.request_user_agent()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.headers', true)::json->>'user-agent', '');
$$;

CREATE OR REPLACE FUNCTION public.has_acceptance_for_current_term(
  p_term_type public.legal_term_type,
  p_patient_id uuid DEFAULT NULL,
  p_professional_id uuid DEFAULT NULL,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.digital_acceptances da
    JOIN public.legal_terms lt ON lt.id = da.term_id
    WHERE lt.term_type = p_term_type
      AND lt.is_current = true
      AND (p_user_id IS NULL OR da.acceptor_user_id = p_user_id)
      AND (p_patient_id IS NULL OR da.patient_id = p_patient_id)
      AND (p_professional_id IS NULL OR da.professional_id = p_professional_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.has_cycle_acceptance(
  p_cycle_id uuid,
  p_term_type public.legal_term_type
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.cycle_legal_acceptances cla
    JOIN public.legal_terms lt ON lt.id = cla.term_id
    WHERE cla.cycle_id = p_cycle_id
      AND lt.term_type = p_term_type
  );
$$;

-- ===== record_legal_acceptance =====

CREATE OR REPLACE FUNCTION public.record_legal_acceptance(
  p_term_type public.legal_term_type,
  p_context_type public.legal_acceptance_context DEFAULT NULL,
  p_context_id uuid DEFAULT NULL,
  p_patient_id uuid DEFAULT NULL,
  p_professional_id uuid DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_cycle_snapshot jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_role public.user_role;
  v_term_id uuid;
  v_acceptance_id uuid;
  v_ip inet := COALESCE(p_ip_address, public.request_client_ip());
  v_ua text := COALESCE(p_user_agent, public.request_user_agent());
  v_patient_id uuid := p_patient_id;
  v_professional_id uuid := p_professional_id;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  v_role := public.current_user_role();

  SELECT lt.id INTO v_term_id
  FROM public.legal_terms lt
  WHERE lt.term_type = p_term_type
    AND lt.is_current = true
    AND lt.status = 'vigente'
  LIMIT 1;

  IF v_term_id IS NULL THEN
    RAISE EXCEPTION 'Termo vigente não encontrado: %', p_term_type;
  END IF;

  IF v_patient_id IS NULL AND v_role = 'paciente'::public.user_role THEN
    v_patient_id := public.current_patient_id_for_user();
  END IF;

  IF v_professional_id IS NULL AND v_role = 'pp'::public.user_role THEN
    v_professional_id := public.current_professional_id();
  END IF;

  IF p_context_type = 'cycle'::public.legal_acceptance_context AND p_context_id IS NOT NULL THEN
    INSERT INTO public.cycle_legal_acceptances (
      cycle_id, term_id, patient_id, accepted_by,
      unit_price_cents, session_count, total_cents, payment_terms, discount_cents,
      ip_address, user_agent
    )
    VALUES (
      p_context_id,
      v_term_id,
      COALESCE(v_patient_id, (SELECT patient_id FROM public.care_cycles WHERE id = p_context_id)),
      v_user_id,
      NULLIF(p_cycle_snapshot->>'unit_price_cents', '')::integer,
      NULLIF(p_cycle_snapshot->>'session_count', '')::integer,
      NULLIF(p_cycle_snapshot->>'total_cents', '')::integer,
      NULLIF(p_cycle_snapshot->>'payment_terms', ''),
      NULLIF(p_cycle_snapshot->>'discount_cents', '')::integer,
      v_ip,
      v_ua
    )
    ON CONFLICT (cycle_id, term_id) DO NOTHING
    RETURNING id INTO v_acceptance_id;

    IF v_acceptance_id IS NULL THEN
      SELECT cla.id INTO v_acceptance_id
      FROM public.cycle_legal_acceptances cla
      WHERE cla.cycle_id = p_context_id AND cla.term_id = v_term_id;
    END IF;

    RETURN v_acceptance_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.digital_acceptances da
    WHERE da.acceptor_user_id = v_user_id
      AND da.term_id = v_term_id
      AND da.context_type IS NOT DISTINCT FROM p_context_type
      AND da.context_id IS NOT DISTINCT FROM p_context_id
  ) THEN
    SELECT da.id INTO v_acceptance_id
    FROM public.digital_acceptances da
    WHERE da.acceptor_user_id = v_user_id
      AND da.term_id = v_term_id
      AND da.context_type IS NOT DISTINCT FROM p_context_type
      AND da.context_id IS NOT DISTINCT FROM p_context_id
    LIMIT 1;
    RETURN v_acceptance_id;
  END IF;

  INSERT INTO public.digital_acceptances (
    acceptor_role,
    acceptor_user_id,
    patient_id,
    professional_id,
    term_id,
    ip_address,
    user_agent,
    context_type,
    context_id
  )
  VALUES (
    v_role,
    v_user_id,
    v_patient_id,
    v_professional_id,
    v_term_id,
    v_ip,
    v_ua,
    p_context_type,
    p_context_id
  )
  RETURNING id INTO v_acceptance_id;

  RETURN v_acceptance_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_legal_acceptance(
  public.legal_term_type,
  public.legal_acceptance_context,
  uuid,
  uuid,
  uuid,
  inet,
  text,
  jsonb
) TO authenticated;

-- ===== get_required_legal_terms =====

CREATE OR REPLACE FUNCTION public.get_required_legal_terms(
  p_profile public.legal_term_profile,
  p_flow text DEFAULT NULL
)
RETURNS TABLE (
  term_type public.legal_term_type,
  term_id uuid,
  title text,
  version text,
  acceptance_mode public.legal_acceptance_mode,
  requires_acceptance boolean,
  accepted boolean,
  accepted_at timestamptz,
  context_label text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_patient_id uuid;
  v_professional_id uuid;
  v_cycle_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF p_profile = 'paciente'::public.legal_term_profile THEN
    v_patient_id := public.current_patient_id_for_user();
  ELSIF p_profile = 'pp'::public.legal_term_profile THEN
    v_professional_id := public.current_professional_id();
  END IF;

  IF p_flow = 'cycle' THEN
    v_cycle_id := NULL; -- caller passes cycle via separate RPC if needed
  END IF;

  RETURN QUERY
  SELECT
    lt.term_type,
    lt.id AS term_id,
    lt.title,
    lt.version,
    lt.acceptance_mode,
    (lt.acceptance_mode = 'express'::public.legal_acceptance_mode) AS requires_acceptance,
    EXISTS (
      SELECT 1 FROM public.digital_acceptances da
      WHERE da.term_id = lt.id
        AND da.acceptor_user_id = v_user_id
        AND (
          v_patient_id IS NULL OR da.patient_id = v_patient_id OR da.patient_id IS NULL
        )
        AND (
          v_professional_id IS NULL OR da.professional_id = v_professional_id OR da.professional_id IS NULL
        )
    ) AS accepted,
    (
      SELECT max(da.accepted_at)
      FROM public.digital_acceptances da
      WHERE da.term_id = lt.id AND da.acceptor_user_id = v_user_id
    ) AS accepted_at,
    NULL::text AS context_label
  FROM public.legal_terms lt
  WHERE lt.is_current = true
    AND lt.status = 'vigente'::public.legal_term_status
    AND (lt.profile = p_profile OR lt.profile = 'publico'::public.legal_term_profile)
    AND (
      p_flow IS NULL
      OR (p_flow = 'onboarding' AND lt.term_type IN (
        'TERMO_ADESAO', 'LGPD', 'AVISO_DADOS_SAUDE'
      ))
      OR (p_flow = 'credentialing' AND lt.term_type IN (
        'TERMO_USO_PP', 'DIRETRIZES_PP', 'LGPD_PP',
        'ANEXO_III_CATEGORIAS_PP', 'ANEXO_IV_SIGILO_PP',
        'ANEXO_I_COMERCIAL_PP', 'ANEXO_II_OPERACIONAL_PP', 'CONTRATO_PARCERIA_PP'
      ))
      OR (p_flow = 'cycle' AND lt.term_type IN (
        'ANEXO_I_COMERCIAL_PACIENTE', 'ANEXO_II_CANCELAMENTO_PACIENTE'
      ))
      OR (p_flow = 'tcle' AND lt.term_type IN ('TCLE_FISIO', 'TERMO_CONSENTIMENTO'))
      OR (p_flow = 'family' AND lt.term_type = 'AUTORIZACAO_FAMILIAR')
      OR (p_flow = 'representation' AND lt.term_type = 'REPRESENTACAO_LEGAL')
    )
  ORDER BY lt.term_type;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_required_legal_terms(public.legal_term_profile, text) TO authenticated;

-- ===== get_legal_documents_hub =====

CREATE OR REPLACE FUNCTION public.get_legal_documents_hub(
  p_profile public.legal_term_profile
)
RETURNS TABLE (
  term_id uuid,
  term_type public.legal_term_type,
  title text,
  version text,
  profile public.legal_term_profile,
  acceptance_mode public.legal_acceptance_mode,
  storage_path text,
  accepted_at timestamptz,
  accepted_version text,
  requires_reaccept boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_patient_id uuid;
  v_professional_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF p_profile = 'paciente'::public.legal_term_profile THEN
    v_patient_id := public.current_patient_id_for_user();
  ELSIF p_profile = 'pp'::public.legal_term_profile THEN
    v_professional_id := public.current_professional_id();
  END IF;

  RETURN QUERY
  SELECT
    lt.id,
    lt.term_type,
    lt.title,
    lt.version,
    lt.profile,
    lt.acceptance_mode,
    lt.storage_path,
    da.accepted_at,
    da_lt.version AS accepted_version,
    (
      lt.requires_reaccept
      AND da_lt.version IS NOT NULL
      AND da_lt.version <> lt.version
    ) AS requires_reaccept
  FROM public.legal_terms lt
  LEFT JOIN LATERAL (
    SELECT d.accepted_at, d.term_id
    FROM public.digital_acceptances d
    WHERE d.acceptor_user_id = v_user_id
      AND (
        v_patient_id IS NULL OR d.patient_id = v_patient_id OR d.patient_id IS NULL
      )
      AND (
        v_professional_id IS NULL OR d.professional_id = v_professional_id OR d.professional_id IS NULL
      )
      AND d.term_id IN (
        SELECT lt2.id FROM public.legal_terms lt2 WHERE lt2.term_type = lt.term_type
      )
    ORDER BY d.accepted_at DESC
    LIMIT 1
  ) da ON true
  LEFT JOIN public.legal_terms da_lt ON da_lt.id = da.term_id
  WHERE lt.is_current = true
    AND lt.status = 'vigente'::public.legal_term_status
    AND (lt.profile = p_profile OR (p_profile = 'publico'::public.legal_term_profile AND lt.profile = 'publico'::public.legal_term_profile))
  ORDER BY lt.term_type;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_legal_documents_hub(public.legal_term_profile) TO authenticated;

-- ===== has_pending_reaccept =====

CREATE OR REPLACE FUNCTION public.has_pending_reaccept(
  p_profile public.legal_term_profile DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.legal_terms lt
    WHERE lt.is_current = true
      AND lt.requires_reaccept = true
      AND lt.status = 'vigente'::public.legal_term_status
      AND (p_profile IS NULL OR lt.profile = p_profile OR lt.profile = 'publico'::public.legal_term_profile)
      AND NOT EXISTS (
        SELECT 1
        FROM public.digital_acceptances da
        WHERE da.acceptor_user_id = auth.uid()
          AND da.term_id = lt.id
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_pending_reaccept(public.legal_term_profile) TO authenticated;

-- ===== Gates PP =====

CREATE OR REPLACE FUNCTION public.assert_pp_can_access_clinical_data(
  p_professional_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pp_id uuid := COALESCE(p_professional_id, public.current_professional_id());
BEGIN
  IF v_pp_id IS NULL THEN
    RAISE EXCEPTION 'Profissional não identificado';
  END IF;

  IF NOT public.has_acceptance_for_current_term(
    'ANEXO_IV_SIGILO_PP'::public.legal_term_type,
    NULL,
    v_pp_id,
    (SELECT user_id FROM public.professionals WHERE id = v_pp_id)
  ) THEN
    RAISE EXCEPTION 'Aceite do Anexo IV (Sigilo e Dados Assistenciais) é obrigatório para acessar prontuário';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.assert_pp_can_access_clinical_data(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.assert_pp_can_accept_demand(
  p_demand_id uuid,
  p_professional_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pp_id uuid := COALESCE(p_professional_id, public.current_professional_id());
  v_term record;
BEGIN
  IF v_pp_id IS NULL THEN
    RAISE EXCEPTION 'Profissional não identificado';
  END IF;

  FOR v_term IN
    SELECT lt.term_type
    FROM public.legal_terms lt
    WHERE lt.is_current = true
      AND lt.term_type IN ('ANEXO_I_COMERCIAL_PP', 'ANEXO_II_OPERACIONAL_PP')
  LOOP
    IF NOT public.has_acceptance_for_current_term(
      v_term.term_type,
      NULL,
      v_pp_id,
      (SELECT user_id FROM public.professionals WHERE id = v_pp_id)
    ) THEN
      RAISE EXCEPTION 'Aceite vigente obrigatório: %', v_term.term_type;
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.assert_pp_can_accept_demand(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.record_demand_commercial_snapshot(
  p_demand_id uuid,
  p_patente text DEFAULT NULL,
  p_repasse_pct numeric DEFAULT NULL,
  p_base_amount_cents integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pp_id uuid := public.current_professional_id();
  v_user_id uuid := auth.uid();
  v_term_id uuid;
  v_id uuid;
BEGIN
  PERFORM public.assert_pp_can_accept_demand(p_demand_id, v_pp_id);

  SELECT lt.id INTO v_term_id
  FROM public.legal_terms lt
  WHERE lt.is_current = true AND lt.term_type = 'ANEXO_I_COMERCIAL_PP'
  LIMIT 1;

  IF v_term_id IS NULL THEN
    RAISE EXCEPTION 'Anexo I Comercial PP não publicado';
  END IF;

  INSERT INTO public.demand_commercial_snapshots (
    demand_id, professional_id, term_id, patente, repasse_pct, base_amount_cents,
    accepted_by, ip_address, user_agent
  )
  VALUES (
    p_demand_id, v_pp_id, v_term_id, p_patente, p_repasse_pct, p_base_amount_cents,
    v_user_id, public.request_client_ip(), public.request_user_agent()
  )
  ON CONFLICT (demand_id, professional_id, term_id) DO UPDATE SET
    patente = EXCLUDED.patente,
    repasse_pct = EXCLUDED.repasse_pct,
    base_amount_cents = EXCLUDED.base_amount_cents,
    accepted_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_demand_commercial_snapshot(uuid, text, numeric, integer) TO authenticated;

-- ===== record_patient_representation =====

CREATE OR REPLACE FUNCTION public.record_patient_representation(
  p_kind public.patient_representation_kind,
  p_term_type public.legal_term_type,
  p_scope_description text DEFAULT NULL,
  p_patient_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_patient_id uuid := COALESCE(p_patient_id, public.current_patient_id_for_user());
  v_term_id uuid;
  v_id uuid;
BEGIN
  IF v_user_id IS NULL OR v_patient_id IS NULL THEN
    RAISE EXCEPTION 'Usuário ou paciente não identificado';
  END IF;

  SELECT lt.id INTO v_term_id
  FROM public.legal_terms lt
  WHERE lt.is_current = true AND lt.term_type = p_term_type
  LIMIT 1;

  PERFORM public.record_legal_acceptance(
    p_term_type,
    'registration'::public.legal_acceptance_context,
    v_patient_id,
    v_patient_id,
    NULL,
    NULL,
    NULL,
    NULL
  );

  INSERT INTO public.patient_representation_links (
    patient_id, profile_id, kind, term_id, scope_description,
    ip_address, user_agent
  )
  VALUES (
    v_patient_id, v_user_id, p_kind, v_term_id, p_scope_description,
    public.request_client_ip(), public.request_user_agent()
  )
  ON CONFLICT (patient_id, profile_id, kind) DO UPDATE SET
    term_id = EXCLUDED.term_id,
    scope_description = EXCLUDED.scope_description,
    accepted_at = now(),
    revoked_at = NULL,
    ip_address = EXCLUDED.ip_address,
    user_agent = EXCLUDED.user_agent
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_patient_representation(
  public.patient_representation_kind,
  public.legal_term_type,
  text,
  uuid
) TO authenticated;

-- ===== Ciclo: aceite por ciclo =====

CREATE OR REPLACE FUNCTION public.record_cycle_legal_acceptances(
  p_cycle_id uuid,
  p_accept_anexo_i boolean DEFAULT true,
  p_accept_anexo_ii boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle public.care_cycles%ROWTYPE;
  v_snapshot jsonb;
  v_ids uuid[] := ARRAY[]::uuid[];
  v_id uuid;
BEGIN
  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = p_cycle_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ciclo não encontrado';
  END IF;

  IF v_cycle.patient_id <> ALL (public.current_patient_ids()) AND NOT public.is_staff() THEN
    RAISE EXCEPTION 'Sem permissão para aceitar termos deste ciclo';
  END IF;

  v_snapshot := jsonb_build_object(
    'unit_price_cents', v_cycle.session_unit_price_cents,
    'session_count', v_cycle.session_count,
    'total_cents', v_cycle.total_amount_cents,
    'payment_terms', 'Conforme Anexo I vigente',
    'discount_cents', 0
  );

  IF COALESCE(p_accept_anexo_i, false) THEN
    v_id := public.record_legal_acceptance(
      'ANEXO_I_COMERCIAL_PACIENTE',
      'cycle', p_cycle_id, v_cycle.patient_id, NULL, NULL, NULL, v_snapshot
    );
    v_ids := array_append(v_ids, v_id);
  END IF;

  IF COALESCE(p_accept_anexo_ii, false) THEN
    v_id := public.record_legal_acceptance(
      'ANEXO_II_CANCELAMENTO_PACIENTE',
      'cycle', p_cycle_id, v_cycle.patient_id, NULL, NULL, NULL, NULL
    );
    v_ids := array_append(v_ids, v_id);
  END IF;

  RETURN jsonb_build_object('cycle_id', p_cycle_id, 'acceptance_ids', v_ids);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_cycle_legal_acceptances(uuid, boolean, boolean) TO authenticated;

-- ===== Trigger ciclo =====

CREATE OR REPLACE FUNCTION public.block_cycle_without_acceptance()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IN ('aguardando_pagamento', 'ativo') THEN
    IF NOT public.has_valid_acceptance(
      NEW.patient_id,
      ARRAY['LGPD']::public.legal_term_type[]
    ) THEN
      RAISE EXCEPTION 'Paciente sem aceite vigente da Política de Privacidade';
    END IF;

    IF NOT public.has_cycle_acceptance(NEW.id, 'ANEXO_I_COMERCIAL_PACIENTE') THEN
      RAISE EXCEPTION 'Ciclo sem aceite do Anexo I Comercial vigente';
    END IF;

    IF NOT public.has_cycle_acceptance(NEW.id, 'ANEXO_II_CANCELAMENTO_PACIENTE') THEN
      RAISE EXCEPTION 'Ciclo sem aceite do Anexo II Cancelamento vigente';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ===== submit_pp_credentialing (ordem mapa) =====

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
  v_result jsonb;
  v_required_terms public.legal_term_type[] := ARRAY[
    'TERMO_USO_PP', 'DIRETRIZES_PP', 'LGPD_PP',
    'ANEXO_III_CATEGORIAS_PP', 'ANEXO_IV_SIGILO_PP',
    'ANEXO_I_COMERCIAL_PP', 'ANEXO_II_OPERACIONAL_PP'
  ]::public.legal_term_type[];
  v_missing public.legal_term_type;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT id INTO v_pp_id FROM public.professionals WHERE user_id = v_user_id LIMIT 1;
  IF v_pp_id IS NULL THEN RAISE EXCEPTION 'Profissional não encontrado'; END IF;

  SELECT * INTO v_prof FROM public.professionals WHERE id = v_pp_id FOR UPDATE;

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
  THEN RAISE EXCEPTION 'Complete a etapa Dados antes de enviar'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.professional_councils pc
    WHERE pc.professional_id = v_pp_id AND pc.registration_number IS NOT NULL AND trim(pc.registration_number) <> ''
  ) THEN RAISE EXCEPTION 'Complete a etapa Conselho antes de enviar'; END IF;

  SELECT count(*)::integer INTO v_doc_count
  FROM public.professional_documents pd
  WHERE pd.professional_id = v_pp_id
    AND pd.document_type IN ('RG_CNH', 'COUNCIL_CARD', 'CRIMINAL_BACKGROUND');
  IF v_doc_count < 3 THEN RAISE EXCEPTION 'Envie todos os documentos obrigatórios antes de enviar'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.professional_bank_accounts pba
    WHERE pba.professional_id = v_pp_id
      AND pba.bank_name IS NOT NULL AND trim(pba.bank_name) <> ''
      AND pba.agency IS NOT NULL AND trim(pba.agency) <> ''
      AND pba.account_number IS NOT NULL AND trim(pba.account_number) <> ''
      AND pba.pix_key IS NOT NULL AND trim(pba.pix_key) <> ''
      AND pba.holder_name IS NOT NULL AND trim(pba.holder_name) <> ''
      AND pba.holder_document IS NOT NULL AND trim(pba.holder_document) <> ''
  ) THEN RAISE EXCEPTION 'Complete a etapa Banco antes de enviar'; END IF;

  IF COALESCE(array_length(v_prof.technical_categories, 1), 0) < 1 THEN
    RAISE EXCEPTION 'Selecione ao menos uma categoria técnica (Anexo III)';
  END IF;

  SELECT rt INTO v_missing
  FROM unnest(v_required_terms) AS rt
  WHERE NOT public.has_acceptance_for_current_term(rt, NULL, v_pp_id, v_user_id)
  LIMIT 1;

  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION 'Aceite pendente: %', v_missing;
  END IF;

  SELECT c.id, c.contract_number INTO v_contract_id, v_contract_number
  FROM public.contracts c WHERE c.professional_id = v_pp_id
  ORDER BY c.created_at DESC LIMIT 1;

  IF v_contract_id IS NULL THEN
    v_contract_number := public.generate_contract_number(v_prof.profession);
    INSERT INTO public.contracts (professional_id, contract_number, status, signed_at)
    VALUES (v_pp_id, v_contract_number, 'assinado', now())
    RETURNING id INTO v_contract_id;
  ELSE
    UPDATE public.contracts SET status = 'assinado', signed_at = now(), updated_at = now()
    WHERE id = v_contract_id;
  END IF;

  UPDATE public.professionals
  SET credentialing_status = 'aguardando_aprovacao', flag_assinado = true, updated_at = now()
  WHERE id = v_pp_id;

  INSERT INTO public.credentialing_workflow_log (
    professional_id, from_status, to_status, changed_by, notes
  ) VALUES (
    v_pp_id, v_prof.credentialing_status, 'aguardando_aprovacao', v_user_id, 'Envio pelo portal PP (mapa documentos)'
  );

  PERFORM public.award_pp_points(v_pp_id, 'complete_credentialing', v_pp_id);
  PERFORM public.ensure_professional_referral_code(v_pp_id);
  PERFORM public.confirm_pp_referral_points(v_pp_id);

  RETURN jsonb_build_object(
    'professional_id', v_pp_id,
    'contract_id', v_contract_id,
    'contract_number', v_contract_number,
    'credentialing_status', 'aguardando_aprovacao'
  );
END;
$$;

-- ===== Gate prontuário (medical_records) =====

CREATE OR REPLACE FUNCTION public.enforce_pp_clinical_access_gate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pp_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'medical_records' THEN
    SELECT cs.assigned_professional_id INTO v_pp_id
    FROM public.care_sessions cs
    WHERE cs.id = NEW.session_id;
  END IF;

  IF v_pp_id IS NOT NULL THEN
    PERFORM public.assert_pp_can_access_clinical_data(v_pp_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_medical_records_pp_sigilo_gate ON public.medical_records;
CREATE TRIGGER trg_medical_records_pp_sigilo_gate
  BEFORE INSERT OR UPDATE ON public.medical_records
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_pp_clinical_access_gate();

-- ===== Expandir get_public_legal_term =====

CREATE OR REPLACE FUNCTION public.get_public_legal_term(p_term_type public.legal_term_type)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', lt.id,
    'term_type', lt.term_type,
    'title', lt.title,
    'version', lt.version,
    'content', lt.content
  )
  FROM public.legal_terms lt
  WHERE lt.term_type = p_term_type
    AND lt.is_current = true
    AND lt.status = 'vigente'::public.legal_term_status
  LIMIT 1;
$$;

-- ===== RLS novas tabelas =====

ALTER TABLE public.cycle_legal_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_commercial_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_representation_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY cycle_legal_acceptances_patient ON public.cycle_legal_acceptances
  FOR SELECT TO authenticated
  USING (
    patient_id = ANY (public.current_patient_ids())
    OR public.is_staff()
  );

CREATE POLICY cycle_legal_acceptances_insert ON public.cycle_legal_acceptances
  FOR INSERT TO authenticated
  WITH CHECK (
    accepted_by = auth.uid()
    AND (
      patient_id = ANY (public.current_patient_ids())
      OR public.is_staff()
    )
  );

CREATE POLICY demand_commercial_snapshots_pp ON public.demand_commercial_snapshots
  FOR SELECT TO authenticated
  USING (
    professional_id = public.current_professional_id()
    OR public.is_staff()
  );

CREATE POLICY demand_commercial_snapshots_insert ON public.demand_commercial_snapshots
  FOR INSERT TO authenticated
  WITH CHECK (accepted_by = auth.uid());

CREATE POLICY patient_representation_links_read ON public.patient_representation_links
  FOR SELECT TO authenticated
  USING (
    profile_id = auth.uid()
    OR patient_id = ANY (public.current_patient_ids())
    OR public.is_staff()
  );

CREATE POLICY patient_representation_links_insert ON public.patient_representation_links
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

COMMENT ON FUNCTION public.record_legal_acceptance IS
  'Ponto único de gravação de aceites com IP/UA e contexto opcional (ciclo, credenciamento, etc.).';
