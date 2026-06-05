-- LarsanaCare: care cycles and sessions
-- Migration: 20260605100800_care_cycles_sessions

CREATE TABLE public.receipt_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  content_template text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.care_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE RESTRICT,
  cycle_number integer NOT NULL CHECK (cycle_number > 0),
  session_count integer NOT NULL CHECK (session_count IN (4, 8)),
  assigned_professional_id uuid NOT NULL REFERENCES public.professionals (id) ON DELETE RESTRICT,
  pricing_version_id uuid NOT NULL REFERENCES public.pricing_matrix_versions (id) ON DELETE RESTRICT,
  region_id uuid REFERENCES public.regions (id) ON DELETE SET NULL,
  patient_level public.patient_level NOT NULL,
  session_unit_price_cents integer NOT NULL CHECK (session_unit_price_cents >= 0),
  total_amount_cents integer NOT NULL CHECK (total_amount_cents >= 0),
  status public.cycle_status NOT NULL DEFAULT 'rascunho',
  payment_status public.payment_status NOT NULL DEFAULT 'pendente',
  is_first_month_capture boolean NOT NULL DEFAULT false,
  started_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (patient_id, cycle_number)
);

CREATE INDEX idx_care_cycles_patient ON public.care_cycles (patient_id);
CREATE INDEX idx_care_cycles_pp ON public.care_cycles (assigned_professional_id);
CREATE INDEX idx_care_cycles_status ON public.care_cycles (status);
CREATE INDEX idx_care_cycles_payment ON public.care_cycles (payment_status);

CREATE TABLE public.care_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.care_cycles (id) ON DELETE CASCADE,
  session_number integer NOT NULL CHECK (session_number > 0),
  scheduled_at timestamptz,
  status public.session_status NOT NULL DEFAULT 'prevista',
  professional_id uuid NOT NULL REFERENCES public.professionals (id) ON DELETE RESTRICT,
  is_assessment_session boolean NOT NULL DEFAULT false,
  intercorrencia_notes text,
  check_in_at timestamptz,
  check_out_at timestamptz,
  geo_lat numeric(10, 7),
  geo_lng numeric(10, 7),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cycle_id, session_number)
);

CREATE INDEX idx_care_sessions_cycle ON public.care_sessions (cycle_id);
CREATE INDEX idx_care_sessions_scheduled ON public.care_sessions (scheduled_at)
  WHERE status = 'prevista';
CREATE INDEX idx_care_sessions_professional ON public.care_sessions (professional_id);

CREATE TABLE public.treatment_pauses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  paused_at timestamptz NOT NULL DEFAULT now(),
  resumed_at timestamptz,
  reason text,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_treatment_pauses_patient ON public.treatment_pauses (patient_id);
