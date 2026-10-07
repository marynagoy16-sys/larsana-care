import { z } from 'zod'
import { requiredString } from '@/schemas/common'

export const courseFormSchema = z.object({
  slug: z.string().min(1, 'Slug é obrigatório').regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífens'),
  title: requiredString('Título'),
  description: z.string().optional(),
  audience: z.enum(['pp', 'paciente']),
  is_mandatory: z.boolean(),
  is_published: z.boolean(),
  sort_order: z.coerce.number().int().min(0),
  estimated_minutes: z.coerce.number().int().min(0).optional().nullable(),
  points_award: z.coerce.number().int().min(0).default(200),
})

export const moduleFormSchema = z.object({
  code: requiredString('Código'),
  title: requiredString('Título'),
  description: z.string().optional(),
  sort_order: z.coerce.number().int().min(0),
})

export const lessonFormSchema = z.object({
  slug: z.string().min(1, 'Slug é obrigatório').regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífens'),
  title: requiredString('Título'),
  description: z.string().optional(),
  content_type: z.enum(['video', 'pdf', 'richtext', 'quiz', 'exercise_steps', 'ebook']),
  content: z.string().optional().nullable(),
  storage_path: z.string().optional().nullable(),
  duration_seconds: z.coerce.number().int().min(0).optional().nullable(),
  sort_order: z.coerce.number().int().min(0),
  is_published: z.boolean(),
})

export const categoryFormSchema = z.object({
  slug: z.string().min(1, 'Slug é obrigatório').regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífens'),
  code: requiredString('Código'),
  title: requiredString('Título'),
  description: z.string().optional(),
  sort_order: z.coerce.number().int().min(0),
  is_published: z.boolean(),
})

export const contentFormSchema = lessonFormSchema

export const weeklyPlanFormSchema = z.object({
  slug: z.string().min(1, 'Slug é obrigatório').regex(/^[a-z0-9-]+$/, 'Slug inválido'),
  code: requiredString('Código'),
  title: requiredString('Título'),
  description: z.string().optional(),
  sessions_per_week: z.coerce.number().int().min(1).max(7),
  minutes_per_session: z.coerce.number().int().min(1),
  sort_order: z.coerce.number().int().min(0),
  is_published: z.boolean(),
})

export const exerciseStepSchema = z.object({
  title: requiredString('Título do passo'),
  instruction: requiredString('Instrução'),
  durationSeconds: z.coerce.number().int().min(5),
})

export const quizQuestionSchema = z.object({
  question: requiredString('Pergunta'),
  options: z.array(z.string().min(1)).min(2),
  correctIndex: z.coerce.number().int().min(0),
})

export type CourseFormValues = z.infer<typeof courseFormSchema>
export type ModuleFormValues = z.infer<typeof moduleFormSchema>
export type LessonFormValues = z.infer<typeof lessonFormSchema>
export type CategoryFormValues = z.infer<typeof categoryFormSchema>
export type ContentFormValues = z.infer<typeof contentFormSchema>
export type WeeklyPlanFormValues = z.infer<typeof weeklyPlanFormSchema>
