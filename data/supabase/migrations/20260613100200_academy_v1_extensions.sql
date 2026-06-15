-- LarsanaCare: Academy V1 extensions (quiz, weekly plans, notifications)
-- Migration: 20260613100200_academy_v1_extensions

ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'academy_reminder';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'academy_course_completed';

CREATE TABLE public.academy_quiz_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.academy_lessons (id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.professionals (id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  score int CHECK (score >= 0 AND score <= 100),
  passed boolean NOT NULL DEFAULT false,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, professional_id)
);

CREATE TABLE public.larsanapill_weekly_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  sessions_per_week int NOT NULL DEFAULT 3,
  minutes_per_session int NOT NULL DEFAULT 15,
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.larsanapill_weekly_plan_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.larsanapill_weekly_plans (id) ON DELETE CASCADE,
  day_index int NOT NULL CHECK (day_index >= 1 AND day_index <= 7),
  title text NOT NULL,
  content_id uuid REFERENCES public.larsanapill_contents (id) ON DELETE SET NULL,
  instructions text,
  sort_order int NOT NULL DEFAULT 0,
  UNIQUE (plan_id, day_index)
);

CREATE TABLE public.larsanapill_plan_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.larsanapill_weekly_plans (id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  day_index int NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, patient_id, day_index)
);

ALTER TABLE public.academy_quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.larsanapill_weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.larsanapill_weekly_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.larsanapill_plan_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY academy_quiz_pp ON public.academy_quiz_responses
  FOR ALL TO authenticated
  USING (public.is_staff() OR professional_id = public.current_professional_id())
  WITH CHECK (public.is_staff() OR professional_id = public.current_professional_id());

CREATE POLICY larsanapill_plans_read ON public.larsanapill_weekly_plans
  FOR SELECT TO authenticated
  USING (public.is_staff() OR (is_published = true AND public.current_user_role() = 'paciente'));

CREATE POLICY larsanapill_plans_staff ON public.larsanapill_weekly_plans
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]));

CREATE POLICY larsanapill_plan_days_read ON public.larsanapill_weekly_plan_days
  FOR SELECT TO authenticated
  USING (public.is_staff() OR public.current_user_role() = 'paciente');

CREATE POLICY larsanapill_plan_days_staff ON public.larsanapill_weekly_plan_days
  FOR ALL TO authenticated
  USING (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]))
  WITH CHECK (public.is_staff_role(ARRAY['admin', 'gestao']::public.user_role[]));

CREATE POLICY larsanapill_plan_progress_patient ON public.larsanapill_plan_progress
  FOR ALL TO authenticated
  USING (public.is_staff() OR patient_id = ANY (public.current_patient_ids()))
  WITH CHECK (public.is_staff() OR patient_id = ANY (public.current_patient_ids()));

-- Seed V1: full lesson placeholders M1-M5, PHIL exercise sample, weekly plans T1-T5
DO $$
DECLARE
  v_course_id uuid;
  v_mod record;
  v_guiados uuid;
BEGIN
  SELECT id INTO v_course_id FROM public.academy_courses WHERE slug = 'formacao-pp';

  IF v_course_id IS NOT NULL THEN
    FOR v_mod IN SELECT id, code FROM public.academy_modules WHERE course_id = v_course_id AND code IN ('M4', 'M5')
    LOOP
      INSERT INTO public.academy_lessons (module_id, slug, title, content_type, content, duration_seconds, sort_order, is_published)
      VALUES (
        v_mod.id,
        v_mod.code || '-intro',
        'Introdução — ' || v_mod.code,
        'richtext',
        '<p>Conteúdo do módulo ' || v_mod.code || '.</p>',
        900,
        1,
        true
      )
      ON CONFLICT (module_id, slug) DO NOTHING;
    END LOOP;
  END IF;

  SELECT id INTO v_guiados FROM public.larsanapill_categories WHERE code = 'P5';

  IF v_guiados IS NOT NULL THEN
    INSERT INTO public.larsanapill_contents (category_id, slug, title, content_type, content, duration_seconds, sort_order, is_published, metadata)
    VALUES (
      v_guiados,
      'g1-alongamento',
      'G1 — Alongamento matinal',
      'exercise_steps',
      NULL,
      480,
      1,
      true,
      '{"steps":[{"title":"Respire fundo","instruction":"Inspire pelo nariz por 4 segundos.","durationSeconds":15},{"title":"Estique os braços","instruction":"Estenda os braços acima da cabeça.","durationSeconds":30},{"title":"Rotação suave","instruction":"Gire o tronco levemente para cada lado.","durationSeconds":20}]}'::jsonb
    )
    ON CONFLICT (category_id, slug) DO NOTHING;
  END IF;

  INSERT INTO public.larsanapill_weekly_plans (slug, code, title, description, sessions_per_week, minutes_per_session, sort_order, is_published) VALUES
    ('t1-pos-queda', 'T1', 'Reabilitação pós-queda', 'Fortalecimento e equilíbrio', 3, 15, 1, true),
    ('t2-idoso-ativo', 'T2', 'Condicionamento idoso ativo', 'Manutenção funcional', 4, 20, 2, true),
    ('t3-pos-avc', 'T3', 'Fortalecimento pós-AVC', 'Mobilidade e marcha', 3, 15, 3, true),
    ('t4-lombalgia', 'T4', 'Lombalgia crônica', 'Alongamento e estabilização', 5, 10, 4, true),
    ('t5-neurologia', 'T5', 'Neurologia — marcha e equilíbrio', 'Propriocepção', 3, 18, 5, true)
  ON CONFLICT (slug) DO NOTHING;
END $$;
