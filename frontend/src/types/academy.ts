export type AcademyGateTarget = 'demands' | 'credenciamento_ativo' | 'paciente_p1' | 'paciente_pagamento'
export type AcademyGatePreset = 'optional' | 'soft_m1m3' | 'full_m1m5' | 'demands_m5_only' | 'credenciamento_m5' | 'phil_onboarding' | 'custom'
export type AcademyContentType = 'video' | 'pdf' | 'richtext' | 'quiz' | 'exercise_steps' | 'ebook'
export type AcademyEnrollmentStatus = 'not_started' | 'in_progress' | 'completed'
export type AcademyRequirementType = 'full_course' | 'modules' | 'lessons' | 'none'

export interface AcademyCourse {
  id: string
  slug: string
  title: string
  description: string | null
  audience: 'pp' | 'paciente'
  is_mandatory: boolean
  is_published: boolean
  sort_order: number
  estimated_minutes: number | null
  points_award?: number | null
}

export interface AcademyModule {
  id: string
  course_id: string
  code: string
  title: string
  description: string | null
  sort_order: number
}

export interface AcademyLesson {
  id: string
  module_id: string
  slug: string
  title: string
  description: string | null
  content_type: AcademyContentType
  content: string | null
  storage_path: string | null
  duration_seconds: number | null
  sort_order: number
  is_published: boolean
  metadata: Record<string, unknown>
}

export interface AcademyEnrollment {
  id: string
  course_id: string
  professional_id: string
  status: AcademyEnrollmentStatus
  enrolled_at: string
  completed_at: string | null
}

export interface AcademyLessonProgress {
  id: string
  enrollment_id: string
  lesson_id: string
  progress_percent: number
  last_position_seconds: number
  completed_at: string | null
}

export interface AcademyPlatformSettings {
  id: string
  gates_master_enabled: boolean
  academy_enabled: boolean
  active_preset: AcademyGatePreset
}

export interface AcademyGateRule {
  id: string
  gate_target: AcademyGateTarget
  is_enabled: boolean
  requirement_type: AcademyRequirementType
  course_id: string | null
  required_module_ids: string[]
  required_lesson_ids: string[]
  block_message: string | null
  effective_from: string | null
  effective_until: string | null
}

export interface AcademyGateRulesLog {
  id: string
  gate_target: AcademyGateTarget | null
  preset: AcademyGatePreset | null
  previous_config: Record<string, unknown> | null
  new_config: Record<string, unknown>
  changed_by: string | null
  changed_at: string
}

export interface PpAcademyExemption {
  id: string
  professional_id: string
  gate_target: AcademyGateTarget | null
  reason: string
  expires_at: string | null
  created_at: string
}

export interface LarsanaPillCategory {
  id: string
  slug: string
  code: string
  title: string
  description: string | null
  sort_order: number
  is_published: boolean
}

export interface LarsanaPillContent {
  id: string
  category_id: string
  slug: string
  title: string
  description: string | null
  content_type: AcademyContentType
  content: string | null
  storage_path: string | null
  duration_seconds: number | null
  sort_order: number
  is_published: boolean
  metadata: Record<string, unknown>
}

export interface LarsanaPillWeeklyPlan {
  id: string
  slug: string
  code: string
  title: string
  description: string | null
  sessions_per_week: number
  minutes_per_session: number
  sort_order: number
  is_published: boolean
  metadata?: Record<string, unknown>
}

export interface LarsanaPillWeeklyPlanSalesContext {
  plan: LarsanaPillWeeklyPlan
  days: LarsanaPillWeeklyPlanDay[]
  vslContent: LarsanaPillContent | null
  contentById: Record<string, LarsanaPillContent>
}

export interface LarsanaPillWeeklyPlanDay {
  id: string
  plan_id: string
  day_index: number
  title: string
  content_id: string | null
  instructions: string | null
  sort_order: number
}

export interface LarsanaPillWeeklyPlanPlayerContext {
  plan: LarsanaPillWeeklyPlan
  days: LarsanaPillWeeklyPlanDay[]
  groups: ContentPlayerGroup[]
  flatItems: FlatContentItem[]
  completedDayIndices: Set<number>
  completedItemIds: Set<string>
  totalItems: number
  completedItems: number
}

export interface ExerciseStep {
  title: string
  instruction: string
  durationSeconds: number
}

export interface AcademyModuleWithProgress extends AcademyModule {
  totalLessons: number
  completedLessons: number
  lessons: AcademyLesson[]
}

export interface FlatContentItem {
  groupId: string
  groupTitle: string
  groupCode?: string
  itemId: string
  title: string
  contentType: AcademyContentType
  sortOrder: number
  index: number
  dayIndex?: number
  linkedContentId?: string | null
  instructions?: string | null
}

export interface ContentGroupProgress {
  groupId: string
  total: number
  completed: number
  percent: number
  status: 'pending' | 'in_progress' | 'completed'
}

export interface ContentPlayerGroup {
  id: string
  code?: string
  title: string
  description?: string | null
  items: Array<{
    id: string
    title: string
    contentType: AcademyContentType
    sortOrder: number
  }>
}

export interface AcademyCoursePlayerContext {
  course: AcademyCourse
  enrollment: AcademyEnrollment
  groups: ContentPlayerGroup[]
  flatItems: FlatContentItem[]
  completedItemIds: Set<string>
  totalItems: number
  completedItems: number
}

export interface LarsanaPillCategoryPlayerContext {
  category: LarsanaPillCategory
  groups: ContentPlayerGroup[]
  flatItems: FlatContentItem[]
  completedItemIds: Set<string>
  totalItems: number
  completedItems: number
}

export interface GateImpactPreview {
  totalActivePp: number
  blockedCount: number
  sampleBlocked: Array<{ professionalId: string; name: string; pendingModule: string }>
}

export const GATE_PRESET_LABELS: Record<AcademyGatePreset, string> = {
  optional: 'Academy opcional',
  soft_m1m3: 'Formação básica (M1–M3)',
  full_m1m5: 'Trilha completa (M1–M5)',
  demands_m5_only: 'Só M5 para demandas',
  credenciamento_m5: 'M5 + credenciamento',
  phil_onboarding: 'PHIL onboarding paciente',
  custom: 'Personalizado',
}

export const GATE_TARGET_LABELS: Record<AcademyGateTarget, string> = {
  demands: 'Demandas (PP)',
  credenciamento_ativo: 'Credenciamento ativo',
  paciente_p1: 'Onboarding paciente (P1)',
  paciente_pagamento: 'Pagamento de ciclo',
}
