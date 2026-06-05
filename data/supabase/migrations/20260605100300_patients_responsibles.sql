-- LarsanaCare: patients and responsibles
-- Migration: 20260605100300_patients_responsibles

CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  cpf text UNIQUE,
  birth_date date,
  care_status public.patient_care_status NOT NULL DEFAULT 'ATIVO',
  patient_level public.patient_level NOT NULL DEFAULT 'N1',
  region_id uuid REFERENCES public.regions (id) ON DELETE SET NULL,
  city_id uuid REFERENCES public.cities (id) ON DELETE SET NULL,
  allocated_professional_id uuid,
  suggested_weekly_frequency numeric(3, 1),
  is_data_complete boolean NOT NULL DEFAULT false,
  is_valor_social boolean NOT NULL DEFAULT false,
  valor_social_amount_cents integer,
  valor_social_approved_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  asaas_customer_id text,
  clinical_summary text,
  last_session_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_patients_cpf ON public.patients (cpf);
CREATE INDEX idx_patients_care_status ON public.patients (care_status);
CREATE INDEX idx_patients_allocated_pp ON public.patients (allocated_professional_id);
CREATE INDEX idx_patients_city_id ON public.patients (city_id);

CREATE TABLE public.patient_responsibles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  full_name text NOT NULL,
  cpf text,
  phone text,
  email text,
  backup_phone text,
  is_primary boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_patient_responsibles_patient ON public.patient_responsibles (patient_id);
CREATE INDEX idx_patient_responsibles_user ON public.patient_responsibles (user_id);

CREATE TABLE public.patient_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  full_address text NOT NULL,
  street text,
  number text,
  complement text,
  neighborhood text,
  city_id uuid REFERENCES public.cities (id) ON DELETE SET NULL,
  postal_code text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  is_primary boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_patient_addresses_patient ON public.patient_addresses (patient_id);

CREATE TABLE public.patient_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  document_type public.patient_document_type NOT NULL DEFAULT 'OUTRO',
  storage_path text,
  source_url text,
  file_name text,
  uploaded_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_patient_documents_patient ON public.patient_documents (patient_id);
