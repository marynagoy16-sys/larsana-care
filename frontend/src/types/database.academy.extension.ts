import type { Json } from './database.types.generated'

type AcademyTable<T extends Record<string, unknown>> = {
  Row: T
  Insert: Partial<T> & Record<string, unknown>
  Update: Partial<T>
  Relationships: []
}

export type AcademyDatabaseTables = {
  academy_platform_settings: AcademyTable<{
    id: string
    gates_master_enabled: boolean
    academy_enabled: boolean
    active_preset: string
    updated_at: string
    updated_by: string | null
  }>
  academy_courses: AcademyTable<{
    id: string
    slug: string
    title: string
    description: string | null
    audience: string
    profession: string | null
    is_mandatory: boolean
    is_published: boolean
    sort_order: number
    estimated_minutes: number | null
    created_at: string
    updated_at: string
  }>
  academy_modules: AcademyTable<{
    id: string
    course_id: string
    code: string
    title: string
    description: string | null
    sort_order: number
    created_at: string
  }>
  academy_lessons: AcademyTable<{
    id: string
    module_id: string
    slug: string
    title: string
    description: string | null
    content_type: string
    content: string | null
    storage_path: string | null
    duration_seconds: number | null
    sort_order: number
    is_published: boolean
    metadata: Json
    created_at: string
    updated_at: string
  }>
  academy_enrollments: AcademyTable<{
    id: string
    course_id: string
    professional_id: string
    status: string
    enrolled_at: string
    completed_at: string | null
  }>
  academy_lesson_progress: AcademyTable<{
    id: string
    enrollment_id: string
    lesson_id: string
    progress_percent: number
    last_position_seconds: number
    completed_at: string | null
    updated_at: string
  }>
  academy_gate_rules: AcademyTable<{
    id: string
    gate_target: string
    is_enabled: boolean
    requirement_type: string
    course_id: string | null
    required_module_ids: string[]
    required_lesson_ids: string[]
    block_message: string | null
    effective_from: string | null
    effective_until: string | null
    updated_at: string
    updated_by: string | null
  }>
  academy_gate_rules_log: AcademyTable<{
    id: string
    gate_target: string | null
    preset: string | null
    previous_config: Json | null
    new_config: Json
    changed_by: string | null
    changed_at: string
  }>
  pp_academy_exemptions: AcademyTable<{
    id: string
    professional_id: string
    gate_target: string | null
    reason: string
    granted_by: string | null
    expires_at: string | null
    created_at: string
  }>
  larsanapill_categories: AcademyTable<{
    id: string
    slug: string
    code: string
    title: string
    description: string | null
    sort_order: number
    is_published: boolean
    created_at: string
  }>
  larsanapill_contents: AcademyTable<{
    id: string
    category_id: string
    slug: string
    title: string
    description: string | null
    content_type: string
    content: string | null
    storage_path: string | null
    duration_seconds: number | null
    sort_order: number
    is_published: boolean
    metadata: Json
    created_at: string
    updated_at: string
  }>
  larsanapill_content_progress: AcademyTable<{
    id: string
    patient_id: string
    content_id: string
    progress_percent: number
    completed_at: string | null
    updated_at: string
  }>
  larsanapill_weekly_plans: AcademyTable<{
    id: string
    slug: string
    code: string
    title: string
    description: string | null
    sessions_per_week: number
    minutes_per_session: number
    sort_order: number
    is_published: boolean
    metadata: Json
    created_at: string
  }>
  academy_certificates: AcademyTable<{
    id: string
    enrollment_id: string
    professional_id: string
    course_id: string
    storage_path: string | null
    issued_at: string
  }>
}

export type AcademyDatabaseFunctions = {
  pp_passes_academy_gate: {
    Args: { p_gate_target: string }
    Returns: boolean
  }
}
