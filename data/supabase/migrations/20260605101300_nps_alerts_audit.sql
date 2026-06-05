-- LarsanaCare: NPS, alerts, audit
-- Migration: 20260605101300_nps_alerts_audit

CREATE TABLE public.nps_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.care_cycles (id) ON DELETE CASCADE,
  rater_type public.nps_rater_type NOT NULL,
  rater_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  rated_entity_type public.nps_rated_entity_type NOT NULL,
  rated_entity_id uuid,
  score integer NOT NULL CHECK (score >= 0 AND score <= 10),
  comment text,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_nps_cycle ON public.nps_surveys (cycle_id);
CREATE INDEX idx_nps_rated_pp ON public.nps_surveys (rated_entity_id)
  WHERE rated_entity_type = 'professional';

CREATE TABLE public.operational_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type public.alert_type NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  severity public.alert_severity NOT NULL DEFAULT 'warning',
  title text NOT NULL,
  message text,
  triggered_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL
);

CREATE INDEX idx_operational_alerts_unresolved ON public.operational_alerts (triggered_at DESC)
  WHERE resolved_at IS NULL;

CREATE TABLE public.wallet_protection_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_type text NOT NULL,
  professional_id uuid REFERENCES public.professionals (id) ON DELETE SET NULL,
  patient_id uuid REFERENCES public.patients (id) ON DELETE SET NULL,
  description text,
  reported_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  reported_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  actor_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_entity ON public.audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs (actor_user_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs (created_at DESC);

CREATE TABLE public.lgpd_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  request_type public.lgpd_request_type NOT NULL,
  status public.lgpd_request_status NOT NULL DEFAULT 'pendente',
  details text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
