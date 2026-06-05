-- LarsanaCare: RBAC views (hide sensitive columns from PP/paciente)
-- Migration: 20260605101400_views_rbac

CREATE OR REPLACE VIEW public.transfers_pp
WITH (security_invoker = true)
AS
SELECT
  t.id,
  t.cycle_id,
  t.professional_id,
  t.pp_transfer_amount_cents,
  t.pp_class,
  t.commission_percent,
  t.first_month_retention_applied,
  t.status,
  t.asaas_transfer_id,
  t.transferred_at,
  t.created_at,
  t.updated_at
FROM public.transfers t;

CREATE OR REPLACE VIEW public.care_cycles_pp
WITH (security_invoker = true)
AS
SELECT
  c.id,
  c.patient_id,
  c.cycle_number,
  c.session_count,
  c.assigned_professional_id,
  c.region_id,
  c.patient_level,
  c.status,
  c.payment_status,
  c.is_first_month_capture,
  c.started_at,
  c.closed_at,
  c.created_at,
  c.updated_at
FROM public.care_cycles c;

CREATE OR REPLACE VIEW public.charges_patient
WITH (security_invoker = true)
AS
SELECT
  ch.id,
  ch.patient_id,
  ch.cycle_id,
  ch.assessment_id,
  ch.amount_cents,
  ch.payment_method,
  ch.payment_status,
  ch.due_date,
  ch.paid_at,
  ch.description,
  ch.receipt_storage_path,
  ch.pix_qr_code,
  ch.boleto_url,
  ch.created_at
FROM public.charges ch;

CREATE OR REPLACE VIEW public.patients_pp
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.full_name,
  p.birth_date,
  p.care_status,
  p.patient_level,
  p.region_id,
  p.city_id,
  p.allocated_professional_id,
  p.suggested_weekly_frequency,
  p.clinical_summary,
  p.last_session_at,
  p.created_at
FROM public.patients p;

CREATE OR REPLACE VIEW public.dashboard_kpis
WITH (security_invoker = true)
AS
SELECT
  (SELECT count(*) FROM public.patients WHERE care_status = 'ATIVO') AS pacientes_ativos,
  (SELECT count(*) FROM public.patients WHERE care_status = 'PAUSA') AS pacientes_pausa,
  (SELECT count(*) FROM public.care_cycles WHERE status = 'ativo') AS ciclos_abertos,
  (SELECT count(*) FROM public.charges WHERE payment_status = 'pendente') AS pagamentos_pendentes,
  (SELECT count(*) FROM public.charges WHERE payment_status = 'vencido') AS pagamentos_vencidos,
  (SELECT count(*) FROM public.transfer_queue WHERE status IN ('aguardando_nf', 'aguardando_validacao')) AS repasses_a_liberar,
  (SELECT count(*) FROM public.initial_assessments WHERE status IN ('proposta_enviada', 'em_analise')) AS avaliacoes_em_analise,
  (SELECT count(*) FROM public.operational_alerts WHERE resolved_at IS NULL) AS alertas_abertos;
