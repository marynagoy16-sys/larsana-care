-- LarsanaCare: business functions and triggers
-- Migration: 20260605101500_functions_triggers

-- ===== updated_at helper =====
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles', 'staff_profiles', 'support_tickets', 'patients',
    'patient_responsibles', 'patient_addresses', 'professionals',
    'professional_bank_accounts', 'professional_business_cards',
    'contracts', 'initial_assessments', 'care_cycles', 'care_sessions',
    'medical_records', 'charges', 'transfers', 'demands',
    'professional_weekly_hours', 'lgpd_requests'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%I;
       CREATE TRIGGER trg_%s_updated_at
         BEFORE UPDATE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      t, t, t, t
    );
  END LOOP;
END;
$$;

-- ===== cycle total calculation (CIC-02) =====
CREATE OR REPLACE FUNCTION public.calculate_cycle_total()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.total_amount_cents := NEW.session_count * NEW.session_unit_price_cents;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_care_cycles_calculate_total
  BEFORE INSERT OR UPDATE OF session_count, session_unit_price_cents ON public.care_cycles
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_cycle_total();

-- ===== block cycle without acceptance (PAC-05) =====
CREATE OR REPLACE FUNCTION public.block_cycle_without_acceptance()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IN ('aguardando_pagamento', 'ativo') THEN
    IF NOT public.has_valid_acceptance(
      NEW.patient_id,
      ARRAY['TERMO_ADESAO', 'DIRETRIZES', 'LGPD']::public.legal_term_type[]
    ) THEN
      RAISE EXCEPTION 'Paciente sem aceite vigente dos termos obrigatórios';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_care_cycles_block_without_acceptance
  BEFORE INSERT OR UPDATE OF status ON public.care_cycles
  FOR EACH ROW
  EXECUTE FUNCTION public.block_cycle_without_acceptance();

-- ===== block session without payment (CIC-03) =====
CREATE OR REPLACE FUNCTION public.block_session_without_payment()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_payment_status public.payment_status;
BEGIN
  IF NEW.status = 'realizada' THEN
    SELECT c.payment_status INTO v_payment_status
    FROM public.care_cycles c
    WHERE c.id = NEW.cycle_id;

    IF v_payment_status IS DISTINCT FROM 'pago' THEN
      RAISE EXCEPTION 'Sessão não pode ser realizada sem pagamento confirmado do ciclo';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_care_sessions_block_without_payment
  BEFORE INSERT OR UPDATE OF status ON public.care_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.block_session_without_payment();

-- ===== assessment status history (AVL-08) =====
CREATE OR REPLACE FUNCTION public.log_assessment_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.assessment_status_history (
      assessment_id, from_status, to_status, changed_by
    ) VALUES (
      NEW.id, OLD.status, NEW.status, auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_assessment_status_history
  AFTER UPDATE OF status ON public.initial_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_assessment_status_change();

-- ===== on payment confirmed =====
CREATE OR REPLACE FUNCTION public.on_payment_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.payment_status = 'pago' AND OLD.payment_status IS DISTINCT FROM 'pago' THEN
    IF NEW.cycle_id IS NOT NULL THEN
      UPDATE public.care_cycles
      SET payment_status = 'pago',
          status = CASE WHEN status = 'aguardando_pagamento' THEN 'ativo' ELSE status END,
          started_at = COALESCE(started_at, now())
      WHERE id = NEW.cycle_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_charges_payment_confirmed
  AFTER UPDATE OF payment_status ON public.charges
  FOR EACH ROW
  EXECUTE FUNCTION public.on_payment_confirmed();

-- ===== on cycle closed -> transfer queue =====
CREATE OR REPLACE FUNCTION public.on_cycle_closed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_calc record;
BEGIN
  IF NEW.status = 'encerrado' AND OLD.status IS DISTINCT FROM 'encerrado' THEN
    SELECT * INTO v_calc FROM public.calculate_transfer_amount(NEW.id);

    INSERT INTO public.transfer_queue (cycle_id, professional_id, status)
    VALUES (NEW.id, NEW.assigned_professional_id, 'aguardando_nf')
    ON CONFLICT (cycle_id) DO NOTHING;

    INSERT INTO public.transfers (
      cycle_id,
      professional_id,
      patient_charged_amount_cents,
      pp_transfer_amount_cents,
      larsana_margin_cents,
      pp_class,
      commission_percent,
      first_month_retention_applied,
      status
    )
    SELECT
      NEW.id,
      NEW.assigned_professional_id,
      NEW.total_amount_cents,
      v_calc.pp_transfer_amount_cents,
      v_calc.larsana_margin_cents,
      p.pp_class,
      v_calc.commission_percent,
      v_calc.first_month_retention_applied,
      'aguardando_nf'::public.transfer_status
    FROM public.professionals p
    WHERE p.id = NEW.assigned_professional_id
    ON CONFLICT (cycle_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_care_cycles_closed
  AFTER UPDATE OF status ON public.care_cycles
  FOR EACH ROW
  EXECUTE FUNCTION public.on_cycle_closed();

-- ===== check prontuario 24h (callable by cron) =====
CREATE OR REPLACE FUNCTION public.check_prontuario_24h()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  v_session record;
BEGIN
  FOR v_session IN
    SELECT s.id, s.cycle_id, s.professional_id, c.patient_id
    FROM public.care_sessions s
    JOIN public.care_cycles c ON c.id = s.cycle_id
    WHERE s.status = 'realizada'
      AND s.updated_at < now() - interval '24 hours'
      AND NOT EXISTS (
        SELECT 1 FROM public.medical_records mr WHERE mr.session_id = s.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.operational_alerts oa
        WHERE oa.entity_type = 'care_session'
          AND oa.entity_id = s.id
          AND oa.alert_type = 'prontuario_incompleto_24h'
          AND oa.resolved_at IS NULL
      )
  LOOP
    INSERT INTO public.operational_alerts (
      alert_type, entity_type, entity_id, severity, title, message
    ) VALUES (
      'prontuario_incompleto_24h',
      'care_session',
      v_session.id,
      'critical',
      'Prontuário incompleto',
      'Sessão realizada sem evolução registrada em 24h'
    );
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.check_prontuario_24h IS
  'Executar via pg_cron ou Edge Function diariamente.';

-- ===== medical record access log =====
CREATE OR REPLACE FUNCTION public.audit_medical_record_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.medical_record_access_log (medical_record_id, accessed_by)
    VALUES (NEW.id, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

-- Log on read via RPC; for direct SELECT use application layer or:
CREATE OR REPLACE FUNCTION public.get_medical_record(p_record_id uuid)
RETURNS public.medical_records
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record public.medical_records;
BEGIN
  SELECT * INTO v_record FROM public.medical_records WHERE id = p_record_id;
  IF FOUND AND auth.uid() IS NOT NULL THEN
    INSERT INTO public.medical_record_access_log (medical_record_id, accessed_by)
    VALUES (p_record_id, auth.uid());
  END IF;
  RETURN v_record;
END;
$$;

-- ===== set medical record definitive deadline (7 business days approx) =====
CREATE OR REPLACE FUNCTION public.set_medical_record_deadline()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.definitive_deadline_at IS NULL THEN
    NEW.definitive_deadline_at := NEW.recorded_at + interval '7 days';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_medical_records_deadline
  BEFORE INSERT ON public.medical_records
  FOR EACH ROW
  EXECUTE FUNCTION public.set_medical_record_deadline();
