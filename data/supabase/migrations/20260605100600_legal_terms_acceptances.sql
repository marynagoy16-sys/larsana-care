-- LarsanaCare: legal terms and digital acceptances
-- Migration: 20260605100600_legal_terms_acceptances

CREATE TABLE public.legal_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term_type public.legal_term_type NOT NULL,
  version text NOT NULL,
  title text NOT NULL,
  content text,
  storage_path text,
  published_at timestamptz NOT NULL DEFAULT now(),
  is_current boolean NOT NULL DEFAULT false,
  requires_reaccept boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (term_type, version)
);

CREATE INDEX idx_legal_terms_current ON public.legal_terms (term_type)
  WHERE is_current = true;

CREATE TABLE public.digital_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  acceptor_role public.user_role NOT NULL,
  acceptor_user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  patient_id uuid REFERENCES public.patients (id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professionals (id) ON DELETE CASCADE,
  term_id uuid NOT NULL REFERENCES public.legal_terms (id) ON DELETE RESTRICT,
  ip_address inet,
  user_agent text,
  accepted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_digital_acceptances_user ON public.digital_acceptances (acceptor_user_id);
CREATE INDEX idx_digital_acceptances_patient ON public.digital_acceptances (patient_id);
CREATE INDEX idx_digital_acceptances_professional ON public.digital_acceptances (professional_id);

CREATE OR REPLACE FUNCTION public.has_valid_acceptance(
  p_patient_id uuid,
  p_term_types public.legal_term_type[]
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM unnest(p_term_types) AS required(term_type)
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.digital_acceptances da
      JOIN public.legal_terms lt ON lt.id = da.term_id
      WHERE da.patient_id = p_patient_id
        AND lt.term_type = required.term_type
        AND lt.is_current = true
    )
  );
$$;
