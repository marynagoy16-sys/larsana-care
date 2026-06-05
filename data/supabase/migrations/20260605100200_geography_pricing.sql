-- LarsanaCare: geography and pricing
-- Migration: 20260605100200_geography_pricing

CREATE TABLE public.regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code public.region_code NOT NULL UNIQUE,
  name text NOT NULL,
  cities_description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id uuid NOT NULL REFERENCES public.regions (id) ON DELETE RESTRICT,
  name text NOT NULL,
  state text NOT NULL DEFAULT 'SP',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (region_id, name)
);

CREATE INDEX idx_cities_region_id ON public.cities (region_id);
CREATE INDEX idx_cities_name ON public.cities (name);

CREATE TABLE public.neighborhoods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES public.cities (id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (city_id, name)
);

CREATE TABLE public.pricing_matrix_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_code text NOT NULL UNIQUE,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  is_active boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.pricing_matrix_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.pricing_matrix_versions (id) ON DELETE CASCADE,
  region_id uuid NOT NULL REFERENCES public.regions (id) ON DELETE RESTRICT,
  patient_level public.patient_level NOT NULL,
  session_price_cents integer NOT NULL CHECK (session_price_cents > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (version_id, region_id, patient_level),
  CONSTRAINT pricing_valor_social_check CHECK (
    patient_level != 'VALOR_SOCIAL' OR session_price_cents >= 0
  )
);

CREATE INDEX idx_pricing_entries_version ON public.pricing_matrix_entries (version_id);

CREATE TABLE public.commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.pricing_matrix_versions (id) ON DELETE CASCADE,
  pp_class public.pp_class NOT NULL,
  pp_percent numeric(5, 2) NOT NULL CHECK (pp_percent > 0 AND pp_percent <= 100),
  larsana_percent numeric(5, 2) NOT NULL CHECK (larsana_percent >= 0 AND larsana_percent <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (version_id, pp_class),
  CONSTRAINT commission_percent_sum CHECK (pp_percent + larsana_percent = 100)
);

CREATE TABLE public.first_month_retention_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.pricing_matrix_versions (id) ON DELETE CASCADE,
  larsana_percent numeric(5, 2) NOT NULL DEFAULT 40 CHECK (larsana_percent > 0 AND larsana_percent <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (version_id)
);
