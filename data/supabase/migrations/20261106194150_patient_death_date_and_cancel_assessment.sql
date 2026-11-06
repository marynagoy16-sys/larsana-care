-- Data do óbito no cadastro do paciente.
-- Avaliação ainda em aberto pode ser encerrada como cancelada.

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS death_date date;

ALTER TYPE public.assessment_status ADD VALUE IF NOT EXISTS 'cancelada';
