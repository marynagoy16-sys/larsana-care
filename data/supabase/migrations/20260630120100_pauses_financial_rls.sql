-- LarsanaCare: RLS for pauses and financial closure tables
-- Migration: 20260630120100_pauses_financial_rls

ALTER TABLE public.financial_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pause_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reschedule_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY financial_closures_staff_read ON public.financial_closures
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY pause_events_staff_all ON public.pause_events
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY pause_events_patient_read ON public.pause_events
  FOR SELECT TO authenticated
  USING (patient_id = ANY (public.current_patient_ids()));

CREATE POLICY pause_events_pp_read ON public.pause_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.care_cycles c
      WHERE c.id = pause_events.cycle_id
        AND c.assigned_professional_id = public.current_professional_id()
    )
  );

CREATE POLICY reschedule_events_staff_all ON public.reschedule_events
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY reschedule_events_patient_read ON public.reschedule_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.care_cycles c
      WHERE c.id = reschedule_events.cycle_id
        AND c.patient_id = ANY (public.current_patient_ids())
    )
  );

CREATE POLICY reschedule_events_patient_insert ON public.reschedule_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.care_cycles c
      WHERE c.id = reschedule_events.cycle_id
        AND c.patient_id = ANY (public.current_patient_ids())
    )
  );

CREATE POLICY financial_ledger_staff_read ON public.financial_ledger
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY refunds_staff_read ON public.refunds
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY refunds_staff_update ON public.refunds
  FOR UPDATE TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'financeiro']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'financeiro']::public.user_role[]));
