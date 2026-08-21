-- Validação de NF, repasse avaliação R$50 e simulação de wallet (dev/E2E)
-- Migration: 20260821150000_transfer_validation_and_assessment_repasse

-- ===== assessment PP repasse (R$50 da taxa de avaliação) =====
CREATE TABLE IF NOT EXISTS public.assessment_pp_repasses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  charge_id uuid NOT NULL UNIQUE REFERENCES public.charges (id) ON DELETE RESTRICT,
  demand_id uuid REFERENCES public.demands (id) ON DELETE SET NULL,
  professional_id uuid NOT NULL REFERENCES public.professionals (id) ON DELETE RESTRICT,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  status public.transfer_status NOT NULL DEFAULT 'liberado',
  asaas_transfer_id text,
  transferred_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessment_pp_repasses_professional
  ON public.assessment_pp_repasses (professional_id);
CREATE INDEX IF NOT EXISTS idx_assessment_pp_repasses_status
  ON public.assessment_pp_repasses (status);

ALTER TABLE public.assessment_pp_repasses ENABLE ROW LEVEL SECURITY;

CREATE POLICY assessment_pp_repasses_staff ON public.assessment_pp_repasses
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'financeiro']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'financeiro']::public.user_role[]));

CREATE POLICY assessment_pp_repasses_gestao_read ON public.assessment_pp_repasses
  FOR SELECT TO authenticated
  USING (public.is_staff_role(ARRAY['gestao']::public.user_role[]));

CREATE POLICY assessment_pp_repasses_pp_read ON public.assessment_pp_repasses
  FOR SELECT TO authenticated
  USING (professional_id = public.current_professional_id());

CREATE OR REPLACE FUNCTION public.ensure_assessment_pp_repasse(
  p_demand_id uuid,
  p_professional_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_demand public.demands%ROWTYPE;
  v_charge_id uuid;
  v_amount integer;
  v_existing uuid;
  v_new_id uuid;
BEGIN
  SELECT * INTO v_demand FROM public.demands WHERE id = p_demand_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF NOT public.patient_has_paid_assessment_fee(v_demand.patient_id) THEN
    RETURN NULL;
  END IF;

  SELECT c.id INTO v_charge_id
  FROM public.charges c
  WHERE c.patient_id = v_demand.patient_id
    AND c.charge_kind = 'assessment_request'
    AND c.payment_status = 'pago'
  ORDER BY c.paid_at DESC NULLS LAST, c.created_at DESC
  LIMIT 1;

  IF v_charge_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_existing FROM public.assessment_pp_repasses WHERE charge_id = v_charge_id;
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  SELECT assessment_pp_share_cents INTO v_amount FROM public.get_platform_settings();

  INSERT INTO public.assessment_pp_repasses (
    charge_id, demand_id, professional_id, amount_cents, status
  ) VALUES (
    v_charge_id, p_demand_id, p_professional_id, v_amount, 'liberado'
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_assessment_pp_repasse(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_assessment_pp_repasse(uuid, uuid) TO authenticated;

-- Hook repasse avaliação ao aceitar demanda
CREATE OR REPLACE FUNCTION public.accept_demand(p_demand_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pp_id uuid;
  v_demand public.demands%ROWTYPE;
  v_patient_name text;
  v_assessment_repasse_id uuid;
BEGIN
  v_pp_id := public.current_professional_id();
  IF v_pp_id IS NULL THEN
    RAISE EXCEPTION 'Profissional não encontrado';
  END IF;

  IF NOT public.pp_is_operational_regular(v_pp_id) THEN
    RAISE EXCEPTION 'Credenciamento inativo ou incompleto';
  END IF;

  IF NOT public.pp_can_see_demand(v_pp_id, p_demand_id) THEN
    RAISE EXCEPTION 'Você não está habilitado para demandas Cardiorrespiratórias';
  END IF;

  SELECT * INTO v_demand
  FROM public.demands
  WHERE id = p_demand_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demanda não encontrada';
  END IF;

  IF v_demand.status <> 'aberta' THEN
    RAISE EXCEPTION 'Demanda não está aberta';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.demand_responses dr
    WHERE dr.demand_id = p_demand_id
      AND dr.professional_id = v_pp_id
      AND dr.response = 'accepted'
  ) THEN
    IF v_demand.status = 'alocada' AND v_demand.assigned_professional_id = v_pp_id THEN
      RETURN jsonb_build_object(
        'demand_id', p_demand_id,
        'patient_id', v_demand.patient_id,
        'demand_type', v_demand.demand_type
      );
    END IF;

    UPDATE public.demands
    SET status = 'alocada', assigned_professional_id = v_pp_id, updated_at = now()
    WHERE id = p_demand_id;

    UPDATE public.patients
    SET allocated_professional_id = v_pp_id, updated_at = now()
    WHERE id = v_demand.patient_id;

    v_assessment_repasse_id := public.ensure_assessment_pp_repasse(p_demand_id, v_pp_id);

    RETURN jsonb_build_object(
      'demand_id', p_demand_id,
      'patient_id', v_demand.patient_id,
      'demand_type', v_demand.demand_type,
      'assessment_repasse_id', v_assessment_repasse_id
    );
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.demand_responses dr
    WHERE dr.demand_id = p_demand_id AND dr.professional_id = v_pp_id
  ) THEN
    RAISE EXCEPTION 'Você já respondeu esta demanda';
  END IF;

  INSERT INTO public.demand_responses (demand_id, professional_id, response)
  VALUES (p_demand_id, v_pp_id, 'accepted');

  UPDATE public.demands
  SET status = 'alocada', assigned_professional_id = v_pp_id, updated_at = now()
  WHERE id = p_demand_id;

  UPDATE public.patients
  SET allocated_professional_id = v_pp_id, updated_at = now()
  WHERE id = v_demand.patient_id;

  v_assessment_repasse_id := public.ensure_assessment_pp_repasse(p_demand_id, v_pp_id);

  SELECT p.full_name INTO v_patient_name FROM public.patients p WHERE p.id = v_demand.patient_id;

  INSERT INTO public.operational_alerts (
    alert_type, entity_type, entity_id, severity, title, message
  ) VALUES (
    'demanda_alocada', 'demand', p_demand_id, 'info',
    'Demanda alocada a profissional',
    coalesce(v_patient_name, 'Paciente') || ' — demanda assumida pelo profissional parceiro.'
  );

  RETURN jsonb_build_object(
    'demand_id', p_demand_id,
    'patient_id', v_demand.patient_id,
    'demand_type', v_demand.demand_type,
    'assessment_repasse_id', v_assessment_repasse_id
  );
END;
$$;

-- ===== staff validate / reject cycle transfer NF =====
CREATE OR REPLACE FUNCTION public.staff_validate_transfer_invoice(p_transfer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transfer public.transfers%ROWTYPE;
BEGIN
  IF NOT public.is_staff_role(ARRAY['admin', 'financeiro']::public.user_role[]) THEN
    RAISE EXCEPTION 'Sem permissão para validar repasse';
  END IF;

  SELECT * INTO v_transfer FROM public.transfers WHERE id = p_transfer_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Repasse não encontrado'; END IF;

  IF v_transfer.status <> 'aguardando_validacao'::public.transfer_status THEN
    RAISE EXCEPTION 'Repasse não está aguardando validação da NF';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.professional_invoices pi WHERE pi.transfer_id = p_transfer_id
  ) THEN
    RAISE EXCEPTION 'Nota fiscal não encontrada para este repasse';
  END IF;

  UPDATE public.transfers
  SET
    status = 'liberado'::public.transfer_status,
    validated_by = auth.uid(),
    validated_at = now(),
    updated_at = now()
  WHERE id = p_transfer_id;

  UPDATE public.transfer_queue
  SET status = 'liberado'::public.transfer_status, released_at = now()
  WHERE cycle_id = v_transfer.cycle_id;

  RETURN jsonb_build_object(
    'transfer_id', p_transfer_id,
    'status', 'liberado'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_reject_transfer_invoice(
  p_transfer_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transfer public.transfers%ROWTYPE;
BEGIN
  IF NOT public.is_staff_role(ARRAY['admin', 'financeiro']::public.user_role[]) THEN
    RAISE EXCEPTION 'Sem permissão para rejeitar repasse';
  END IF;

  SELECT * INTO v_transfer FROM public.transfers WHERE id = p_transfer_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Repasse não encontrado'; END IF;

  IF v_transfer.status <> 'aguardando_validacao'::public.transfer_status THEN
    RAISE EXCEPTION 'Repasse não está aguardando validação da NF';
  END IF;

  DELETE FROM public.professional_invoices WHERE transfer_id = p_transfer_id;

  UPDATE public.transfers
  SET status = 'aguardando_nf'::public.transfer_status, updated_at = now()
  WHERE id = p_transfer_id;

  UPDATE public.transfer_queue
  SET status = 'aguardando_nf'::public.transfer_status
  WHERE cycle_id = v_transfer.cycle_id;

  RETURN jsonb_build_object(
    'transfer_id', p_transfer_id,
    'status', 'aguardando_nf',
    'notes', p_notes
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.staff_validate_transfer_invoice(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_reject_transfer_invoice(uuid, text) TO authenticated;

-- ===== simulate wallet transfer (dev/E2E quando Asaas indisponível) =====
CREATE OR REPLACE FUNCTION public.simulate_transfer_wallet(p_transfer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transfer public.transfers%ROWTYPE;
BEGIN
  IF NOT public.is_staff_role(ARRAY['admin', 'financeiro']::public.user_role[]) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  SELECT * INTO v_transfer FROM public.transfers WHERE id = p_transfer_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Repasse não encontrado'; END IF;

  IF v_transfer.status = 'transferido'::public.transfer_status THEN
    RETURN jsonb_build_object('transfer_id', p_transfer_id, 'status', 'transferido', 'already_transferred', true);
  END IF;

  IF v_transfer.status <> 'liberado'::public.transfer_status THEN
    RAISE EXCEPTION 'Repasse precisa estar liberado (status liberado)';
  END IF;

  UPDATE public.transfers
  SET
    status = 'transferido'::public.transfer_status,
    asaas_transfer_id = coalesce(asaas_transfer_id, 'sim-' || p_transfer_id::text),
    transferred_at = now(),
    updated_at = now()
  WHERE id = p_transfer_id;

  UPDATE public.transfer_queue
  SET status = 'transferido'::public.transfer_status
  WHERE cycle_id = v_transfer.cycle_id;

  RETURN jsonb_build_object(
    'transfer_id', p_transfer_id,
    'status', 'transferido',
    'simulated', true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.simulate_assessment_repasse_wallet(p_repasse_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.assessment_pp_repasses%ROWTYPE;
BEGIN
  IF NOT public.is_staff_role(ARRAY['admin', 'financeiro']::public.user_role[]) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  SELECT * INTO v_row FROM public.assessment_pp_repasses WHERE id = p_repasse_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Repasse de avaliação não encontrado'; END IF;

  IF v_row.status = 'transferido'::public.transfer_status THEN
    RETURN jsonb_build_object('repasse_id', p_repasse_id, 'status', 'transferido', 'already_transferred', true);
  END IF;

  IF v_row.status <> 'liberado'::public.transfer_status THEN
    RAISE EXCEPTION 'Repasse de avaliação precisa estar liberado';
  END IF;

  UPDATE public.assessment_pp_repasses
  SET
    status = 'transferido'::public.transfer_status,
    asaas_transfer_id = coalesce(asaas_transfer_id, 'sim-assessment-' || p_repasse_id::text),
    transferred_at = now(),
    updated_at = now()
  WHERE id = p_repasse_id;

  RETURN jsonb_build_object(
    'repasse_id', p_repasse_id,
    'status', 'transferido',
    'simulated', true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.simulate_transfer_wallet(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.simulate_assessment_repasse_wallet(uuid) TO authenticated;
