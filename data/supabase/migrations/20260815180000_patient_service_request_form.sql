-- Formulário de solicitação do paciente: enums e coluna de origem

DO $$
BEGIN
  CREATE TYPE public.patient_referral_source AS ENUM (
    'INDICACAO',
    'GOOGLE',
    'INSTAGRAM',
    'FACEBOOK',
    'OUTROS'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS referral_source public.patient_referral_source;

COMMENT ON COLUMN public.patients.referral_source IS 'Como o paciente/responsável conheceu a Larsana Care';

ALTER TYPE public.legal_term_type ADD VALUE IF NOT EXISTS 'CONTRATO_INTERMEDIACAO';
ALTER TYPE public.legal_term_type ADD VALUE IF NOT EXISTS 'TERMO_CONSENTIMENTO';
