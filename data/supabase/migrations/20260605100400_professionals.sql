-- LarsanaCare: professionals
-- Migration: 20260605100400_professionals

CREATE TABLE public.professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES public.profiles (id) ON DELETE SET NULL,
  full_name text NOT NULL,
  cpf_cnpj text,
  person_type public.person_type NOT NULL DEFAULT 'PF',
  birth_date date,
  email text NOT NULL,
  phone text,
  address text,
  pp_class public.pp_class NOT NULL DEFAULT 'BRONZE',
  profession public.profession_type NOT NULL DEFAULT 'FISIO',
  specialty text,
  credentialing_status public.credentialing_status NOT NULL DEFAULT 'rascunho',
  flag_encaminhado boolean NOT NULL DEFAULT false,
  flag_assinado boolean NOT NULL DEFAULT false,
  asaas_wallet_id text,
  referral_source text,
  weekly_hour_limit numeric(5, 2) NOT NULL DEFAULT 30,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_professionals_user_id ON public.professionals (user_id);
CREATE INDEX idx_professionals_credentialing ON public.professionals (credentialing_status);
CREATE INDEX idx_professionals_email ON public.professionals (email);

ALTER TABLE public.patients
  ADD CONSTRAINT patients_allocated_professional_id_fkey
  FOREIGN KEY (allocated_professional_id)
  REFERENCES public.professionals (id) ON DELETE SET NULL;

CREATE TABLE public.professional_councils (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals (id) ON DELETE CASCADE,
  council_type public.council_type NOT NULL,
  registration_number text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (professional_id, council_type)
);

CREATE TABLE public.professional_bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL UNIQUE REFERENCES public.professionals (id) ON DELETE CASCADE,
  bank_code text,
  bank_name text,
  agency text,
  account_number text,
  account_type text,
  pix_key text,
  holder_name text,
  holder_document text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.professional_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals (id) ON DELETE CASCADE,
  document_type public.professional_document_type NOT NULL,
  storage_path text,
  source_url text,
  file_name text,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_professional_documents_pp ON public.professional_documents (professional_id);

CREATE TABLE public.professional_business_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL UNIQUE REFERENCES public.professionals (id) ON DELETE CASCADE,
  photo_storage_path text,
  photo_source_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
