-- LarsanaCare: Academy functions, RLS, storage, seed
-- Migration: 20260613100100_academy_functions_rls_seed

CREATE OR REPLACE FUNCTION public.pp_passes_academy_gate(p_gate_target public.academy_gate_target)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings public.academy_platform_settings%ROWTYPE;
  v_rule public.academy_gate_rules%ROWTYPE;
  v_professional_id uuid;
  v_enrollment_id uuid;
  v_required_lessons int;
  v_completed_lessons int;
  v_now timestamptz := now();
BEGIN
  IF public.current_user_role() IS DISTINCT FROM 'pp' THEN
    RETURN true;
  END IF;

  SELECT * INTO v_settings FROM public.academy_platform_settings LIMIT 1;

  IF v_settings IS NULL OR NOT v_settings.gates_master_enabled THEN
    RETURN true;
  END IF;

  v_professional_id := public.current_professional_id();

  IF v_professional_id IS NULL THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.pp_academy_exemptions e
    WHERE e.professional_id = v_professional_id
      AND (e.gate_target IS NULL OR e.gate_target = p_gate_target)
      AND (e.expires_at IS NULL OR e.expires_at > v_now)
  ) THEN
    RETURN true;
  END IF;

  SELECT * INTO v_rule
  FROM public.academy_gate_rules r
  WHERE r.gate_target = p_gate_target;

  IF v_rule IS NULL OR NOT v_rule.is_enabled THEN
    RETURN true;
  END IF;

  IF v_rule.effective_from IS NOT NULL AND v_now < v_rule.effective_from THEN
    RETURN true;
  END IF;

  IF v_rule.effective_until IS NOT NULL AND v_now > v_rule.effective_until THEN
    RETURN true;
  END IF;

  IF v_rule.requirement_type = 'none' OR v_rule.course_id IS NULL THEN
    RETURN true;
  END IF;

  SELECT e.id INTO v_enrollment_id
  FROM public.academy_enrollments e
  WHERE e.professional_id = v_professional_id
    AND e.course_id = v_rule.course_id;

  IF v_enrollment_id IS NULL THEN
    RETURN false;
  END IF;

  IF v_rule.requirement_type = 'full_course' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.academy_enrollments e
      WHERE e.id = v_enrollment_id AND e.status = 'completed'
    );
  END IF;

  IF v_rule.requirement_type = 'modules' AND cardinality(v_rule.required_module_ids) > 0 THEN
    SELECT count(*) INTO v_required_lessons
    FROM public.academy_lessons l
    JOIN public.academy_modules m ON m.id = l.module_id
    WHERE m.id = ANY (v_rule.required_module_ids)
      AND l.is_published = true;

    SELECT count(*) INTO v_completed_lessons
    FROM public.academy_lesson_progress lp
    JOIN public.academy_lessons l ON l.id = lp.lesson_id
    JOIN public.academy_modules m ON m.id = l.module_id
    WHERE lp.enrollment_id = v_enrollment_id
      AND lp.completed_at IS NOT NULL
      AND m.id = ANY (v_rule.required_module_ids);

    RETURN v_required_lessons > 0 AND v_completed_lessons >= v_required_lessons;
  END IF;

  IF v_rule.requirement_type = 'lessons' AND cardinality(v_rule.required_lesson_ids) > 0 THEN
    SELECT cardinality(v_rule.required_lesson_ids) INTO v_required_lessons;

    SELECT count(*) INTO v_completed_lessons
    FROM public.academy_lesson_progress lp
    WHERE lp.enrollment_id = v_enrollment_id
      AND lp.lesson_id = ANY (v_rule.required_lesson_ids)
      AND lp.completed_at IS NOT NULL;

    RETURN v_required_lessons > 0 AND v_completed_lessons >= v_required_lessons;
  END IF;

  RETURN false;
END;
$$;

DROP POLICY IF EXISTS demands_pp_read ON public.demands;

CREATE POLICY demands_pp_read ON public.demands
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() = 'pp'
    AND status = 'aberta'
    AND EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.user_id = auth.uid() AND p.credentialing_status = 'ativo'
    )
    AND public.pp_passes_academy_gate('demands'::public.academy_gate_target)
  );

ALTER TABLE public.academy_platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_lesson_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_gate_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_gate_rules_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pp_academy_exemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.larsanapill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.larsanapill_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.larsanapill_content_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY academy_settings_staff_read ON public.academy_platform_settings
  FOR SELECT TO authenticated USING (public.is_staff() OR public.current_user_role() = 'pp');

CREATE POLICY academy_settings_admin_write ON public.academy_platform_settings
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY academy_courses_read ON public.academy_courses
  FOR SELECT TO authenticated
  USING (
    public.is_staff()
    OR (is_published = true AND audience = 'pp' AND public.current_user_role() = 'pp')
  );

CREATE POLICY academy_courses_staff ON public.academy_courses
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]));

CREATE POLICY academy_modules_read ON public.academy_modules
  FOR SELECT TO authenticated
  USING (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.academy_courses c
      WHERE c.id = course_id AND c.is_published = true
        AND c.audience = 'pp' AND public.current_user_role() = 'pp'
    )
  );

CREATE POLICY academy_modules_staff ON public.academy_modules
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]));

CREATE POLICY academy_lessons_read ON public.academy_lessons
  FOR SELECT TO authenticated
  USING (
    public.is_staff()
    OR (
      is_published = true
      AND EXISTS (
        SELECT 1 FROM public.academy_modules m
        JOIN public.academy_courses c ON c.id = m.course_id
        WHERE m.id = module_id AND c.is_published = true
          AND c.audience = 'pp' AND public.current_user_role() = 'pp'
      )
    )
  );

CREATE POLICY academy_lessons_staff ON public.academy_lessons
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]));

CREATE POLICY academy_materials_read ON public.academy_lesson_materials
  FOR SELECT TO authenticated
  USING (public.is_staff() OR public.current_user_role() = 'pp');

CREATE POLICY academy_materials_staff ON public.academy_lesson_materials
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]));

CREATE POLICY academy_enrollments_pp ON public.academy_enrollments
  FOR ALL TO authenticated
  USING (public.is_staff() OR professional_id = public.current_professional_id())
  WITH CHECK (public.is_staff() OR professional_id = public.current_professional_id());

CREATE POLICY academy_progress_pp ON public.academy_lesson_progress
  FOR ALL TO authenticated
  USING (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.academy_enrollments e
      WHERE e.id = enrollment_id AND e.professional_id = public.current_professional_id()
    )
  )
  WITH CHECK (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.academy_enrollments e
      WHERE e.id = enrollment_id AND e.professional_id = public.current_professional_id()
    )
  );

CREATE POLICY academy_certificates_read ON public.academy_certificates
  FOR SELECT TO authenticated
  USING (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.academy_enrollments e
      WHERE e.id = enrollment_id AND e.professional_id = public.current_professional_id()
    )
  );

CREATE POLICY academy_gate_rules_read ON public.academy_gate_rules
  FOR SELECT TO authenticated
  USING (public.is_staff() OR public.current_user_role() = 'pp');

CREATE POLICY academy_gate_rules_admin ON public.academy_gate_rules
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY academy_gate_log_admin ON public.academy_gate_rules_log
  FOR SELECT TO authenticated
  USING (public.current_user_role() = 'admin');

CREATE POLICY academy_gate_log_insert ON public.academy_gate_rules_log
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY academy_exemptions_admin ON public.pp_academy_exemptions
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY academy_exemptions_pp_read ON public.pp_academy_exemptions
  FOR SELECT TO authenticated
  USING (professional_id = public.current_professional_id());

CREATE POLICY larsanapill_categories_read ON public.larsanapill_categories
  FOR SELECT TO authenticated
  USING (public.is_staff() OR (is_published = true AND public.current_user_role() = 'paciente'));

CREATE POLICY larsanapill_categories_staff ON public.larsanapill_categories
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]));

CREATE POLICY larsanapill_contents_read ON public.larsanapill_contents
  FOR SELECT TO authenticated
  USING (public.is_staff() OR (is_published = true AND public.current_user_role() = 'paciente'));

CREATE POLICY larsanapill_contents_staff ON public.larsanapill_contents
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]));

CREATE POLICY larsanapill_progress_patient ON public.larsanapill_content_progress
  FOR ALL TO authenticated
  USING (public.is_staff() OR patient_id = ANY (public.current_patient_ids()))
  WITH CHECK (public.is_staff() OR patient_id = ANY (public.current_patient_ids()));

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'academy-content',
  'academy-content',
  false,
  104857600,
  ARRAY['video/mp4', 'video/webm', 'application/pdf', 'image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY academy_content_staff_upload ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'academy-content'
    AND public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[])
  );

CREATE POLICY academy_content_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'academy-content'
    AND (public.is_staff() OR public.current_user_role() IN ('pp', 'paciente'))
  );

CREATE POLICY academy_content_staff_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'academy-content'
    AND public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[])
  );

DO $$
DECLARE
  v_course_id uuid;
  v_m1 uuid; v_m2 uuid; v_m3 uuid;
  v_p1_cat uuid;
BEGIN
  INSERT INTO public.academy_courses (slug, title, description, audience, is_mandatory, is_published, sort_order, estimated_minutes)
  VALUES (
    'formacao-pp',
    'Formação PP',
    'Trilha para profissionais parceiros operarem na plataforma Larsana Care.',
    'pp',
    true,
    true,
    1,
    480
  )
  RETURNING id INTO v_course_id;

  INSERT INTO public.academy_modules (course_id, code, title, sort_order) VALUES
    (v_course_id, 'M1', 'Boas práticas de atendimento', 1),
    (v_course_id, 'M2', 'Método LARSANA', 2),
    (v_course_id, 'M3', 'Plano de carreira', 3),
    (v_course_id, 'M4', 'Rotina de trabalho', 4),
    (v_course_id, 'M5', 'Plano ativacional', 5);

  SELECT id INTO v_m1 FROM public.academy_modules WHERE course_id = v_course_id AND code = 'M1';
  SELECT id INTO v_m2 FROM public.academy_modules WHERE course_id = v_course_id AND code = 'M2';
  SELECT id INTO v_m3 FROM public.academy_modules WHERE course_id = v_course_id AND code = 'M3';

  INSERT INTO public.academy_lessons (module_id, slug, title, content_type, content, duration_seconds, sort_order, is_published) VALUES
    (v_m1, '1-1', 'Bem-vindo à Larsana Care', 'richtext', '<p>Introdução à plataforma e ao papel do Profissional Parceiro.</p>', 900, 1, true),
    (v_m1, '1-2', 'Ética e pontualidade', 'richtext', '<p>Compromissos ao aceitar demandas domiciliares.</p>', 1200, 2, true),
    (v_m2, '2-1', 'Visão geral do fluxo', 'richtext', '<p>Avaliação → Proposta → Ciclo → Prontuário → Repasse.</p>', 1200, 1, true),
    (v_m3, '3-1', 'Classes Bronze, Prata e Ouro', 'richtext', '<p>Comissionamento 70/75/80%.</p>', 1200, 1, true);

  INSERT INTO public.academy_gate_rules (gate_target, is_enabled, requirement_type, course_id, required_module_ids, block_message)
  VALUES (
    'demands',
    true,
    'modules',
    v_course_id,
    ARRAY[v_m1, v_m2, v_m3],
    'Conclua os módulos M1 a M3 na Academy para receber novas demandas.'
  );

  INSERT INTO public.academy_gate_rules (gate_target, is_enabled, requirement_type, block_message)
  VALUES
    ('credenciamento_ativo', false, 'none', NULL),
    ('paciente_p1', false, 'none', NULL),
    ('paciente_pagamento', false, 'none', NULL);

  INSERT INTO public.larsanapill_categories (slug, code, title, description, sort_order, is_published) VALUES
    ('tutoriais', 'P1', 'Tutoriais da plataforma', 'Como usar o portal paciente', 1, true),
    ('automassagem', 'P2', 'Automassagem', 'Técnicas seguras de automassagem', 2, true),
    ('exercicios', 'P3', 'Exercícios específicos', 'Por patologia e objetivo', 3, true),
    ('ebooks', 'P4', 'Ebooks ilustrados', 'Guias para famílias', 4, true),
    ('guiados', 'P5', 'Exercícios guiados', 'Séries curtas com timer', 5, true),
    ('treinos', 'P6', 'Treinos em casa', 'Planos semanais', 6, true);

  SELECT id INTO v_p1_cat FROM public.larsanapill_categories WHERE code = 'P1';

  INSERT INTO public.larsanapill_contents (category_id, slug, title, content_type, content, duration_seconds, sort_order, is_published) VALUES
    (v_p1_cat, 'como-funciona', 'Como funciona a Larsana Care', 'richtext', '<p>Intermediação de fisioterapia domiciliar.</p>', 300, 1, true),
    (v_p1_cat, 'pagamento', 'Como pagar seu ciclo', 'richtext', '<p>PIX e boleto antecipados.</p>', 300, 2, true);
END $$;

INSERT INTO public.pp_academy_exemptions (professional_id, gate_target, reason)
SELECT p.id, NULL, 'PP credenciado pré-Academy'
FROM public.professionals p
WHERE p.credentialing_status = 'ativo'
ON CONFLICT DO NOTHING;
