-- LarsanaCare: fluxo de exclusão de conta com carência de 30 dias (paciente + pp)
-- Migration: 20260916000000_account_deletion_flow
--
-- Estratégia de dados (resumo A/B/C; detalhes na página pública /excluir-conta):
--   A) apagáveis: notificações, chat, tickets de suporte -> DELETE
--   B) anonimizáveis: identidade (profiles, professionals, patient_responsibles,
--      patients/endereços quando SEM histórico) -> scrub de PII
--   C) retidos por obrigação legal/fiscal/clínica: prontuários, cobranças,
--      repasses, aceites/consentimentos, contratos -> mantidos (identificadores
--      pseudonimizados quando aplicável)
--
-- Regra de exclusão definitiva do Supabase Auth:
--   - Se a conta NÃO tiver nenhum registro retido (categoria C), o usuário é
--     excluído do auth.users (hard delete, cascade limpa dados pessoais).
--   - Se tiver registros retidos, a conta é ANONIMIZADA e o login é DESABILITADO
--     (banned_until = infinity). Assim não destruímos consentimento/prontuário/fiscal.

-- =========================================================================
-- 1. Tabela de solicitações
-- =========================================================================
CREATE TABLE public.account_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ON DELETE SET NULL: preserva o registro de auditoria mesmo após hard delete
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  scheduled_deletion_at timestamptz NOT NULL,
  cancelled_at timestamptz,
  cancellation_reason text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'cancelled', 'processed', 'failed')),
  processed_at timestamptz,
  processing_outcome text CHECK (
    processing_outcome IS NULL OR processing_outcome IN ('deleted', 'anonymized')
  ),
  processing_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- No máximo UMA solicitação pendente por usuário
CREATE UNIQUE INDEX uq_account_deletion_pending
  ON public.account_deletion_requests (user_id)
  WHERE status = 'pending';

CREATE INDEX idx_account_deletion_status_due
  ON public.account_deletion_requests (status, scheduled_deletion_at);

DROP TRIGGER IF EXISTS trg_account_deletion_requests_updated_at
  ON public.account_deletion_requests;
CREATE TRIGGER trg_account_deletion_requests_updated_at
  BEFORE UPDATE ON public.account_deletion_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- 2. RLS: usuário só enxerga a própria solicitação; staff enxerga todas.
--    Escrita acontece SOMENTE via RPCs SECURITY DEFINER (sem policies de write).
-- =========================================================================
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY account_deletion_own_select ON public.account_deletion_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY account_deletion_staff_select ON public.account_deletion_requests
  FOR SELECT USING (public.is_staff());

GRANT SELECT ON public.account_deletion_requests TO authenticated;

-- =========================================================================
-- 3. RPC: solicitar exclusão (self-service, paciente|pp)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.request_account_deletion()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role public.user_role;
  v_existing public.account_deletion_requests;
  v_req public.account_deletion_requests;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT primary_role INTO v_role FROM public.profiles WHERE id = v_uid;
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Perfil não encontrado';
  END IF;
  IF v_role NOT IN ('paciente', 'pp') THEN
    RAISE EXCEPTION 'Apenas contas de paciente ou profissional podem solicitar exclusão pelo app';
  END IF;

  SELECT * INTO v_existing
  FROM public.account_deletion_requests
  WHERE user_id = v_uid AND status = 'pending'
  ORDER BY requested_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'status', 'pending',
      'already_requested', true,
      'requested_at', v_existing.requested_at,
      'scheduled_deletion_at', v_existing.scheduled_deletion_at
    );
  END IF;

  INSERT INTO public.account_deletion_requests (user_id, requested_at, scheduled_deletion_at, status)
  VALUES (v_uid, now(), now() + interval '30 days', 'pending')
  RETURNING * INTO v_req;

  INSERT INTO public.audit_logs (entity_type, entity_id, action, actor_user_id, new_values)
  VALUES (
    'account_deletion_request', v_req.id, 'requested', v_uid,
    jsonb_build_object('scheduled_deletion_at', v_req.scheduled_deletion_at)
  );

  RETURN jsonb_build_object(
    'status', 'pending',
    'already_requested', false,
    'requested_at', v_req.requested_at,
    'scheduled_deletion_at', v_req.scheduled_deletion_at
  );
END;
$$;

-- =========================================================================
-- 4. RPC: cancelar exclusão manualmente (própria conta)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.cancel_account_deletion()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_req public.account_deletion_requests;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  UPDATE public.account_deletion_requests
  SET status = 'cancelled', cancelled_at = now(), cancellation_reason = 'user_request'
  WHERE user_id = v_uid AND status = 'pending'
  RETURNING * INTO v_req;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('cancelled', false);
  END IF;

  INSERT INTO public.audit_logs (entity_type, entity_id, action, actor_user_id, new_values)
  VALUES ('account_deletion_request', v_req.id, 'cancelled', v_uid,
          jsonb_build_object('reason', 'user_request'));

  RETURN jsonb_build_object('cancelled', true);
END;
$$;

-- =========================================================================
-- 5. RPC: cancelar automaticamente no login (reason = user_login)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.cancel_account_deletion_on_login()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_req public.account_deletion_requests;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('cancelled', false);
  END IF;

  UPDATE public.account_deletion_requests
  SET status = 'cancelled', cancelled_at = now(), cancellation_reason = 'user_login'
  WHERE user_id = v_uid AND status = 'pending'
  RETURNING * INTO v_req;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('cancelled', false);
  END IF;

  INSERT INTO public.audit_logs (entity_type, entity_id, action, actor_user_id, new_values)
  VALUES ('account_deletion_request', v_req.id, 'cancelled', v_uid,
          jsonb_build_object('reason', 'user_login'));

  RETURN jsonb_build_object(
    'cancelled', true,
    'scheduled_deletion_at', v_req.scheduled_deletion_at
  );
END;
$$;

-- =========================================================================
-- 6. RPC: status atual da solicitação (para banner)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.get_account_deletion_status()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_req public.account_deletion_requests;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('pending', false);
  END IF;

  SELECT * INTO v_req
  FROM public.account_deletion_requests
  WHERE user_id = v_uid AND status = 'pending'
  ORDER BY requested_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('pending', false);
  END IF;

  RETURN jsonb_build_object(
    'pending', true,
    'requested_at', v_req.requested_at,
    'scheduled_deletion_at', v_req.scheduled_deletion_at
  );
END;
$$;

-- =========================================================================
-- 7. Helper: a conta possui registros sob retenção obrigatória (categoria C)?
--    Se SIM -> anonimizar + desabilitar (nunca hard delete).
-- =========================================================================
CREATE OR REPLACE FUNCTION public.account_has_retained_records(
  p_user_id uuid,
  p_role public.user_role
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prof_id uuid;
  v_patient_ids uuid[];
BEGIN
  -- Consentimento / legal ligado diretamente ao profile
  IF EXISTS (SELECT 1 FROM public.digital_acceptances WHERE acceptor_user_id = p_user_id)
     OR EXISTS (SELECT 1 FROM public.cycle_legal_acceptances WHERE accepted_by = p_user_id)
     OR EXISTS (SELECT 1 FROM public.demand_commercial_snapshots WHERE accepted_by = p_user_id)
     OR EXISTS (SELECT 1 FROM public.patient_representation_links WHERE profile_id = p_user_id)
  THEN
    RETURN true;
  END IF;

  IF p_role = 'pp' THEN
    SELECT id INTO v_prof_id FROM public.professionals WHERE user_id = p_user_id;
    IF v_prof_id IS NOT NULL THEN
      IF EXISTS (SELECT 1 FROM public.care_sessions WHERE professional_id = v_prof_id)
         OR EXISTS (SELECT 1 FROM public.care_cycles WHERE assigned_professional_id = v_prof_id)
         OR EXISTS (SELECT 1 FROM public.medical_records WHERE professional_id = v_prof_id)
         OR EXISTS (SELECT 1 FROM public.transfers WHERE professional_id = v_prof_id)
         OR EXISTS (SELECT 1 FROM public.professional_invoices WHERE professional_id = v_prof_id)
         OR EXISTS (SELECT 1 FROM public.attendance_sheets WHERE professional_id = v_prof_id)
         OR EXISTS (SELECT 1 FROM public.contracts WHERE professional_id = v_prof_id)
         OR EXISTS (SELECT 1 FROM public.initial_assessments WHERE evaluator_professional_id = v_prof_id)
      THEN
        RETURN true;
      END IF;
    END IF;
  ELSIF p_role = 'paciente' THEN
    SELECT array_agg(patient_id) INTO v_patient_ids
    FROM public.patient_responsibles WHERE user_id = p_user_id;

    IF v_patient_ids IS NOT NULL AND array_length(v_patient_ids, 1) > 0 THEN
      IF EXISTS (SELECT 1 FROM public.care_cycles WHERE patient_id = ANY(v_patient_ids))
         OR EXISTS (SELECT 1 FROM public.charges WHERE patient_id = ANY(v_patient_ids))
         OR EXISTS (SELECT 1 FROM public.medical_records WHERE patient_id = ANY(v_patient_ids))
         OR EXISTS (SELECT 1 FROM public.attendance_sheets WHERE patient_id = ANY(v_patient_ids))
         OR EXISTS (SELECT 1 FROM public.initial_assessments WHERE patient_id = ANY(v_patient_ids))
         OR EXISTS (SELECT 1 FROM public.scheduling_proposals WHERE patient_id = ANY(v_patient_ids))
         OR EXISTS (SELECT 1 FROM public.asaas_customers WHERE patient_id = ANY(v_patient_ids))
      THEN
        RETURN true;
      END IF;
    END IF;
  END IF;

  RETURN false;
END;
$$;

-- =========================================================================
-- 8. Processador server-side (idempotente) — roda via pg_cron
-- =========================================================================
CREATE OR REPLACE FUNCTION public.process_account_deletions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.account_deletion_requests;
  v_role public.user_role;
  v_prof_id uuid;
  v_patient_ids uuid[];
  v_retained boolean;
  v_count integer := 0;
BEGIN
  FOR r IN
    SELECT *
    FROM public.account_deletion_requests
    WHERE status = 'pending' AND scheduled_deletion_at <= now()
    FOR UPDATE SKIP LOCKED
  LOOP
    BEGIN
      -- Defesa: se houve login após a solicitação, cancela em vez de excluir
      IF EXISTS (
        SELECT 1 FROM auth.users u
        WHERE u.id = r.user_id
          AND u.last_sign_in_at IS NOT NULL
          AND u.last_sign_in_at > r.requested_at
      ) THEN
        UPDATE public.account_deletion_requests
        SET status = 'cancelled', cancelled_at = now(), cancellation_reason = 'user_login'
        WHERE id = r.id;
        CONTINUE;
      END IF;

      SELECT primary_role INTO v_role FROM public.profiles WHERE id = r.user_id;

      v_retained := public.account_has_retained_records(r.user_id, v_role);

      -- (A) Dados pessoais sem retenção -> DELETE
      DELETE FROM public.notifications WHERE user_id = r.user_id;
      DELETE FROM public.support_tickets WHERE user_id = r.user_id;
      DELETE FROM public.patient_chat_threads WHERE user_id = r.user_id; -- cascade nas mensagens

      -- (B) Anonimização de identidade por papel
      IF v_role = 'pp' THEN
        SELECT id INTO v_prof_id FROM public.professionals WHERE user_id = r.user_id;
        IF v_prof_id IS NOT NULL THEN
          DELETE FROM public.professional_bank_accounts WHERE professional_id = v_prof_id;
          UPDATE public.professionals SET
            full_name = 'Conta excluída',
            cpf_cnpj = NULL,
            email = concat('deleted-', r.user_id::text, '@deleted.invalid'),
            phone = NULL,
            address = NULL,
            birth_date = NULL,
            specialty = NULL,
            referral_source = NULL,
            is_active = false
          WHERE id = v_prof_id;
        END IF;
      ELSIF v_role = 'paciente' THEN
        UPDATE public.patient_responsibles SET
          full_name = 'Conta excluída',
          cpf = NULL,
          phone = NULL,
          email = NULL,
          backup_phone = NULL
        WHERE user_id = r.user_id;
      END IF;

      -- Anonimização do profile
      UPDATE public.profiles SET
        email = concat('deleted-', r.user_id::text, '@deleted.invalid'),
        full_name = NULL,
        avatar_url = NULL,
        is_active = false
      WHERE id = r.user_id;

      -- Auditoria (sem actor, para sobreviver ao hard delete)
      INSERT INTO public.audit_logs (entity_type, entity_id, action, new_values)
      VALUES ('account_deletion_request', r.id, 'processed',
              jsonb_build_object('role', v_role, 'retained', v_retained));

      IF v_retained THEN
        -- Mantém registros retidos; desabilita login (data futura distante;
        -- evita 'infinity', que o GoTrue não consegue desserializar).
        UPDATE auth.users SET banned_until = now() + interval '100 years' WHERE id = r.user_id;

        UPDATE public.account_deletion_requests SET
          status = 'processed', processed_at = now(),
          processing_outcome = 'anonymized',
          processing_notes = 'Dados pessoais anonimizados e login desabilitado. Registros clínicos/financeiros/legais retidos por obrigação.'
        WHERE id = r.id;
      ELSE
        -- Sem footprint retido -> exclusão definitiva segura
        IF v_role = 'paciente' THEN
          SELECT array_agg(patient_id) INTO v_patient_ids
          FROM public.patient_responsibles WHERE user_id = r.user_id;
          IF v_patient_ids IS NOT NULL AND array_length(v_patient_ids, 1) > 0 THEN
            DELETE FROM public.patient_addresses WHERE patient_id = ANY(v_patient_ids);
            DELETE FROM public.patients WHERE id = ANY(v_patient_ids); -- cascade responsibles/etc
          END IF;
        ELSIF v_role = 'pp' AND v_prof_id IS NOT NULL THEN
          DELETE FROM public.professionals WHERE id = v_prof_id; -- cascade councils/docs/etc
        END IF;

        UPDATE public.account_deletion_requests SET
          status = 'processed', processed_at = now(),
          processing_outcome = 'deleted',
          processing_notes = 'Conta sem registros retidos: exclusão definitiva.'
        WHERE id = r.id;

        -- Hard delete do usuário Auth (cascade limpa profile e dados pessoais restantes)
        DELETE FROM auth.users WHERE id = r.user_id;
      END IF;

      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      UPDATE public.account_deletion_requests
      SET status = 'failed', processing_notes = left(SQLERRM, 500)
      WHERE id = r.id;
    END;
  END LOOP;

  RETURN v_count;
END;
$$;

-- =========================================================================
-- 9. Grants
-- =========================================================================
GRANT EXECUTE ON FUNCTION public.request_account_deletion() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_account_deletion() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_account_deletion_on_login() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_account_deletion_status() TO authenticated;

REVOKE ALL ON FUNCTION public.account_has_retained_records(uuid, public.user_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_account_deletions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_account_deletions() TO postgres, service_role;

-- =========================================================================
-- 10. Agendamento diário (pg_cron) — 03:15 UTC
-- =========================================================================
DO $$
DECLARE
  v_job_id bigint;
BEGIN
  SELECT jobid INTO v_job_id FROM cron.job WHERE jobname = 'process_account_deletions';
  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
  END IF;

  PERFORM cron.schedule(
    'process_account_deletions',
    '15 3 * * *',
    $cmd$SELECT public.process_account_deletions();$cmd$
  );
END;
$$;

COMMENT ON FUNCTION public.process_account_deletions() IS
  'Agendado via pg_cron (process_account_deletions) diariamente às 03:15. Processa exclusões maduras (30 dias).';
COMMENT ON TABLE public.account_deletion_requests IS
  'Solicitações de exclusão de conta com carência de 30 dias (paciente/pp). Escrita via RPCs SECURITY DEFINER.';
