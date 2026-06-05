-- LarsanaCare: catálogo SP (municípios e bairros) — populado via script, lido pelo admin
-- Migration: 20260606120000_sp_geography_catalog

CREATE TABLE public.sp_municipalities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ibge_code integer NOT NULL UNIQUE,
  name text NOT NULL,
  state text NOT NULL DEFAULT 'SP',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sp_municipalities_name ON public.sp_municipalities (name);

CREATE TABLE public.sp_neighborhoods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_id uuid NOT NULL REFERENCES public.sp_municipalities (id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (municipality_id, name)
);

CREATE INDEX idx_sp_neighborhoods_municipality ON public.sp_neighborhoods (municipality_id);
CREATE INDEX idx_sp_neighborhoods_name ON public.sp_neighborhoods (name);

ALTER TABLE public.cities
  ADD COLUMN IF NOT EXISTS sp_municipality_id uuid REFERENCES public.sp_municipalities (id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cities_sp_municipality
  ON public.cities (sp_municipality_id)
  WHERE sp_municipality_id IS NOT NULL;

ALTER TABLE public.neighborhoods
  ADD COLUMN IF NOT EXISTS sp_neighborhood_id uuid REFERENCES public.sp_neighborhoods (id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_neighborhoods_sp_ref
  ON public.neighborhoods (sp_neighborhood_id)
  WHERE sp_neighborhood_id IS NOT NULL;

ALTER TABLE public.sp_municipalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sp_neighborhoods ENABLE ROW LEVEL SECURITY;

CREATE POLICY sp_municipalities_read ON public.sp_municipalities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY sp_neighborhoods_read ON public.sp_neighborhoods
  FOR SELECT TO authenticated USING (true);
