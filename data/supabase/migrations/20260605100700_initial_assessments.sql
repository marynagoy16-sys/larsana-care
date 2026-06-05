-- LarsanaCare: initial assessments workflow
-- Migration: 20260605100700_initial_assessments

CREATE TABLE public.initial_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  evaluator_professional_id uuid NOT NULL REFERENCES public.professionals (id) ON DELETE RESTRICT,
  crefito_number text NOT NULL,
  clinical_content text,
  status public.assessment_status NOT NULL DEFAULT 'avaliacao_feita',
  proposal_sent_at timestamptz,
  response_deadline_at timestamptz,
  family_response public.family_response,
  responded_at timestamptz,
  responded_by_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_assessments_patient ON public.initial_assessments (patient_id);
CREATE INDEX idx_assessments_evaluator ON public.initial_assessments (evaluator_professional_id);
CREATE INDEX idx_assessments_status ON public.initial_assessments (status);
CREATE INDEX idx_assessments_deadline ON public.initial_assessments (response_deadline_at)
  WHERE status IN ('proposta_enviada', 'em_analise');

CREATE TABLE public.assessment_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.initial_assessments (id) ON DELETE CASCADE,
  from_status public.assessment_status,
  to_status public.assessment_status NOT NULL,
  changed_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  notes text,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_assessment_history ON public.assessment_status_history (assessment_id);

CREATE TABLE public.assessment_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL UNIQUE REFERENCES public.initial_assessments (id) ON DELETE CASCADE,
  charge_id uuid,
  amount_cents integer NOT NULL DEFAULT 5000 CHECK (amount_cents > 0),
  due_days integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now()
);
