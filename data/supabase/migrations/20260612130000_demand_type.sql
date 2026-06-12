-- LarsanaCare: tipo de demanda (avaliacao vs continuidade)
-- Migration: 20260612130000_demand_type

DO $$
BEGIN
  CREATE TYPE public.demand_type AS ENUM (
    'avaliacao',
    'continuidade'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.demands
  ADD COLUMN IF NOT EXISTS demand_type public.demand_type NOT NULL DEFAULT 'avaliacao';

CREATE OR REPLACE FUNCTION public.resolve_demand_type(p_patient_id uuid)
RETURNS public.demand_type
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_patient public.patients%ROWTYPE;
BEGIN
  SELECT * INTO v_patient FROM public.patients WHERE id = p_patient_id;

  IF NOT FOUND THEN
    RETURN 'avaliacao';
  END IF;

  IF v_patient.allocated_professional_id IS NOT NULL
    OR v_patient.last_session_at IS NOT NULL
    OR EXISTS (
      SELECT 1 FROM public.care_cycles cc WHERE cc.patient_id = p_patient_id
    )
  THEN
    RETURN 'continuidade';
  END IF;

  RETURN 'avaliacao';
END;
$$;

CREATE OR REPLACE FUNCTION public.set_demand_type_on_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.demand_type := public.resolve_demand_type(NEW.patient_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_demands_set_type ON public.demands;

CREATE TRIGGER trg_demands_set_type
  BEFORE INSERT ON public.demands
  FOR EACH ROW
  EXECUTE FUNCTION public.set_demand_type_on_insert();

UPDATE public.demands d
SET demand_type = public.resolve_demand_type(d.patient_id);

CREATE INDEX IF NOT EXISTS idx_demands_type ON public.demands (demand_type);

COMMENT ON COLUMN public.demands.demand_type IS 'Avaliacao = primeiro contato; Continuidade = paciente ja em tratamento';
