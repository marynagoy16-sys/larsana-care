-- LarsanaCare: transfers and repasses
-- Migration: 20260605101100_transfers_repasses

CREATE TABLE public.transfer_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL UNIQUE REFERENCES public.care_cycles (id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.professionals (id) ON DELETE RESTRICT,
  status public.transfer_status NOT NULL DEFAULT 'aguardando_nf',
  queued_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz
);

CREATE INDEX idx_transfer_queue_status ON public.transfer_queue (status)
  WHERE status IN ('aguardando_nf', 'aguardando_validacao');

CREATE TABLE public.transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL UNIQUE REFERENCES public.care_cycles (id) ON DELETE RESTRICT,
  professional_id uuid NOT NULL REFERENCES public.professionals (id) ON DELETE RESTRICT,
  patient_charged_amount_cents integer NOT NULL CHECK (patient_charged_amount_cents >= 0),
  pp_transfer_amount_cents integer NOT NULL CHECK (pp_transfer_amount_cents >= 0),
  larsana_margin_cents integer NOT NULL CHECK (larsana_margin_cents >= 0),
  pp_class public.pp_class NOT NULL,
  commission_percent numeric(5, 2) NOT NULL,
  first_month_retention_applied boolean NOT NULL DEFAULT false,
  status public.transfer_status NOT NULL DEFAULT 'aguardando_nf',
  asaas_transfer_id text,
  validated_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  validated_at timestamptz,
  transferred_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_transfers_professional ON public.transfers (professional_id);
CREATE INDEX idx_transfers_status ON public.transfers (status);

CREATE TABLE public.professional_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id uuid NOT NULL UNIQUE REFERENCES public.transfers (id) ON DELETE CASCADE,
  cycle_id uuid NOT NULL REFERENCES public.care_cycles (id) ON DELETE RESTRICT,
  professional_id uuid NOT NULL REFERENCES public.professionals (id) ON DELETE RESTRICT,
  storage_path text NOT NULL,
  file_name text,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.deluma_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_month date NOT NULL,
  file_path text,
  file_name text,
  generated_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_deluma_exports_month ON public.deluma_exports (reference_month);

CREATE OR REPLACE FUNCTION public.calculate_transfer_amount(p_cycle_id uuid)
RETURNS TABLE (
  pp_transfer_amount_cents integer,
  larsana_margin_cents integer,
  commission_percent numeric,
  first_month_retention_applied boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle public.care_cycles%ROWTYPE;
  v_pp public.professionals%ROWTYPE;
  v_pp_percent numeric;
  v_larsana_percent numeric;
  v_total integer;
  v_pp_amount integer;
BEGIN
  SELECT * INTO v_cycle FROM public.care_cycles WHERE id = p_cycle_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cycle not found: %', p_cycle_id;
  END IF;

  SELECT * INTO v_pp FROM public.professionals WHERE id = v_cycle.assigned_professional_id;
  v_total := v_cycle.total_amount_cents;

  IF v_cycle.is_first_month_capture THEN
    v_larsana_percent := 40;
    v_pp_percent := 60;
  ELSE
    SELECT cr.pp_percent, cr.larsana_percent
    INTO v_pp_percent, v_larsana_percent
    FROM public.commission_rules cr
    WHERE cr.version_id = v_cycle.pricing_version_id
      AND cr.pp_class = v_pp.pp_class;

    IF v_pp_percent IS NULL THEN
      v_pp_percent := CASE v_pp.pp_class
        WHEN 'BRONZE' THEN 70
        WHEN 'PRATA' THEN 75
        WHEN 'OURO' THEN 80
        ELSE 70
      END;
      v_larsana_percent := 100 - v_pp_percent;
    END IF;
  END IF;

  v_pp_amount := round(v_total * v_pp_percent / 100)::integer;

  RETURN QUERY SELECT
    v_pp_amount,
    v_total - v_pp_amount,
    v_pp_percent,
    v_cycle.is_first_month_capture;
END;
$$;
