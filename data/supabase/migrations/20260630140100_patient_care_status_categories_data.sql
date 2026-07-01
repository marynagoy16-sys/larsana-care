-- LarsanaCare: dados e funções após novos valores de patient_care_status
-- Migration: 20260630140100_patient_care_status_categories_data

UPDATE public.patients
SET care_status = 'PAUSA_JUSTIFICADA'
WHERE care_status = 'PAUSA';

CREATE OR REPLACE VIEW public.dashboard_kpis
WITH (security_invoker = true)
AS
SELECT
  (SELECT count(*) FROM public.patients WHERE care_status = 'ATIVO') AS pacientes_ativos,
  (SELECT count(*) FROM public.patients
   WHERE care_status IN ('PAUSA', 'PAUSA_JUSTIFICADA', 'PAUSA_SOLICITADA_PACIENTE')) AS pacientes_pausa,
  (SELECT count(*) FROM public.care_cycles WHERE status = 'ativo') AS ciclos_abertos,
  (SELECT count(*) FROM public.charges WHERE payment_status = 'pendente') AS pagamentos_pendentes,
  (SELECT count(*) FROM public.charges WHERE payment_status = 'vencido') AS pagamentos_vencidos,
  (SELECT count(*) FROM public.transfer_queue WHERE status IN ('aguardando_nf', 'aguardando_validacao')) AS repasses_a_liberar,
  (SELECT count(*) FROM public.initial_assessments WHERE status IN ('proposta_enviada', 'em_analise')) AS avaliacoes_em_analise,
  (SELECT count(*) FROM public.operational_alerts WHERE resolved_at IS NULL) AS alertas_abertos;

CREATE OR REPLACE FUNCTION public.initiate_pause(
  p_cycle_id uuid,
  p_pause_type public.pause_type,
  p_justification text DEFAULT NULL,
  p_admin_decision text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle public.care_cycles%ROWTYPE;
  v_pause_id uuid;
  v_treatment_pause_id uuid;
  v_new_status public.cycle_status;
  v_patient_care_status public.patient_care_status;
BEGIN
  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = p_cycle_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ciclo não encontrado';
  END IF;

  IF v_cycle.status IN ('fechado_financeiramente', 'cancelado', 'encerrado') THEN
    RAISE EXCEPTION 'Ciclo já encerrado ou fechado financeiramente';
  END IF;

  v_new_status := CASE
    WHEN p_pause_type IN ('justified', 'professional_or_operation_issue') THEN 'em_analise'::public.cycle_status
    WHEN p_pause_type = 'unjustified' THEN 'em_pausa'::public.cycle_status
    ELSE 'em_pausa'::public.cycle_status
  END;

  v_patient_care_status := CASE
    WHEN p_pause_type = 'unjustified' THEN 'PAUSA_SOLICITADA_PACIENTE'::public.patient_care_status
    ELSE 'PAUSA_JUSTIFICADA'::public.patient_care_status
  END;

  INSERT INTO public.treatment_pauses (patient_id, reason, created_by)
  VALUES (v_cycle.patient_id, p_justification, auth.uid())
  RETURNING id INTO v_treatment_pause_id;

  INSERT INTO public.pause_events (
    cycle_id,
    patient_id,
    treatment_pause_id,
    pause_type,
    justification,
    admin_decision,
    initiated_by
  ) VALUES (
    p_cycle_id,
    v_cycle.patient_id,
    v_treatment_pause_id,
    p_pause_type,
    p_justification,
    p_admin_decision,
    auth.uid()
  )
  RETURNING id INTO v_pause_id;

  UPDATE public.care_cycles
  SET
    status = v_new_status,
    active_pause_id = v_pause_id,
    updated_at = now()
  WHERE id = p_cycle_id;

  UPDATE public.patients
  SET care_status = v_patient_care_status, updated_at = now()
  WHERE id = v_cycle.patient_id;

  RETURN v_pause_id;
END;
$$;
