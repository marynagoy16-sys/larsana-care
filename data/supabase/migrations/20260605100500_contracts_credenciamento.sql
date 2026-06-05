-- LarsanaCare: contracts and credenciamento
-- Migration: 20260605100500_contracts_credenciamento

CREATE TABLE public.contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profession public.profession_type NOT NULL,
  version text NOT NULL DEFAULT '1.0',
  title text NOT NULL,
  content_template text,
  annex_i_template text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profession, version)
);

CREATE TABLE public.contract_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profession public.profession_type NOT NULL,
  year integer NOT NULL,
  last_sequence integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profession, year)
);

CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals (id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.contract_templates (id) ON DELETE SET NULL,
  contract_number text NOT NULL UNIQUE,
  status public.contract_status NOT NULL DEFAULT 'rascunho',
  generated_pdf_path text,
  signed_pdf_path text,
  approved_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  approved_at timestamptz,
  signed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contracts_professional ON public.contracts (professional_id);
CREATE INDEX idx_contracts_number ON public.contracts (contract_number);

CREATE TABLE public.credentialing_workflow_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals (id) ON DELETE CASCADE,
  from_status public.credentialing_status,
  to_status public.credentialing_status NOT NULL,
  changed_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  notes text,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_credentialing_log_pp ON public.credentialing_workflow_log (professional_id);

CREATE OR REPLACE FUNCTION public.generate_contract_number(p_profession public.profession_type)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year integer := EXTRACT(YEAR FROM CURRENT_DATE)::integer;
  v_seq integer;
  v_prof_label text;
BEGIN
  v_prof_label := CASE p_profession
    WHEN 'FISIO' THEN 'FISIO'
    WHEN 'NUTI' THEN 'NUTI'
    WHEN 'MED' THEN 'MED'
    WHEN 'CUID' THEN 'CUIDA'
    WHEN 'FONO' THEN 'FONO'
    ELSE 'FISIO'
  END;

  INSERT INTO public.contract_sequences (profession, year, last_sequence)
  VALUES (p_profession, v_year, 1)
  ON CONFLICT (profession, year)
  DO UPDATE SET last_sequence = public.contract_sequences.last_sequence + 1
  RETURNING last_sequence INTO v_seq;

  RETURN format('LRS-PROF.%s-%s-%s', v_prof_label, v_year, lpad(v_seq::text, 4, '0'));
END;
$$;
