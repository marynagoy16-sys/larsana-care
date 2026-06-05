-- LarsanaCare: financial and Asaas
-- Migration: 20260605101000_financial_asaas

CREATE TABLE public.asaas_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL UNIQUE REFERENCES public.patients (id) ON DELETE CASCADE,
  asaas_customer_id text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE RESTRICT,
  cycle_id uuid REFERENCES public.care_cycles (id) ON DELETE SET NULL,
  assessment_id uuid REFERENCES public.initial_assessments (id) ON DELETE SET NULL,
  asaas_payment_id text UNIQUE,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  payment_method public.payment_method,
  payment_status public.payment_status NOT NULL DEFAULT 'pendente',
  due_date date,
  paid_at timestamptz,
  description text,
  receipt_storage_path text,
  pix_qr_code text,
  boleto_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT charges_method_check CHECK (
    payment_method IS NULL OR payment_method IN ('PIX', 'BOLETO')
  )
);

CREATE INDEX idx_charges_patient ON public.charges (patient_id);
CREATE INDEX idx_charges_cycle ON public.charges (cycle_id);
CREATE INDEX idx_charges_status_due ON public.charges (payment_status, due_date);
CREATE INDEX idx_charges_asaas ON public.charges (asaas_payment_id);

ALTER TABLE public.assessment_charges
  ADD CONSTRAINT assessment_charges_charge_id_fkey
  FOREIGN KEY (charge_id) REFERENCES public.charges (id) ON DELETE SET NULL;

CREATE TABLE public.payment_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asaas_event_type text NOT NULL,
  asaas_payment_id text,
  asaas_transfer_id text,
  payload jsonb NOT NULL,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_payment ON public.payment_webhook_events (asaas_payment_id);
CREATE UNIQUE INDEX idx_webhook_idempotency ON public.payment_webhook_events (
  asaas_event_type,
  COALESCE(asaas_payment_id, ''),
  COALESCE(asaas_transfer_id, '')
) WHERE processed_at IS NOT NULL;

CREATE TABLE public.patient_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  charge_id uuid NOT NULL REFERENCES public.charges (id) ON DELETE CASCADE,
  cycle_id uuid REFERENCES public.care_cycles (id) ON DELETE SET NULL,
  storage_path text,
  template_id uuid REFERENCES public.receipt_templates (id) ON DELETE SET NULL,
  issued_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.attendance_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.care_cycles (id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.care_sessions (id) ON DELETE SET NULL,
  professional_id uuid NOT NULL REFERENCES public.professionals (id) ON DELETE RESTRICT,
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE RESTRICT,
  storage_path text,
  validated_at timestamptz,
  validated_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_attendance_sheets_cycle ON public.attendance_sheets (cycle_id);

CREATE TABLE public.internal_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_type text NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  reference_month date NOT NULL,
  notes text,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
