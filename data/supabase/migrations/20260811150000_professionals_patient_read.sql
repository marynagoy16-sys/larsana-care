-- Paciente/responsável pode ver o nome do PP da equipe de cuidado (ciclos e sessões).

CREATE POLICY professionals_patient_care_team_read ON public.professionals
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() = 'paciente'
    AND (
      id IN (
        SELECT p.allocated_professional_id
        FROM public.patients p
        WHERE p.id = ANY (public.current_patient_ids())
          AND p.allocated_professional_id IS NOT NULL
      )
      OR id IN (
        SELECT c.assigned_professional_id
        FROM public.care_cycles c
        WHERE c.patient_id = ANY (public.current_patient_ids())
      )
      OR id IN (
        SELECT s.professional_id
        FROM public.care_sessions s
        INNER JOIN public.care_cycles c ON c.id = s.cycle_id
        WHERE c.patient_id = ANY (public.current_patient_ids())
          AND s.professional_id IS NOT NULL
      )
    )
  );
