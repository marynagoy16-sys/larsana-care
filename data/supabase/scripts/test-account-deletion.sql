-- =====================================================================
-- Testes do fluxo de exclusão de conta (30 dias)
-- Migration alvo: 20260916000000_account_deletion_flow.sql
--
-- SEGURO: roda inteiramente dentro de uma transação com ROLLBACK no final,
-- portanto NÃO persiste nada. Recomendado rodar em STAGING.
--
-- Uso:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f test-account-deletion.sql
--
-- Cobre: A (paciente solicita), B (pp solicita), C (+30 dias),
--        D (cancelamento manual), E (re-solicitação reinicia prazo),
--        F/G (login cancela + reason=user_login), H (processor deleta sem footprint),
--        I (usuário não opera solicitação de outro), J (retenção não é apagada).
-- =====================================================================

BEGIN;

-- Helper local: simula o usuário autenticado (auth.uid())
CREATE OR REPLACE FUNCTION pg_temp.act_as(p_uid uuid) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', p_uid)::text, true);
END; $$;

-- Cria um usuário auth de teste (dispara handle_new_user -> profile + bootstrap)
CREATE OR REPLACE FUNCTION pg_temp.make_user(p_email text, p_role text) RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE v_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    p_email, NULL,
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    json_build_object('primary_role', p_role, 'full_name', 'Teste ' || p_role)::jsonb
  );
  RETURN v_id;
END; $$;

DO $$
DECLARE
  v_pac uuid;
  v_pac2 uuid;
  v_pp uuid;
  v_res jsonb;
  v_sched timestamptz;
  v_sched2 timestamptz;
  v_patient_id uuid;
  v_charge_exists boolean;
  v_banned timestamptz;
BEGIN
  -- ---- setup ----
  v_pac  := pg_temp.make_user('teste-paciente-del@example.com', 'paciente');
  v_pac2 := pg_temp.make_user('teste-paciente2-del@example.com', 'paciente');
  v_pp   := pg_temp.make_user('teste-pp-del@example.com', 'pp');

  -- =========================================================
  -- A + C: paciente solicita, prazo = +30 dias
  -- =========================================================
  PERFORM pg_temp.act_as(v_pac);
  v_res := public.request_account_deletion();
  ASSERT v_res->>'status' = 'pending', 'A: status deveria ser pending';
  v_sched := (v_res->>'scheduled_deletion_at')::timestamptz;
  ASSERT v_sched::date = (now() + interval '30 days')::date, 'C: prazo deveria ser +30 dias';
  RAISE NOTICE 'OK A+C: paciente solicitou, agendado para %', v_sched;

  -- =========================================================
  -- B: PP solicita
  -- =========================================================
  PERFORM pg_temp.act_as(v_pp);
  v_res := public.request_account_deletion();
  ASSERT v_res->>'status' = 'pending', 'B: PP deveria conseguir solicitar';
  RAISE NOTICE 'OK B: PP solicitou';

  -- =========================================================
  -- D: cancelamento manual (reason = user_request)
  -- =========================================================
  PERFORM pg_temp.act_as(v_pac);
  v_res := public.cancel_account_deletion();
  ASSERT (v_res->>'cancelled')::boolean = true, 'D: cancelamento manual deveria funcionar';
  ASSERT EXISTS (
    SELECT 1 FROM public.account_deletion_requests
    WHERE user_id = v_pac AND status = 'cancelled' AND cancellation_reason = 'user_request'
  ), 'D: reason deveria ser user_request';
  RAISE NOTICE 'OK D: cancelamento manual';

  -- =========================================================
  -- E: re-solicitação reinicia o prazo (nova linha pending)
  -- =========================================================
  v_res := public.request_account_deletion();
  v_sched2 := (v_res->>'scheduled_deletion_at')::timestamptz;
  ASSERT v_res->>'status' = 'pending', 'E: nova solicitação deveria ficar pending';
  ASSERT (SELECT count(*) FROM public.account_deletion_requests WHERE user_id = v_pac) = 2,
    'E: deveria haver 2 solicitações (1 cancelada + 1 nova)';
  ASSERT (SELECT count(*) FROM public.account_deletion_requests WHERE user_id = v_pac AND status = 'pending') = 1,
    'E: apenas 1 pendente permitida';
  RAISE NOTICE 'OK E: re-solicitação reiniciou prazo para %', v_sched2;

  -- =========================================================
  -- F + G: login cancela automaticamente (reason = user_login)
  -- =========================================================
  v_res := public.cancel_account_deletion_on_login();
  ASSERT (v_res->>'cancelled')::boolean = true, 'F: login deveria cancelar';
  ASSERT EXISTS (
    SELECT 1 FROM public.account_deletion_requests
    WHERE user_id = v_pac AND status = 'cancelled' AND cancellation_reason = 'user_login'
  ), 'G: reason deveria ser user_login';
  RAISE NOTICE 'OK F+G: login cancelou automaticamente (user_login)';

  -- =========================================================
  -- I: usuário NÃO consegue cancelar solicitação de outro
  -- =========================================================
  -- paciente solicita novamente
  v_res := public.request_account_deletion();
  ASSERT v_res->>'status' = 'pending', 'I(setup): paciente deveria ter pending';
  -- outro usuário tenta cancelar -> não afeta a solicitação do primeiro
  PERFORM pg_temp.act_as(v_pac2);
  v_res := public.cancel_account_deletion();
  ASSERT (v_res->>'cancelled')::boolean = false, 'I: usuário2 não deveria cancelar nada';
  ASSERT EXISTS (
    SELECT 1 FROM public.account_deletion_requests
    WHERE user_id = v_pac AND status = 'pending'
  ), 'I: solicitação do paciente1 deveria continuar pendente';
  RAISE NOTICE 'OK I: isolamento entre usuários garantido';

  -- =========================================================
  -- H: processador exclui conta SEM footprint retido após 30 dias
  -- =========================================================
  -- força vencimento e garante que não houve login posterior
  UPDATE public.account_deletion_requests
    SET scheduled_deletion_at = now() - interval '1 day', requested_at = now() - interval '31 days'
    WHERE user_id = v_pac AND status = 'pending';
  UPDATE auth.users SET last_sign_in_at = NULL WHERE id = v_pac;

  PERFORM public.process_account_deletions();

  ASSERT NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_pac),
    'H: usuário sem footprint deveria ser hard-deletado do auth';
  ASSERT EXISTS (
    SELECT 1 FROM public.account_deletion_requests
    WHERE status = 'processed' AND processing_outcome = 'deleted' AND user_id IS NULL
  ), 'H: solicitação deveria ficar processed/deleted (user_id nulo)';
  RAISE NOTICE 'OK H: exclusão definitiva de conta sem footprint';

  -- =========================================================
  -- J: conta COM retenção obrigatória é anonimizada, não apagada
  -- =========================================================
  -- cria charge (financeiro/retido) para o PP? charge é do paciente.
  -- Usamos pac2 e um patient dele + uma charge.
  PERFORM pg_temp.act_as(v_pac2);
  v_res := public.request_account_deletion();
  ASSERT v_res->>'status' = 'pending', 'J(setup): pac2 pending';

  SELECT patient_id INTO v_patient_id
    FROM public.patient_responsibles WHERE user_id = v_pac2 LIMIT 1;
  ASSERT v_patient_id IS NOT NULL, 'J(setup): paciente bootstrap deveria existir';

  INSERT INTO public.charges (patient_id, amount_cents, due_date, payment_method, payment_status)
  VALUES (v_patient_id, 10000, current_date, 'PIX', 'pendente');

  UPDATE public.account_deletion_requests
    SET scheduled_deletion_at = now() - interval '1 day', requested_at = now() - interval '31 days'
    WHERE user_id = v_pac2 AND status = 'pending';
  UPDATE auth.users SET last_sign_in_at = NULL WHERE id = v_pac2;

  PERFORM public.process_account_deletions();

  -- charge (retido) permanece
  SELECT EXISTS(SELECT 1 FROM public.charges WHERE patient_id = v_patient_id) INTO v_charge_exists;
  ASSERT v_charge_exists, 'J: charge (retido) NÃO pode ser apagado';
  -- usuário auth permanece porém banido
  SELECT banned_until INTO v_banned FROM auth.users WHERE id = v_pac2;
  ASSERT v_banned IS NOT NULL, 'J: conta retida deveria ter login desabilitado (banned_until)';
  -- PII do profile anonimizada
  ASSERT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = v_pac2 AND full_name IS NULL AND email LIKE 'deleted-%@deleted.invalid'
  ), 'J: profile deveria estar anonimizado';
  ASSERT EXISTS (
    SELECT 1 FROM public.account_deletion_requests
    WHERE user_id = v_pac2 AND status = 'processed' AND processing_outcome = 'anonymized'
  ), 'J: outcome deveria ser anonymized';
  RAISE NOTICE 'OK J: retenção preservada + PII anonimizada + login desabilitado';

  RAISE NOTICE '==== TODOS OS TESTES A–J PASSARAM ====';
END $$;

ROLLBACK;
