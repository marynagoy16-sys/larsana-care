import { supabase } from '@/lib/supabase'
import type { Json } from '@/types/database'
import type {
  AcademyCourse,
  AcademyLesson,
  AcademyModule,
  LarsanaPillCategory,
  LarsanaPillContent,
  LarsanaPillWeeklyPlan,
  LarsanaPillWeeklyPlanDay,
} from '@/types/academy'

export const ACADEMY_CONTENT_BUCKET = 'academy-content'
const MAX_MEDIA_SIZE = 100 * 1024 * 1024
const ALLOWED_MEDIA_MIME = [
  'video/mp4',
  'video/webm',
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
]

export const academyAdminKeys = {
  all: ['admin', 'academy'] as const,
  courses: ['admin', 'academy', 'courses'] as const,
  course: (id: string) => ['admin', 'academy', 'course', id] as const,
  modules: (courseId: string) => ['admin', 'academy', 'modules', courseId] as const,
  lessons: (moduleId: string) => ['admin', 'academy', 'lessons', moduleId] as const,
  courseStats: (courseId: string) => ['admin', 'academy', 'course-stats', courseId] as const,
  enrollments: ['admin', 'academy', 'enrollments'] as const,
  enrollmentDetail: (id: string) => ['admin', 'academy', 'enrollment', id] as const,
  dashboard: ['admin', 'academy', 'dashboard'] as const,
}

export const larsanapillAdminKeys = {
  all: ['admin', 'larsanapill'] as const,
  categories: ['admin', 'larsanapill', 'categories'] as const,
  category: (id: string) => ['admin', 'larsanapill', 'category', id] as const,
  contents: (categoryId: string) => ['admin', 'larsanapill', 'contents', categoryId] as const,
  weeklyPlans: ['admin', 'larsanapill', 'weekly-plans'] as const,
  planDays: (planId: string) => ['admin', 'larsanapill', 'plan-days', planId] as const,
}

export async function uploadAcademyMedia(file: File, folder: string): Promise<string> {
  if (!ALLOWED_MEDIA_MIME.includes(file.type)) {
    throw new Error('Tipo de arquivo não permitido. Use MP4, WebM, PDF ou imagem.')
  }
  if (file.size > MAX_MEDIA_SIZE) {
    throw new Error('Arquivo excede o limite de 100 MB.')
  }

  const storagePath = `${folder}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`
  const { error } = await supabase.storage.from(ACADEMY_CONTENT_BUCKET).upload(storagePath, file, { upsert: true })
  if (error) throw error

  const { data } = supabase.storage.from(ACADEMY_CONTENT_BUCKET).getPublicUrl(storagePath)
  return data.publicUrl || storagePath
}

export async function listAdminCourses(): Promise<AcademyCourse[]> {
  const { data, error } = await supabase.from('academy_courses').select('*').order('sort_order')
  if (error) throw error
  return (data ?? []) as AcademyCourse[]
}

export async function getAdminCourse(id: string): Promise<AcademyCourse> {
  const { data, error } = await supabase.from('academy_courses').select('*').eq('id', id).single()
  if (error) throw error
  return data as AcademyCourse
}

export async function createCourse(values: Partial<AcademyCourse>) {
  const { data, error } = await supabase.from('academy_courses').insert(values as never).select().single()
  if (error) throw error
  return data as AcademyCourse
}

export async function updateCourse(id: string, values: Partial<AcademyCourse>) {
  const { data, error } = await supabase.from('academy_courses').update(values as never).eq('id', id).select().single()
  if (error) throw error
  return data as AcademyCourse
}

export async function deleteCourse(id: string) {
  const { error } = await supabase.from('academy_courses').delete().eq('id', id)
  if (error) throw error
}

export async function listAdminModules(courseId: string): Promise<AcademyModule[]> {
  const { data, error } = await supabase
    .from('academy_modules')
    .select('*')
    .eq('course_id', courseId)
    .order('sort_order')
  if (error) throw error
  return (data ?? []) as AcademyModule[]
}

export async function createModule(values: Partial<AcademyModule>) {
  const { data, error } = await supabase.from('academy_modules').insert(values as never).select().single()
  if (error) throw error
  return data as AcademyModule
}

export async function updateModule(id: string, values: Partial<AcademyModule>) {
  const { data, error } = await supabase.from('academy_modules').update(values as never).eq('id', id).select().single()
  if (error) throw error
  return data as AcademyModule
}

export async function deleteModule(id: string) {
  const { error } = await supabase.from('academy_modules').delete().eq('id', id)
  if (error) throw error
}

export async function listAdminLessons(moduleId: string): Promise<AcademyLesson[]> {
  const { data, error } = await supabase
    .from('academy_lessons')
    .select('*')
    .eq('module_id', moduleId)
    .order('sort_order')
  if (error) throw error
  return (data ?? []) as AcademyLesson[]
}

export async function getAdminLesson(id: string): Promise<AcademyLesson> {
  const { data, error } = await supabase.from('academy_lessons').select('*').eq('id', id).single()
  if (error) throw error
  return data as AcademyLesson
}

export async function createLesson(values: {
  module_id: string
  slug: string
  title: string
  description?: string | null
  content_type: AcademyLesson['content_type']
  content?: string | null
  storage_path?: string | null
  duration_seconds?: number | null
  sort_order?: number
  is_published?: boolean
  metadata?: Record<string, unknown>
}) {
  const { data, error } = await supabase
    .from('academy_lessons')
    .insert({ ...values, metadata: (values.metadata ?? {}) as Json })
    .select()
    .single()
  if (error) throw error
  return data as AcademyLesson
}

export async function updateLesson(
  id: string,
  values: Partial<{
    slug: string
    title: string
    description: string | null
    content_type: AcademyLesson['content_type']
    content: string | null
    storage_path: string | null
    duration_seconds: number | null
    sort_order: number
    is_published: boolean
    metadata: Record<string, unknown>
  }>,
) {
  const payload = { ...values, ...(values.metadata ? { metadata: values.metadata as Json } : {}) }
  const { data, error } = await supabase.from('academy_lessons').update(payload as never).eq('id', id).select().single()
  if (error) throw error
  return data as AcademyLesson
}

export async function deleteLesson(id: string) {
  const { error } = await supabase.from('academy_lessons').delete().eq('id', id)
  if (error) throw error
}

export async function getCourseStats(courseId: string) {
  const modules = await listAdminModules(courseId)
  let publishedLessons = 0
  let totalLessons = 0
  let totalDuration = 0

  for (const mod of modules) {
    const lessons = await listAdminLessons(mod.id)
    totalLessons += lessons.length
    for (const l of lessons) {
      if (l.is_published) publishedLessons++
      totalDuration += l.duration_seconds ?? 0
    }
  }

  return { moduleCount: modules.length, totalLessons, publishedLessons, totalDurationMinutes: Math.round(totalDuration / 60) }
}

export async function listAdminEnrollments() {
  const { data, error } = await supabase
    .from('academy_enrollments')
    .select('*')
    .order('enrolled_at', { ascending: false })
  if (error) throw error

  const enrollments = data ?? []
  if (enrollments.length === 0) return []

  const professionalIds = [...new Set(enrollments.map((e) => e.professional_id))]
  const courseIds = [...new Set(enrollments.map((e) => e.course_id))]

  const [{ data: professionals }, { data: courses }] = await Promise.all([
    supabase.from('professionals').select('id, full_name').in('id', professionalIds),
    supabase.from('academy_courses').select('id, title').in('id', courseIds),
  ])

  const proMap = new Map((professionals ?? []).map((p) => [p.id, p]))
  const courseMap = new Map((courses ?? []).map((c) => [c.id, c]))

  return enrollments.map((e) => ({
    ...e,
    professionals: proMap.get(e.professional_id) ?? null,
    academy_courses: courseMap.get(e.course_id) ?? null,
  }))
}

export async function getEnrollmentDetail(enrollmentId: string) {
  const { data: enrollment, error } = await supabase
    .from('academy_enrollments')
    .select('*')
    .eq('id', enrollmentId)
    .single()
  if (error) throw error

  const [{ data: professional }, { data: course }] = await Promise.all([
    supabase.from('professionals').select('full_name').eq('id', enrollment.professional_id).maybeSingle(),
    supabase.from('academy_courses').select('title, id').eq('id', enrollment.course_id).maybeSingle(),
  ])

  const enrichedEnrollment = {
    ...enrollment,
    professionals: professional,
    academy_courses: course,
  }

  const courseId = course?.id
  const modules = courseId ? await listAdminModules(courseId) : []
  const progressRows: Array<{ lesson_id: string; completed_at: string | null }> = []

  const { data: progress } = await supabase
    .from('academy_lesson_progress')
    .select('lesson_id, completed_at')
    .eq('enrollment_id', enrollmentId)

  for (const p of progress ?? []) progressRows.push(p)

  const completedSet = new Set(progressRows.filter((p) => p.completed_at).map((p) => p.lesson_id))

  const modulesWithLessons = await Promise.all(
    modules.map(async (mod) => {
      const lessons = await listAdminLessons(mod.id)
      return {
        ...mod,
        lessons: lessons.map((l) => ({ ...l, completed: completedSet.has(l.id) })),
        completedCount: lessons.filter((l) => completedSet.has(l.id)).length,
        totalCount: lessons.length,
      }
    }),
  )

  return { enrollment: enrichedEnrollment, modules: modulesWithLessons }
}

export async function getAcademyDashboardStats() {
  const [courses, enrollments, completed, categories] = await Promise.all([
    supabase.from('academy_courses').select('id', { count: 'exact', head: true }),
    supabase.from('academy_enrollments').select('id', { count: 'exact', head: true }),
    supabase.from('academy_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('larsanapill_categories').select('id', { count: 'exact', head: true }),
  ])

  return {
    courses: courses.count ?? 0,
    enrollments: enrollments.count ?? 0,
    completed: completed.count ?? 0,
    categories: categories.count ?? 0,
  }
}

// LarsanaPill admin
export async function listAdminCategories(): Promise<LarsanaPillCategory[]> {
  const { data, error } = await supabase.from('larsanapill_categories').select('*').order('sort_order')
  if (error) throw error
  return (data ?? []) as LarsanaPillCategory[]
}

export async function getAdminCategory(id: string): Promise<LarsanaPillCategory> {
  const { data, error } = await supabase.from('larsanapill_categories').select('*').eq('id', id).single()
  if (error) throw error
  return data as LarsanaPillCategory
}

export async function createCategory(values: Partial<LarsanaPillCategory>) {
  const { data, error } = await supabase.from('larsanapill_categories').insert(values as never).select().single()
  if (error) throw error
  return data as LarsanaPillCategory
}

export async function updateCategory(id: string, values: Partial<LarsanaPillCategory>) {
  const { data, error } = await supabase.from('larsanapill_categories').update(values as never).eq('id', id).select().single()
  if (error) throw error
  return data as LarsanaPillCategory
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from('larsanapill_categories').delete().eq('id', id)
  if (error) throw error
}

export async function listAdminContents(categoryId: string): Promise<LarsanaPillContent[]> {
  const { data, error } = await supabase
    .from('larsanapill_contents')
    .select('*')
    .eq('category_id', categoryId)
    .order('sort_order')
  if (error) throw error
  return (data ?? []) as LarsanaPillContent[]
}

export async function getAdminContent(id: string): Promise<LarsanaPillContent> {
  const { data, error } = await supabase.from('larsanapill_contents').select('*').eq('id', id).single()
  if (error) throw error
  return data as LarsanaPillContent
}

export async function createContent(values: {
  category_id: string
  slug: string
  title: string
  description?: string | null
  content_type: LarsanaPillContent['content_type']
  content?: string | null
  storage_path?: string | null
  duration_seconds?: number | null
  sort_order?: number
  is_published?: boolean
  metadata?: Record<string, unknown>
}) {
  const { data, error } = await supabase
    .from('larsanapill_contents')
    .insert({ ...values, metadata: (values.metadata ?? {}) as Json })
    .select()
    .single()
  if (error) throw error
  return data as LarsanaPillContent
}

export async function updateContent(
  id: string,
  values: Partial<{
    slug: string
    title: string
    description: string | null
    content_type: LarsanaPillContent['content_type']
    content: string | null
    storage_path: string | null
    duration_seconds: number | null
    sort_order: number
    is_published: boolean
    metadata: Record<string, unknown>
  }>,
) {
  const payload = { ...values, ...(values.metadata ? { metadata: values.metadata as Json } : {}) }
  const { data, error } = await supabase.from('larsanapill_contents').update(payload as never).eq('id', id).select().single()
  if (error) throw error
  return data as LarsanaPillContent
}

export async function deleteContent(id: string) {
  const { error } = await supabase.from('larsanapill_contents').delete().eq('id', id)
  if (error) throw error
}

export async function listAdminWeeklyPlans(): Promise<LarsanaPillWeeklyPlan[]> {
  const { data, error } = await supabase.from('larsanapill_weekly_plans').select('*').order('sort_order')
  if (error) throw error
  return (data ?? []) as LarsanaPillWeeklyPlan[]
}

export async function createWeeklyPlan(values: Partial<LarsanaPillWeeklyPlan>) {
  const { data, error } = await supabase.from('larsanapill_weekly_plans').insert(values as never).select().single()
  if (error) throw error
  return data as LarsanaPillWeeklyPlan
}

export async function updateWeeklyPlan(id: string, values: Partial<LarsanaPillWeeklyPlan>) {
  const { data, error } = await supabase.from('larsanapill_weekly_plans').update(values as never).eq('id', id).select().single()
  if (error) throw error
  return data as LarsanaPillWeeklyPlan
}

export async function deleteWeeklyPlan(id: string) {
  const { error } = await supabase.from('larsanapill_weekly_plans').delete().eq('id', id)
  if (error) throw error
}

export async function listPlanDays(planId: string): Promise<LarsanaPillWeeklyPlanDay[]> {
  const { data, error } = await supabase
    .from('larsanapill_weekly_plan_days')
    .select('*')
    .eq('plan_id', planId)
    .order('day_index')
  if (error) throw error
  return (data ?? []) as LarsanaPillWeeklyPlanDay[]
}

export async function upsertPlanDay(values: {
  id?: string
  plan_id: string
  day_index: number
  title: string
  content_id?: string | null
  instructions?: string | null
  sort_order?: number
}) {
  const { data, error } = await supabase
    .from('larsanapill_weekly_plan_days')
    .upsert(
      {
        id: values.id,
        plan_id: values.plan_id,
        day_index: values.day_index,
        title: values.title,
        content_id: values.content_id ?? null,
        instructions: values.instructions ?? null,
        sort_order: values.sort_order ?? values.day_index,
      } as never,
      { onConflict: 'plan_id,day_index' },
    )
    .select()
    .single()
  if (error) throw error
  return data as LarsanaPillWeeklyPlanDay
}

export async function deletePlanDay(id: string) {
  const { error } = await supabase.from('larsanapill_weekly_plan_days').delete().eq('id', id)
  if (error) throw error
}
