-- LarsanaCare: campos clínicos do paciente para listagem de demandas
-- Migration: 20260612120000_patient_demands_fields

DO $$
BEGIN
  CREATE TYPE public.patient_sex AS ENUM (
    'M',
    'F',
    'OUTRO'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS sex public.patient_sex,
  ADD COLUMN IF NOT EXISTS diagnostic_hypothesis text,
  ADD COLUMN IF NOT EXISTS attendance_period text;

COMMENT ON COLUMN public.patients.sex IS 'Sexo biológico do paciente (planilha legada: sexo F / FEM)';
COMMENT ON COLUMN public.patients.diagnostic_hypothesis IS 'Hipótese diagnóstica resumida (planilha legada: HD)';
COMMENT ON COLUMN public.patients.attendance_period IS 'Período ou dias/horários preferenciais de atendimento';

-- CREATE OR REPLACE não permite alterar ordem/nomes de colunas existentes na view.
DROP VIEW IF EXISTS public.patients_pp;

CREATE VIEW public.patients_pp
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.full_name,
  p.birth_date,
  p.care_status,
  p.patient_level,
  p.region_id,
  p.city_id,
  p.allocated_professional_id,
  p.suggested_weekly_frequency,
  p.clinical_summary,
  p.last_session_at,
  p.created_at,
  p.sex,
  p.diagnostic_hypothesis,
  p.attendance_period
FROM public.patients p;
