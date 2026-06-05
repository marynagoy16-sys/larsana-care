-- LarsanaCare: demands and matching
-- Migration: 20260605101200_demands_matching

CREATE TABLE public.demands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  address_id uuid REFERENCES public.patient_addresses (id) ON DELETE SET NULL,
  required_profession public.profession_type NOT NULL DEFAULT 'FISIO',
  region_id uuid REFERENCES public.regions (id) ON DELETE SET NULL,
  status public.demand_status NOT NULL DEFAULT 'aberta',
  assigned_professional_id uuid REFERENCES public.professionals (id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_demands_status ON public.demands (status);
CREATE INDEX idx_demands_region ON public.demands (region_id);

CREATE TABLE public.demand_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id uuid NOT NULL REFERENCES public.demands (id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.professionals (id) ON DELETE CASCADE,
  response public.demand_response_type NOT NULL,
  decline_reason text,
  responded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (demand_id, professional_id)
);

CREATE INDEX idx_demand_responses_pp ON public.demand_responses (professional_id);

CREATE TABLE public.professional_weekly_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals (id) ON DELETE CASCADE,
  week_start date NOT NULL,
  total_hours numeric(5, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (professional_id, week_start)
);

CREATE INDEX idx_weekly_hours_pp ON public.professional_weekly_hours (professional_id, week_start);
