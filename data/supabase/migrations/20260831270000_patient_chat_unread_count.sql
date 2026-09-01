-- Contagem de mensagens não lidas da Sara no chat do paciente.

ALTER TABLE public.patient_chat_threads
  ADD COLUMN IF NOT EXISTS last_read_at timestamptz;

COMMENT ON COLUMN public.patient_chat_threads.last_read_at IS
  'Momento em que o responsável abriu o chat pela última vez; mensagens da Sara após isso contam como não lidas.';

CREATE OR REPLACE FUNCTION public.patient_chat_unread_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(count(*)::integer, 0)
  FROM public.patient_chat_messages m
  INNER JOIN public.patient_chat_threads t ON t.id = m.thread_id
  WHERE t.user_id = auth.uid()
    AND m.sender_role = 'sara'
    AND m.created_at > coalesce(t.last_read_at, '-infinity'::timestamptz);
$$;

CREATE OR REPLACE FUNCTION public.patient_mark_chat_read(p_thread_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.patient_chat_threads t
  SET last_read_at = now(), updated_at = now()
  WHERE t.user_id = auth.uid()
    AND (p_thread_id IS NULL OR t.id = p_thread_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.patient_chat_unread_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.patient_mark_chat_read(uuid) TO authenticated;
