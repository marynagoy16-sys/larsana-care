-- LarsanaCare: período de atendimento (Manhã / Tarde / Noite)
-- Migration: 20260612140000_patient_attendance_period_enum

DO $$
BEGIN
  CREATE TYPE public.patient_attendance_period AS ENUM (
    'MANHA',
    'TARDE',
    'NOITE'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- A view patients_pp referencia attendance_period; precisa ser removida antes do ALTER TYPE.
DROP VIEW IF EXISTS public.patients_pp;

ALTER TABLE public.patients
  ALTER COLUMN attendance_period TYPE public.patient_attendance_period
  USING (
    CASE lower(trim(attendance_period::text))
      WHEN 'manhã' THEN 'MANHA'::public.patient_attendance_period
      WHEN 'manha' THEN 'MANHA'::public.patient_attendance_period
      WHEN 'tarde' THEN 'TARDE'::public.patient_attendance_period
      WHEN 'noite' THEN 'NOITE'::public.patient_attendance_period
      ELSE NULL
    END
  );

COMMENT ON COLUMN public.patients.attendance_period IS 'Preferência de turno: Manhã, Tarde ou Noite';

CREATE VIEW public.patients_pp
WITH (security_invoker = true)

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
