-- LarsanaCare: novos valores do enum patient_care_status
-- Migration: 20260630140000_patient_care_status_categories
-- Nota: ADD VALUE precisa commitar antes de usar os valores (migration separada abaixo).

ALTER TYPE public.patient_care_status ADD VALUE IF NOT EXISTS 'PAUSA_JUSTIFICADA';
ALTER TYPE public.patient_care_status ADD VALUE IF NOT EXISTS 'PAUSA_SOLICITADA_PACIENTE';
ALTER TYPE public.patient_care_status ADD VALUE IF NOT EXISTS 'ALTA';
ALTER TYPE public.patient_care_status ADD VALUE IF NOT EXISTS 'OBITO';
ALTER TYPE public.patient_care_status ADD VALUE IF NOT EXISTS 'CANCELADO';
