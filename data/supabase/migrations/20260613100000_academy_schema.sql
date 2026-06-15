-- LarsanaCare: Academy + LarsanaPill schema
-- Migration: 20260613100000_academy_schema

CREATE TYPE public.academy_audience AS ENUM ('pp', 'paciente');

CREATE TYPE public.academy_content_type AS ENUM (
  'video',
  'pdf',
  'richtext',
  'quiz',
  'exercise_steps',
  'ebook'
);

CREATE TYPE public.academy_enrollment_status AS ENUM (
  'not_started',
  'in_progress',
  'completed'
);

CREATE TYPE public.academy_gate_target AS ENUM (
  'demands',
  'credenciamento_ativo',
  'paciente_p1',
  'paciente_pagamento'
);

CREATE TYPE public.academy_requirement_type AS ENUM (
  'full_course',
  'modules',
  'lessons',
  'none'
);

CREATE TYPE public.academy_gate_preset AS ENUM (
  'optional',
  'soft_m1m3',
  'full_m1m5',
  'demands_m5_only',
  'credenciamento_m5',
  'phil_onboarding',
  'custom'
);

CREATE TABLE public.academy_platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gates_master_enabled boolean NOT NULL DEFAULT true,
  academy_enabled boolean NOT NULL DEFAULT true,
  active_preset public.academy_gate_preset NOT NULL DEFAULT 'soft_m1m3',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL
);

INSERT INTO public.academy_platform_settings (gates_master_enabled, academy_enabled, active_preset)
VALUES (true, true, 'soft_m1m3');

CREATE TABLE public.academy_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  audience public.academy_audience NOT NULL DEFAULT 'pp',
  profession public.profession_type,
  is_mandatory boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  estimated_minutes int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.academy_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.academy_courses (id) ON DELETE CASCADE,
  code text NOT NULL,
  title text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, code)
);

CREATE TABLE public.academy_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.academy_modules (id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  description text,
  content_type public.academy_content_type NOT NULL DEFAULT 'video',
  content text,
  storage_path text,
  duration_seconds int,
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (module_id, slug)
);

CREATE TABLE public.academy_lesson_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.academy_lessons (id) ON DELETE CASCADE,
  title text NOT NULL,
  storage_path text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.academy_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.academy_courses (id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.professionals (id) ON DELETE CASCADE,
  status public.academy_enrollment_status NOT NULL DEFAULT 'not_started',
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (course_id, professional_id)
);

CREATE TABLE public.academy_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.academy_enrollments (id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.academy_lessons (id) ON DELETE CASCADE,
  progress_percent int NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  last_position_seconds int NOT NULL DEFAULT 0,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (enrollment_id, lesson_id)
);

CREATE TABLE public.academy_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.academy_enrollments (id) ON DELETE CASCADE UNIQUE,
  storage_path text,
  issued_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.academy_gate_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gate_target public.academy_gate_target NOT NULL UNIQUE,
  is_enabled boolean NOT NULL DEFAULT false,
  requirement_type public.academy_requirement_type NOT NULL DEFAULT 'none',
  course_id uuid REFERENCES public.academy_courses (id) ON DELETE SET NULL,
  required_module_ids uuid[] NOT NULL DEFAULT '{}',
  required_lesson_ids uuid[] NOT NULL DEFAULT '{}',
  block_message text,
  effective_from timestamptz,
  effective_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL
);

CREATE TABLE public.academy_gate_rules_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gate_target public.academy_gate_target,
  preset public.academy_gate_preset,
  previous_config jsonb,
  new_config jsonb NOT NULL,
  changed_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.pp_academy_exemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals (id) ON DELETE CASCADE,
  gate_target public.academy_gate_target,
  reason text NOT NULL,
  granted_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_pp_academy_exemptions_target
  ON public.pp_academy_exemptions (professional_id, gate_target)
  NULLS NOT DISTINCT;

CREATE TABLE public.larsanapill_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.larsanapill_contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.larsanapill_categories (id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  description text,
  content_type public.academy_content_type NOT NULL DEFAULT 'video',
  content text,
  storage_path text,
  duration_seconds int,
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, slug)
);

CREATE TABLE public.larsanapill_content_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES public.larsanapill_contents (id) ON DELETE CASCADE,
  progress_percent int NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (patient_id, content_id)
);

CREATE INDEX idx_academy_modules_course ON public.academy_modules (course_id, sort_order);
CREATE INDEX idx_academy_lessons_module ON public.academy_lessons (module_id, sort_order);
CREATE INDEX idx_academy_enrollments_professional ON public.academy_enrollments (professional_id);
CREATE INDEX idx_academy_lesson_progress_enrollment ON public.academy_lesson_progress (enrollment_id);
CREATE INDEX idx_larsanapill_contents_category ON public.larsanapill_contents (category_id, sort_order);
CREATE INDEX idx_larsanapill_progress_patient ON public.larsanapill_content_progress (patient_id);

ALTER TABLE public.staff_profiles
  ADD COLUMN IF NOT EXISTS can_manage_academy boolean NOT NULL DEFAULT false;

UPDATE public.staff_profiles
SET can_manage_academy = true
WHERE staff_role IN ('admin', 'gestao');
