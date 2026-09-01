-- Paciente pode escolher PIX ou boleto antes de sincronizar cobrança pendente.

CREATE OR REPLACE FUNCTION public.patient_update_charge_payment_method(
  p_charge_id uuid,
  p_payment_method public.payment_method
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_charge public.charges%ROWTYPE;
BEGIN
  IF public.current_user_role() <> 'paciente'::public.user_role AND NOT public.is_staff() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT * INTO v_charge FROM public.charges WHERE id = p_charge_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cobrança não encontrada';
  END IF;

  IF NOT (v_charge.patient_id = ANY (public.current_patient_ids())) AND NOT public.is_staff() THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  IF v_charge.payment_status <> 'pendente' THEN
    RAISE EXCEPTION 'Cobrança não pode ser alterada no status atual';
  END IF;

  IF p_payment_method NOT IN ('PIX'::public.payment_method, 'BOLETO'::public.payment_method) THEN
    RAISE EXCEPTION 'Forma de pagamento inválida';
  END IF;

  UPDATE public.charges
  SET
    payment_method = p_payment_method,
    asaas_payment_id = NULL,
    pix_qr_code = NULL,
    pix_copy_paste = NULL,
    boleto_url = NULL,
    updated_at = now()
  WHERE id = p_charge_id;

  RETURN jsonb_build_object(
    'charge_id', p_charge_id,
    'payment_method', p_payment_method
  );
END;
$$;

REVOKE ALL ON FUNCTION public.patient_update_charge_payment_method(uuid, public.payment_method) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.patient_update_charge_payment_method(uuid, public.payment_method) TO authenticated;
