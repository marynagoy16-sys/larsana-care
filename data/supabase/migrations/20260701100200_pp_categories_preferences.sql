-- LarsanaCare: categoria atendimento único + preferências PP
-- Migration: 20260701100200_pp_categories_preferences

ALTER TYPE public.pp_technical_category ADD VALUE IF NOT EXISTS 'atendimento_unico';

ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS patient_preferences public.pp_technical_category[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_professionals_patient_preferences
  ON public.professionals USING gin (patient_preferences);

COMMENT ON COLUMN public.professionals.patient_preferences IS 'Preferências de tipos de paciente que o PP aceita atender';
