-- LarsanaCare: RLS helpers, policies, storage buckets
-- Migration: 20260605101600_rls_policies

-- ===== RLS HELPER FUNCTIONS =====

CREATE OR REPLACE FUNCTION public.auth_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$ SELECT auth.uid(); $$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT primary_role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_professional_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.professionals WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_patient_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(DISTINCT patient_id), '{}'::uuid[])
  FROM public.patient_responsibles
  WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND primary_role IN ('admin', 'financeiro', 'gestao')
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff_role(p_roles public.user_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND primary_role = ANY (p_roles)
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_assigned_pp(p_patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = p_patient_id
      AND p.allocated_professional_id = public.current_professional_id()
  )
  OR EXISTS (
    SELECT 1 FROM public.care_cycles c
    WHERE c.patient_id = p_patient_id
      AND c.assigned_professional_id = public.current_professional_id()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_patient(p_patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_staff()
    OR p_patient_id = ANY (public.current_patient_ids())
    OR public.is_assigned_pp(p_patient_id);
$$;

-- ===== ENABLE RLS =====

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_matrix_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_matrix_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.first_month_retention_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_responsibles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_councils ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_business_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credentialing_workflow_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initial_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_pauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_record_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_record_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_record_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deluma_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_weekly_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nps_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_protection_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lgpd_requests ENABLE ROW LEVEL SECURITY;

-- Force RLS on sensitive tables
ALTER TABLE public.medical_records FORCE ROW LEVEL SECURITY;
ALTER TABLE public.transfers FORCE ROW LEVEL SECURITY;
ALTER TABLE public.charges FORCE ROW LEVEL SECURITY;
ALTER TABLE public.patients FORCE ROW LEVEL SECURITY;

-- ===== PROFILES =====

CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff());

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_admin_all ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin']::public.user_role[]));

-- ===== STAFF PROFILES =====

CREATE POLICY staff_profiles_staff ON public.staff_profiles
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff_role(ARRAY['admin']::public.user_role[]));

CREATE POLICY staff_profiles_own_read ON public.staff_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ===== NOTIFICATIONS =====

CREATE POLICY notifications_own ON public.notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ===== SUPPORT TICKETS =====

CREATE POLICY support_tickets_own ON public.support_tickets
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY support_tickets_staff ON public.support_tickets
  FOR SELECT TO authenticated
  USING (public.is_staff());

-- ===== GEOGRAPHY (read all authenticated) =====

CREATE POLICY regions_read ON public.regions FOR SELECT TO authenticated USING (true);
CREATE POLICY cities_read ON public.cities FOR SELECT TO authenticated USING (true);
CREATE POLICY neighborhoods_read ON public.neighborhoods FOR SELECT TO authenticated USING (true);

CREATE POLICY regions_admin ON public.regions
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin']::public.user_role[]));

CREATE POLICY cities_admin ON public.cities
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin']::public.user_role[]));

CREATE POLICY neighborhoods_admin ON public.neighborhoods
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin']::public.user_role[]));

-- ===== PRICING =====

CREATE POLICY pricing_read_staff ON public.pricing_matrix_versions
  FOR SELECT TO authenticated USING (public.is_staff());

CREATE POLICY pricing_entries_read_staff ON public.pricing_matrix_entries
  FOR SELECT TO authenticated USING (public.is_staff());

CREATE POLICY commission_read_staff ON public.commission_rules
  FOR SELECT TO authenticated USING (public.is_staff());

CREATE POLICY retention_read_staff ON public.first_month_retention_rules
  FOR SELECT TO authenticated USING (public.is_staff());

CREATE POLICY pricing_admin_write ON public.pricing_matrix_versions
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin']::public.user_role[]));

CREATE POLICY pricing_entries_admin ON public.pricing_matrix_entries
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin']::public.user_role[]));

CREATE POLICY commission_admin ON public.commission_rules
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin']::public.user_role[]));

CREATE POLICY retention_admin ON public.first_month_retention_rules
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin']::public.user_role[]));

-- ===== PATIENTS =====

CREATE POLICY patients_staff_all ON public.patients
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]));

CREATE POLICY patients_financeiro_read ON public.patients
  FOR SELECT TO authenticated
  USING (public.is_staff_role(ARRAY['financeiro']::public.user_role[]));

CREATE POLICY patients_pp_read ON public.patients
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() = 'pp'
    AND public.is_assigned_pp(id)
  );

CREATE POLICY patients_responsavel_read ON public.patients
  FOR SELECT TO authenticated
  USING (id = ANY (public.current_patient_ids()));

-- ===== PATIENT CHILD TABLES =====

CREATE POLICY patient_responsibles_access ON public.patient_responsibles
  FOR ALL TO authenticated
  USING (public.can_access_patient(patient_id))
  WITH CHECK (
    public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[])
    OR user_id = auth.uid()
  );

CREATE POLICY patient_addresses_staff ON public.patient_addresses
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]));

CREATE POLICY patient_addresses_pp_read ON public.patient_addresses
  FOR SELECT TO authenticated
  USING (public.is_assigned_pp(patient_id));

CREATE POLICY patient_documents_access ON public.patient_documents
  FOR ALL TO authenticated
  USING (public.can_access_patient(patient_id))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]) OR patient_id = ANY (public.current_patient_ids()));

-- ===== PROFESSIONALS =====

CREATE POLICY professionals_staff ON public.professionals
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]));

CREATE POLICY professionals_financeiro_read ON public.professionals
  FOR SELECT TO authenticated
  USING (public.is_staff_role(ARRAY['financeiro']::public.user_role[]));

CREATE POLICY professionals_self ON public.professionals
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- PP child tables follow professional access
CREATE POLICY pp_councils ON public.professional_councils
  FOR ALL TO authenticated
  USING (
    public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[])
    OR professional_id = public.current_professional_id()
  )
  WITH CHECK (
    public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[])
    OR professional_id = public.current_professional_id()
  );

CREATE POLICY pp_bank ON public.professional_bank_accounts
  FOR ALL TO authenticated
  USING (
    public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[])
    OR professional_id = public.current_professional_id()
  )
  WITH CHECK (
    public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[])
    OR professional_id = public.current_professional_id()
  );

CREATE POLICY pp_documents ON public.professional_documents
  FOR ALL TO authenticated
  USING (
    public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[])
    OR professional_id = public.current_professional_id()
  )
  WITH CHECK (
    public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[])
    OR professional_id = public.current_professional_id()
  );

CREATE POLICY pp_business_card ON public.professional_business_cards
  FOR ALL TO authenticated
  USING (
    public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[])
    OR professional_id = public.current_professional_id()
  )
  WITH CHECK (
    public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[])
    OR professional_id = public.current_professional_id()
  );

-- ===== CONTRACTS =====

CREATE POLICY contract_templates_staff ON public.contract_templates
  FOR SELECT TO authenticated USING (public.is_staff() OR public.current_user_role() = 'pp');

CREATE POLICY contract_templates_admin ON public.contract_templates
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin']::public.user_role[]));

CREATE POLICY contract_sequences_admin ON public.contract_sequences
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]));

CREATE POLICY contracts_staff ON public.contracts
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]));

CREATE POLICY contracts_pp_self ON public.contracts
  FOR SELECT TO authenticated
  USING (professional_id = public.current_professional_id());

CREATE POLICY credentialing_log ON public.credentialing_workflow_log
  FOR SELECT TO authenticated
  USING (
    public.is_staff()
    OR professional_id = public.current_professional_id()
  );

-- ===== LEGAL TERMS =====

CREATE POLICY legal_terms_read ON public.legal_terms
  FOR SELECT TO authenticated USING (is_current = true OR public.is_staff());

CREATE POLICY legal_terms_admin ON public.legal_terms
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin']::public.user_role[]));

CREATE POLICY digital_acceptances_insert ON public.digital_acceptances
  FOR INSERT TO authenticated
  WITH CHECK (acceptor_user_id = auth.uid());

CREATE POLICY digital_acceptances_read ON public.digital_acceptances
  FOR SELECT TO authenticated
  USING (
    acceptor_user_id = auth.uid()
    OR public.is_staff()
    OR patient_id = ANY (public.current_patient_ids())
    OR professional_id = public.current_professional_id()
  );

-- ===== ASSESSMENTS =====

CREATE POLICY assessments_staff ON public.initial_assessments
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]));

CREATE POLICY assessments_pp ON public.initial_assessments
  FOR SELECT TO authenticated
  USING (evaluator_professional_id = public.current_professional_id());

CREATE POLICY assessments_pp_update ON public.initial_assessments
  FOR UPDATE TO authenticated
  USING (evaluator_professional_id = public.current_professional_id())
  WITH CHECK (evaluator_professional_id = public.current_professional_id());

CREATE POLICY assessments_patient ON public.initial_assessments
  FOR SELECT TO authenticated
  USING (patient_id = ANY (public.current_patient_ids()));

CREATE POLICY assessments_patient_response ON public.initial_assessments
  FOR UPDATE TO authenticated
  USING (patient_id = ANY (public.current_patient_ids()))
  WITH CHECK (patient_id = ANY (public.current_patient_ids()));

CREATE POLICY assessment_history_read ON public.assessment_status_history
  FOR SELECT TO authenticated
  USING (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.initial_assessments ia
      WHERE ia.id = assessment_id
        AND (
          ia.evaluator_professional_id = public.current_professional_id()
          OR ia.patient_id = ANY (public.current_patient_ids())
        )
    )
  );

CREATE POLICY assessment_charges_staff ON public.assessment_charges
  FOR SELECT TO authenticated USING (public.is_staff());

-- ===== CYCLES & SESSIONS =====

CREATE POLICY care_cycles_staff ON public.care_cycles
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]));

CREATE POLICY care_cycles_financeiro ON public.care_cycles
  FOR SELECT TO authenticated
  USING (public.is_staff_role(ARRAY['financeiro']::public.user_role[]));

CREATE POLICY care_cycles_pp ON public.care_cycles
  FOR SELECT TO authenticated
  USING (assigned_professional_id = public.current_professional_id());

CREATE POLICY care_cycles_patient ON public.care_cycles
  FOR SELECT TO authenticated
  USING (patient_id = ANY (public.current_patient_ids()));

CREATE POLICY care_sessions_staff ON public.care_sessions
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]));

CREATE POLICY care_sessions_pp ON public.care_sessions
  FOR ALL TO authenticated
  USING (professional_id = public.current_professional_id())
  WITH CHECK (professional_id = public.current_professional_id());

CREATE POLICY care_sessions_patient_read ON public.care_sessions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.care_cycles c
      WHERE c.id = cycle_id AND c.patient_id = ANY (public.current_patient_ids())
    )
  );

CREATE POLICY treatment_pauses_staff ON public.treatment_pauses
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]));

CREATE POLICY receipt_templates_read ON public.receipt_templates
  FOR SELECT TO authenticated USING (public.is_staff() OR public.current_user_role() IN ('pp', 'paciente'));

-- ===== MEDICAL RECORDS (paciente DENY) =====

CREATE POLICY medical_records_staff ON public.medical_records
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]));

CREATE POLICY medical_records_pp ON public.medical_records
  FOR ALL TO authenticated
  USING (
    professional_id = public.current_professional_id()
    AND public.is_assigned_pp(patient_id)
  )
  WITH CHECK (
    professional_id = public.current_professional_id()
    AND public.is_assigned_pp(patient_id)
  );

CREATE POLICY medical_versions_staff ON public.medical_record_versions
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]));

CREATE POLICY medical_versions_pp ON public.medical_record_versions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.medical_records mr
      WHERE mr.id = medical_record_id
        AND mr.professional_id = public.current_professional_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.medical_records mr
      WHERE mr.id = medical_record_id
        AND mr.professional_id = public.current_professional_id()
    )
  );

CREATE POLICY medical_attachments_pp ON public.medical_record_attachments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.medical_records mr
      WHERE mr.id = medical_record_id
        AND (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]) OR mr.professional_id = public.current_professional_id())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.medical_records mr
      WHERE mr.id = medical_record_id
        AND (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]) OR mr.professional_id = public.current_professional_id())
    )
  );

CREATE POLICY medical_access_log_staff ON public.medical_record_access_log
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY medical_access_log_insert ON public.medical_record_access_log
  FOR INSERT TO authenticated
  WITH CHECK (accessed_by = auth.uid());

-- ===== FINANCIAL =====

CREATE POLICY asaas_customers_staff ON public.asaas_customers
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'financeiro', 'gestao']::public.user_role[]));

CREATE POLICY charges_staff ON public.charges
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'financeiro', 'gestao']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'financeiro']::public.user_role[]));

CREATE POLICY charges_patient ON public.charges
  FOR SELECT TO authenticated
  USING (patient_id = ANY (public.current_patient_ids()));

-- PP: DENY on charges (no policy = deny)

CREATE POLICY payment_webhooks_deny ON public.payment_webhook_events
  FOR ALL TO authenticated
  USING (false);

CREATE POLICY patient_receipts_access ON public.patient_receipts
  FOR SELECT TO authenticated
  USING (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.charges ch
      WHERE ch.id = charge_id AND ch.patient_id = ANY (public.current_patient_ids())
    )
  );

CREATE POLICY attendance_sheets_access ON public.attendance_sheets
  FOR ALL TO authenticated
  USING (
    public.is_staff()
    OR professional_id = public.current_professional_id()
    OR patient_id = ANY (public.current_patient_ids())
  )
  WITH CHECK (
    public.is_staff()
    OR professional_id = public.current_professional_id()
  );

CREATE POLICY internal_expenses_finance ON public.internal_expenses
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'financeiro']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'financeiro']::public.user_role[]));

-- ===== TRANSFERS =====

CREATE POLICY transfer_queue_staff ON public.transfer_queue
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'financeiro', 'gestao']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'financeiro']::public.user_role[]));

CREATE POLICY transfer_queue_pp_read ON public.transfer_queue
  FOR SELECT TO authenticated
  USING (professional_id = public.current_professional_id());

CREATE POLICY transfers_staff ON public.transfers
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'financeiro']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'financeiro']::public.user_role[]));

CREATE POLICY transfers_gestao_read ON public.transfers
  FOR SELECT TO authenticated
  USING (public.is_staff_role(ARRAY['gestao']::public.user_role[]));

CREATE POLICY transfers_pp_read ON public.transfers
  FOR SELECT TO authenticated
  USING (professional_id = public.current_professional_id());

CREATE POLICY professional_invoices_pp ON public.professional_invoices
  FOR ALL TO authenticated
  USING (
    public.is_staff_role(ARRAY['admin', 'financeiro', 'gestao']::public.user_role[])
    OR professional_id = public.current_professional_id()
  )
  WITH CHECK (
    public.is_staff_role(ARRAY['admin', 'financeiro']::public.user_role[])
    OR professional_id = public.current_professional_id()
  );

CREATE POLICY deluma_exports_finance ON public.deluma_exports
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'financeiro']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'financeiro']::public.user_role[]));

-- ===== DEMANDS =====

CREATE POLICY demands_staff ON public.demands
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]));

CREATE POLICY demands_pp_read ON public.demands
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() = 'pp'
    AND status = 'aberta'
    AND EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.user_id = auth.uid() AND p.credentialing_status = 'ativo'
    )
  );

CREATE POLICY demand_responses_pp ON public.demand_responses
  FOR ALL TO authenticated
  USING (professional_id = public.current_professional_id())
  WITH CHECK (professional_id = public.current_professional_id());

CREATE POLICY demand_responses_staff ON public.demand_responses
  FOR SELECT TO authenticated USING (public.is_staff());

CREATE POLICY weekly_hours_pp ON public.professional_weekly_hours
  FOR SELECT TO authenticated
  USING (professional_id = public.current_professional_id() OR public.is_staff());

-- ===== NPS & ALERTS =====

CREATE POLICY nps_insert ON public.nps_surveys
  FOR INSERT TO authenticated
  WITH CHECK (rater_user_id = auth.uid() OR public.is_staff());

CREATE POLICY nps_read ON public.nps_surveys
  FOR SELECT TO authenticated
  USING (
    public.is_staff()
    OR rater_user_id = auth.uid()
    OR (
      rated_entity_type = 'professional'
      AND rated_entity_id = public.current_professional_id()
    )
  );

CREATE POLICY operational_alerts_staff ON public.operational_alerts
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY wallet_incidents_staff ON public.wallet_protection_incidents
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ===== AUDIT =====

CREATE POLICY audit_logs_staff_read ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY audit_logs_insert ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (actor_user_id = auth.uid() OR public.is_staff());

CREATE POLICY lgpd_own ON public.lgpd_requests
  FOR ALL TO authenticated
  USING (requester_user_id = auth.uid())
  WITH CHECK (requester_user_id = auth.uid());

CREATE POLICY lgpd_staff ON public.lgpd_requests
  FOR SELECT TO authenticated
  USING (public.is_staff_role(ARRAY['admin']::public.user_role[]));

-- ===== STORAGE BUCKETS =====

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('patient-documents', 'patient-documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('professional-documents', 'professional-documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('contracts', 'contracts', false, 52428800, ARRAY['application/pdf']),
  ('invoices-nf', 'invoices-nf', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('receipts', 'receipts', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('deluma-exports', 'deluma-exports', false, 104857600, ARRAY['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY storage_patient_docs ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'patient-documents'
    AND (
      public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[])
      OR (storage.foldername(name))[1] = ANY (
        SELECT patient_id::text FROM public.patient_responsibles WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    bucket_id = 'patient-documents'
    AND (
      public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[])
      OR (storage.foldername(name))[1] = ANY (
        SELECT patient_id::text FROM public.patient_responsibles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY storage_professional_docs ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'professional-documents'
    AND (
      public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[])
      OR (storage.foldername(name))[1] = public.current_professional_id()::text
    )
  )
  WITH CHECK (
    bucket_id = 'professional-documents'
    AND (
      public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[])
      OR (storage.foldername(name))[1] = public.current_professional_id()::text
    )
  );

CREATE POLICY storage_contracts ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'contracts'
    AND (
      public.is_staff()
      OR (storage.foldername(name))[1] = public.current_professional_id()::text
    )
  )
  WITH CHECK (
    bucket_id = 'contracts'
    AND public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[])
  );

CREATE POLICY storage_invoices ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'invoices-nf'
    AND (
      public.is_staff_role(ARRAY['admin', 'financeiro']::public.user_role[])
      OR (storage.foldername(name))[1] = public.current_professional_id()::text
    )
  )
  WITH CHECK (
    bucket_id = 'invoices-nf'
    AND (
      public.is_staff_role(ARRAY['admin', 'financeiro']::public.user_role[])
      OR (storage.foldername(name))[1] = public.current_professional_id()::text
    )
  );

CREATE POLICY storage_receipts ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (
      public.is_staff_role(ARRAY['admin', 'financeiro']::public.user_role[])
      OR (storage.foldername(name))[1] = ANY (
        SELECT patient_id::text FROM public.patient_responsibles WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    bucket_id = 'receipts'
    AND public.is_staff_role(ARRAY['admin', 'financeiro']::public.user_role[])
  );

CREATE POLICY storage_deluma ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'deluma-exports'
    AND public.is_staff_role(ARRAY['admin', 'financeiro']::public.user_role[])
  )
  WITH CHECK (
    bucket_id = 'deluma-exports'
    AND public.is_staff_role(ARRAY['admin', 'financeiro']::public.user_role[])
  );
