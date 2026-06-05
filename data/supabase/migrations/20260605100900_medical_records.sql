-- LarsanaCare: medical records
-- Migration: 20260605100900_medical_records

CREATE TABLE public.medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE RESTRICT,
  session_id uuid REFERENCES public.care_sessions (id) ON DELETE SET NULL,
  cycle_id uuid REFERENCES public.care_cycles (id) ON DELETE SET NULL,
  professional_id uuid NOT NULL REFERENCES public.professionals (id) ON DELETE RESTRICT,
  crefito_number text NOT NULL,
  record_type public.medical_record_type NOT NULL DEFAULT 'evolucao',
  content_richtext text,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  definitive_deadline_at timestamptz,
  alert_24h_at timestamptz,
  alert_24h_triggered boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_medical_records_patient ON public.medical_records (patient_id, recorded_at DESC);
CREATE INDEX idx_medical_records_session ON public.medical_records (session_id);
CREATE INDEX idx_medical_records_professional ON public.medical_records (professional_id);
CREATE INDEX idx_medical_records_alert ON public.medical_records (alert_24h_triggered)
  WHERE alert_24h_triggered = false AND alert_24h_at IS NOT NULL;

CREATE TABLE public.medical_record_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id uuid NOT NULL REFERENCES public.medical_records (id) ON DELETE CASCADE,
  content_richtext text,
  edited_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  edited_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_medical_record_versions_record ON public.medical_record_versions (medical_record_id);

CREATE TABLE public.medical_record_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id uuid NOT NULL REFERENCES public.medical_records (id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text,
  attachment_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.medical_record_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id uuid NOT NULL REFERENCES public.medical_records (id) ON DELETE CASCADE,
  accessed_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  accessed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_medical_access_log_record ON public.medical_record_access_log (medical_record_id);
