-- PP envia NF do repasse: registra arquivo e avança status para validação.

CREATE OR REPLACE FUNCTION public.submit_pp_transfer_invoice(
  p_transfer_id uuid,
  p_storage_path text,
  p_file_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_professional_id uuid;
  v_transfer public.transfers%ROWTYPE;
BEGIN
  v_professional_id := public.current_professional_id();
  IF v_professional_id IS NULL THEN
    RAISE EXCEPTION 'Profissional não identificado';
  END IF;

  SELECT * INTO v_transfer
  FROM public.transfers
  WHERE id = p_transfer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Repasse não encontrado';
  END IF;

  IF v_transfer.professional_id <> v_professional_id THEN
    RAISE EXCEPTION 'Repasse não pertence ao profissional';
  END IF;

  IF v_transfer.status <> 'aguardando_nf'::public.transfer_status THEN
    RAISE EXCEPTION 'Este repasse não está aguardando nota fiscal';
  END IF;

  IF p_storage_path IS NULL OR p_storage_path = '' THEN
    RAISE EXCEPTION 'Caminho do arquivo inválido';
  END IF;

  IF NOT p_storage_path LIKE v_professional_id::text || '/%' THEN
    RAISE EXCEPTION 'Caminho do arquivo inválido';
  END IF;

  INSERT INTO public.professional_invoices (
    transfer_id,
    cycle_id,
    professional_id,
    storage_path,
    file_name
  ) VALUES (
    p_transfer_id,
    v_transfer.cycle_id,
    v_professional_id,
    p_storage_path,
    NULLIF(trim(p_file_name), '')
  )
  ON CONFLICT (transfer_id) DO UPDATE SET
    storage_path = EXCLUDED.storage_path,
    file_name = EXCLUDED.file_name,
    uploaded_at = now();

  UPDATE public.transfers
  SET
    status = 'aguardando_validacao'::public.transfer_status,
    updated_at = now()
  WHERE id = p_transfer_id;

  UPDATE public.transfer_queue
  SET status = 'aguardando_validacao'::public.transfer_status
  WHERE cycle_id = v_transfer.cycle_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_pp_transfer_invoice(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_pp_transfer_invoice(uuid, text, text) TO authenticated;
