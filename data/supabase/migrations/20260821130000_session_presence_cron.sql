-- Cron: lembretes de confirmação de presença (12h antes) + alerta PP
-- Executa a cada 15 minutos via pg_cron (Supabase)

DO $$
DECLARE
  v_job_id bigint;
BEGIN
  SELECT jobid INTO v_job_id
  FROM cron.job
  WHERE jobname = 'process_session_presence_reminders';

  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
  END IF;

  PERFORM cron.schedule(
    'process_session_presence_reminders',
    '*/15 * * * *',
    $cmd$SELECT public.process_session_presence_reminders();$cmd$
  );
END;
$$;

COMMENT ON FUNCTION public.process_session_presence_reminders() IS
  'Agendado via pg_cron (process_session_presence_reminders) a cada 15 min.';
