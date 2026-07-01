import { supabase } from '@/lib/supabase'

export async function getCurrentProfessionalId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) throw error
  return data?.id ?? null
}

export async function getPublishedCourses(): Promise<Array<{
  id: string
  title: string
  description: string | null
  sort_order: number
  is_published: boolean
}>> {
  const { data, error } = await (supabase as any)
    .from('academy_courses')
    .select('id, title, description, sort_order, is_published')
    .eq('is_published', true)
    .eq('audience', 'pp')
    .order('sort_order')
  if (error) throw error
  return (data ?? []) as any
}

export async function getCourseModules(courseId: string): Promise<Array<{
  id: string
  title: string
  description: string | null
  sort_order: number
}>> {
  const { data, error } = await (supabase as any)
    .from('academy_modules')
    .select('id, title, description, sort_order')
    .eq('course_id', courseId)
    .order('sort_order')
  if (error) throw error
  return (data ?? []) as any
}

export async function getModuleLessons(moduleId: string): Promise<Array<{
  id: string
  title: string
  sort_order: number
  is_published: boolean
}>> {
  const { data, error } = await (supabase as any)
    .from('academy_lessons')
    .select('id, title, sort_order, is_published')
    .eq('module_id', moduleId)
    .eq('is_published', true)
    .order('sort_order')
  if (error) throw error
  return (data ?? []) as any
}

export async function getLessonById(lessonId: string): Promise<{
  id: string
  module_id: string
  title: string
  description: string | null
  content_type: string
  content: string | null
  sort_order: number
  course_id: string
} | null> {
  const { data, error } = await (supabase as any)
    .from('academy_lessons')
    .select('id, module_id, title, description, content_type, content, sort_order, academy_modules ( course_id )')
    .eq('id', lessonId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const row = data as any
  return {
    id: row.id,
    module_id: row.module_id,
    title: row.title,
    description: row.description,
    content_type: row.content_type,
    content: row.content,
    sort_order: row.sort_order,
    course_id: row.academy_modules?.course_id ?? '',
  }
}

export async function ensureEnrollment(courseId: string, professionalId: string): Promise<{ id: string; status: string }> {
  const { data: existing } = await (supabase as any)
    .from('academy_enrollments')
    .select('id, status')
    .eq('course_id', courseId)
    .eq('professional_id', professionalId)
    .maybeSingle()

  if (existing) return existing as any

  const { data, error } = await (supabase as any)
    .from('academy_enrollments')
    .insert({ course_id: courseId, professional_id: professionalId, status: 'in_progress' })
    .select('id, status')
    .single()
  if (error) throw error
  return data as any
}

export async function markLessonComplete(enrollmentId: string, lessonId: string): Promise<void> {
  const { error } = await (supabase as any).from('academy_lesson_progress').upsert(
    {
      enrollment_id: enrollmentId,
      lesson_id: lessonId,
      progress_percent: 100,
      last_position_seconds: 0,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'enrollment_id,lesson_id' },
  )
  if (error) throw error
}

export async function getCourseWithProgress(courseId: string, professionalId: string): Promise<{
  course: { id: string; title: string; description: string | null }
  enrollment: { id: string; status: string } | null
  modules: Array<{
    id: string
    title: string
    totalLessons: number
    completedLessons: number
  }>
  totalLessons: number
  completedLessons: number
}> {
  const { data: course, error: courseError } = await (supabase as any)
    .from('academy_courses')
    .select('id, title, description')
    .eq('id', courseId)
    .single()
  if (courseError) throw courseError

  const { data: enrollment } = await (supabase as any)
    .from('academy_enrollments')
    .select('id, status')
    .eq('course_id', courseId)
    .eq('professional_id', professionalId)
    .maybeSingle()

  const completedSet = new Set<string>()
  if (enrollment) {
    const { data: progress } = await (supabase as any)
      .from('academy_lesson_progress')
      .select('lesson_id, completed_at')
      .eq('enrollment_id', enrollment.id)
      .not('completed_at', 'is', null)
    ;(progress ?? []).forEach((p: any) => { if (p.completed_at) completedSet.add(p.lesson_id) })
  }

  const { data: modules } = await (supabase as any)
    .from('academy_modules')
    .select('id, title')
    .eq('course_id', courseId)
    .order('sort_order')

  const modulesWithProgress: any[] = []
  let totalLessons = 0
  let completedLessons = 0

  for (const mod of modules ?? []) {
    const { data: lessons } = await (supabase as any)
      .from('academy_lessons')
      .select('id')
      .eq('module_id', mod.id)
      .eq('is_published', true)
    const modCompleted = (lessons ?? []).filter((l: any) => completedSet.has(l.id)).length
    totalLessons += (lessons ?? []).length
    completedLessons += modCompleted
    modulesWithProgress.push({
      id: mod.id,
      title: mod.title,
      totalLessons: (lessons ?? []).length,
      completedLessons: modCompleted,
    })
  }

  return {
    course: course as any,
    enrollment: enrollment as any,
    modules: modulesWithProgress,
    totalLessons,
    completedLessons,
  }
}

export async function getCertificates(professionalId: string): Promise<Array<{
  id: string
  course_title: string
  issued_at: string
  certificate_url: string | null
}>> {
  const { data, error } = await (supabase as any)
    .from('academy_enrollments')
    .select('id, status, completed_at, academy_courses ( title )')
    .eq('professional_id', professionalId)
    .eq('status', 'completed')
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((e: any) => ({
    id: e.id,
    course_title: e.academy_courses?.title ?? 'Curso',
    issued_at: e.completed_at,
    certificate_url: null,
  }))
}
