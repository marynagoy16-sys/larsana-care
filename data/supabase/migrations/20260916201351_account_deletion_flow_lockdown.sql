-- LarsanaCare: lockdown de EXECUTE do fluxo de exclusão de conta
-- Migration: 20260916201351_account_deletion_flow_lockdown
--
-- Motivo: os default privileges do Supabase concedem EXECUTE de funções novas do
-- schema public para anon/authenticated automaticamente. O `REVOKE ... FROM PUBLIC`
-- da migration anterior não remove essas concessões explícitas. Aqui revogamos as
-- funções internas (processador + helper) para que não sejam chamáveis pelo cliente
-- via PostgREST, e removemos o acesso anônimo das RPCs self-service (exigem auth.uid()).

REVOKE ALL ON FUNCTION public.process_account_deletions() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.account_has_retained_records(uuid, public.user_role) FROM anon, authenticated;

REVOKE ALL ON FUNCTION public.request_account_deletion() FROM anon;
REVOKE ALL ON FUNCTION public.cancel_account_deletion() FROM anon;
REVOKE ALL ON FUNCTION public.cancel_account_deletion_on_login() FROM anon;
REVOKE ALL ON FUNCTION public.get_account_deletion_status() FROM anon;
