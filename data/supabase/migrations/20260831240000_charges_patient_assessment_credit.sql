-- Expõe crédito da avaliação na view do paciente (detalhamento do pagamento do ciclo).

DROP VIEW IF EXISTS public.charges_patient;

CREATE VIEW public.charges_patient
WITH (security_invoker = true)
AS
SELECT
  ch.id,
  ch.patient_id,
  ch.cycle_id,
  ch.assessment_id,
  ch.amount_cents,
  ch.assessment_credit_cents,
  ch.charge_kind,
  ch.payment_method,
  ch.payment_status,
  ch.due_date,
  ch.paid_at,
  ch.description,
  ch.receipt_storage_path,
  ch.pix_qr_code,
  ch.boleto_url,
  ch.created_at,
  ch.asaas_payment_id,
  ch.pix_copy_paste
FROM public.charges ch;

GRANT SELECT ON public.charges_patient TO authenticated;
