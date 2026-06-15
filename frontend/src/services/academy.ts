import { supabase } from '@/lib/supabase'
import type { Json } from '@/types/database'
import type {
  AcademyCourse,
  AcademyCoursePlayerContext,
  AcademyEnrollment,
  AcademyGatePreset,
  AcademyGateRule,
  AcademyGateRulesLog,
  AcademyGateTarget,
  AcademyLesson,
  AcademyLessonProgress,
  AcademyModule,
  AcademyModuleWithProgress,
  AcademyPlatformSettings,
  GateImpactPreview,
  PpAcademyExemption,
} from '@/types/academy'
import {
  academyModulesToGroups,
  flattenAcademyLessons,
  getContinueItemId,
} from '@/lib/content/lessonNavigation'

export async function getAcademySettings(): Promise<AcademyPlatformSettings | null> {
  const { data, error } = await supabase.from('academy_platform_settings').select('*').limit(1).maybeSingle()
  if (error) throw error
  return data as AcademyPlatformSettings | null
}

export async function getGateRules(): Promise<AcademyGateRule[]> {
  const { data, error } = await supabase.from('academy_gate_rules').select('*').order('gate_target')
  if (error) throw error
  return (data ?? []) as AcademyGateRule[]
}

export async function getDemandsGateRule(): Promise<AcademyGateRule | null> {
  const { data, error } = await supabase
    .from('academy_gate_rules')
    .select('*')
    .eq('gate_target', 'demands')
    .maybeSingle()
  if (error) throw error
  return data as AcademyGateRule | null
}

export async function getPublishedCourses(): Promise<AcademyCourse[]> {
  const { data, error } = await supabase
    .from('academy_courses')
    .select('*')
    .eq('is_published', true)
    .eq('audience', 'pp')
    .order('sort_order')
  if (error) throw error
  return (data ?? []) as AcademyCourse[]
}

export async function getCourseModules(courseId: string): Promise<AcademyModule[]> {
  const { data, error } = await supabase
    .from('academy_modules')
    .select('*')
    .eq('course_id', courseId)
    .order('sort_order')
  if (error) throw error
  return (data ?? []) as AcademyModule[]
}

export async function getModuleLessons(moduleId: string): Promise<AcademyLesson[]> {
  const { data, error } = await supabase
    .from('academy_lessons')
    .select('*')
    .eq('module_id', moduleId)
    .eq('is_published', true)
    .order('sort_order')
  if (error) throw error
  return (data ?? []) as AcademyLesson[]
}

export async function getLessonById(lessonId: string): Promise<AcademyLesson | null> {
  const { data, error } = await supabase.from('academy_lessons').select('*').eq('id', lessonId).maybeSingle()
  if (error) throw error
  return data as AcademyLesson | null
}

export async function getProfessionalId(): Promise<string | null> {
  const { data, error } = await supabase.from('professionals').select('id').maybeSingle()
  if (error) throw error
  return data?.id ?? null
}

export async function ensureEnrollment(courseId: string, professionalId: string): Promise<AcademyEnrollment> {
  const { data: existing } = await supabase
    .from('academy_enrollments')
    .select('*')
    .eq('course_id', courseId)
    .eq('professional_id', professionalId)
    .maybeSingle()

  if (existing) return existing as AcademyEnrollment

  const { data, error } = await supabase
    .from('academy_enrollments')
    .insert({ course_id: courseId, professional_id: professionalId, status: 'in_progress' })
    .select()
    .single()
  if (error) throw error
  return data as AcademyEnrollment
}

export async function getEnrollmentProgress(enrollmentId: string): Promise<AcademyLessonProgress[]> {
  const { data, error } = await supabase
    .from('academy_lesson_progress')
    .select('*')
    .eq('enrollment_id', enrollmentId)
  if (error) throw error
  return (data ?? []) as AcademyLessonProgress[]
}

export async function markLessonComplete(
  enrollmentId: string,
  lessonId: string,
  lastPositionSeconds = 0,
): Promise<void> {
  const { error } = await supabase.from('academy_lesson_progress').upsert(
    {
      enrollment_id: enrollmentId,
      lesson_id: lessonId,
      progress_percent: 100,
      last_position_seconds: lastPositionSeconds,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'enrollment_id,lesson_id' },
  )
  if (error) throw error
}

export async function submitQuizResponse(
  professionalId: string,
  lessonId: string,
  score: number,
  answers: Record<string, unknown>,
  passed = false,
): Promise<void> {
  const { error } = await supabase.from('academy_quiz_responses').upsert(
    {
      professional_id: professionalId,
      lesson_id: lessonId,
      score,
      passed,
      answers: answers as Json,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: 'lesson_id,professional_id' },
  )
  if (error) throw error
}

export async function getCourseWithProgress(courseId: string, professionalId: string): Promise<{
  course: AcademyCourse
  enrollment: AcademyEnrollment
  modules: AcademyModuleWithProgress[]
  totalLessons: number
  completedLessons: number
}> {
  const { data: course, error: courseError } = await supabase
    .from('academy_courses')
    .select('*')
    .eq('id', courseId)
    .single()
  if (courseError) throw courseError

  const enrollment = await ensureEnrollment(courseId, professionalId)
  const progress = await getEnrollmentProgress(enrollment.id)
  const completedSet = new Set(progress.filter((p) => p.completed_at).map((p) => p.lesson_id))

  const modules = await getCourseModules(courseId)
  const modulesWithProgress: AcademyModuleWithProgress[] = []
  let totalLessons = 0
  let completedLessons = 0

  for (const mod of modules) {
    const lessons = await getModuleLessons(mod.id)
    const modCompleted = lessons.filter((l) => completedSet.has(l.id)).length
    totalLessons += lessons.length
    completedLessons += modCompleted
    modulesWithProgress.push({ ...mod, totalLessons: lessons.length, completedLessons: modCompleted, lessons })
  }

  const status =
    completedLessons === 0
      ? 'not_started'
      : completedLessons >= totalLessons && totalLessons > 0
        ? 'completed'
        : 'in_progress'

  if (enrollment.status !== status) {
    await supabase
      .from('academy_enrollments')
      .update({
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', enrollment.id)
    enrollment.status = status
  }

  return {
    course: course as AcademyCourse,
    enrollment,
    modules: modulesWithProgress,
    totalLessons,
    completedLessons,
  }
}

export async function getLessonCompletionSet(enrollmentId: string): Promise<Set<string>> {
  const progress = await getEnrollmentProgress(enrollmentId)
  return new Set(progress.filter((p) => p.completed_at).map((p) => p.lesson_id))
}

export async function getCoursePlayerContext(
  courseId: string,
  professionalId: string,
): Promise<AcademyCoursePlayerContext> {
  const data = await getCourseWithProgress(courseId, professionalId)
  const completedItemIds = await getLessonCompletionSet(data.enrollment.id)
  const flatItems = flattenAcademyLessons(data.modules)
  return {
    course: data.course,
    enrollment: data.enrollment,
    groups: academyModulesToGroups(data.modules),
    flatItems,
    completedItemIds,
    totalItems: data.totalLessons,
    completedItems: data.completedLessons,
  }
}

export function getContinueLessonId(
  flatItems: ReturnType<typeof flattenAcademyLessons>,
  completedIds: Set<string>,
): string | null {
  return getContinueItemId(flatItems, completedIds)
}

export async function checkPpPassesGate(gateTarget: AcademyGateTarget): Promise<boolean> {
  const { data, error } = await supabase.rpc('pp_passes_academy_gate', { p_gate_target: gateTarget })
  if (error) throw error
  return Boolean(data)
}

export async function updateAcademySettings(values: Partial<AcademyPlatformSettings> & { updated_by?: string }) {
  const settings = await getAcademySettings()
  if (!settings) throw new Error('Configurações não encontradas')
  const { data, error } = await supabase
    .from('academy_platform_settings')
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq('id', settings.id)
    .select()
    .single()
  if (error) throw error
  return data as AcademyPlatformSettings
}

export async function updateGateRule(id: string, values: Partial<AcademyGateRule>) {
  const { data, error } = await supabase
    .from('academy_gate_rules')
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as AcademyGateRule
}

export async function applyGatePreset(
  preset: AcademyGatePreset,
  courseId: string,
  moduleIdsByCode: Record<string, string>,
  userId: string,
): Promise<void> {
  const settings = await getAcademySettings()
  const rules = await getGateRules()
  const previous = { settings, rules }

  const m1 = moduleIdsByCode.M1
  const m2 = moduleIdsByCode.M2
  const m3 = moduleIdsByCode.M3
  const m4 = moduleIdsByCode.M4
  const m5 = moduleIdsByCode.M5

  const demandsRule = rules.find((r) => r.gate_target === 'demands')
  const credRule = rules.find((r) => r.gate_target === 'credenciamento_ativo')
  const p1Rule = rules.find((r) => r.gate_target === 'paciente_p1')

  if (preset === 'optional') {
    await updateAcademySettings({ gates_master_enabled: false, active_preset: preset, updated_by: userId })
  } else {
    await updateAcademySettings({ gates_master_enabled: true, active_preset: preset, updated_by: userId })

    if (demandsRule) {
      const moduleMap: Record<AcademyGatePreset, string[]> = {
        optional: [],
        soft_m1m3: [m1, m2, m3].filter(Boolean),
        full_m1m5: [m1, m2, m3, m4, m5].filter(Boolean),
        demands_m5_only: [m5].filter(Boolean),
        credenciamento_m5: [m1, m2, m3, m4, m5].filter(Boolean),
        phil_onboarding: [],
        custom: demandsRule.required_module_ids,
      }
      await updateGateRule(demandsRule.id, {
        is_enabled: preset !== 'phil_onboarding',
        requirement_type: 'modules',
        course_id: courseId,
        required_module_ids: moduleMap[preset],
        block_message:
          preset === 'full_m1m5' || preset === 'credenciamento_m5'
            ? 'Conclua a Formação PP completa para receber novas demandas.'
            : preset === 'demands_m5_only'
              ? 'Conclua o módulo M5 na Academy para receber novas demandas.'
              : 'Conclua os módulos M1 a M3 na Academy para receber novas demandas.',
      })
    }

    if (credRule) {
      await updateGateRule(credRule.id, {
        is_enabled: preset === 'credenciamento_m5',
        requirement_type: preset === 'credenciamento_m5' ? 'modules' : 'none',
        course_id: preset === 'credenciamento_m5' ? courseId : null,
        required_module_ids: preset === 'credenciamento_m5' && m5 ? [m5] : [],
      })
    }

    if (p1Rule) {
      await updateGateRule(p1Rule.id, { is_enabled: preset === 'phil_onboarding' })
    }
  }

  await supabase.from('academy_gate_rules_log').insert({
    preset,
    previous_config: previous as unknown as Json,
    new_config: { preset, courseId } as unknown as Json,
    changed_by: userId,
  })
}

export async function getGateRulesLog(): Promise<AcademyGateRulesLog[]> {
  const { data, error } = await supabase
    .from('academy_gate_rules_log')
    .select('*')
    .order('changed_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []) as AcademyGateRulesLog[]
}

export async function getExemptions(): Promise<PpAcademyExemption[]> {
  const { data, error } = await supabase.from('pp_academy_exemptions').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as PpAcademyExemption[]
}

export async function createExemption(values: {
  professional_id: string
  gate_target: AcademyGateTarget | null
  reason: string
  granted_by: string
  expires_at?: string | null
}) {
  const { data, error } = await supabase.from('pp_academy_exemptions').insert(values).select().single()
  if (error) throw error
  return data as PpAcademyExemption
}

export async function deleteExemption(id: string) {
  const { error } = await supabase.from('pp_academy_exemptions').delete().eq('id', id)
  if (error) throw error
}

export async function previewGateImpact(requiredModuleIds: string[], courseId: string): Promise<GateImpactPreview> {
  const { data: professionals, error: profError } = await supabase
    .from('professionals')
    .select('id, full_name, credentialing_status')
    .eq('credentialing_status', 'ativo')
  if (profError) throw profError

  const { data: exemptions } = await supabase
    .from('pp_academy_exemptions')
    .select('professional_id')
    .or('gate_target.is.null,gate_target.eq.demands')

  const exemptSet = new Set((exemptions ?? []).map((e) => e.professional_id))
  const active = (professionals ?? []).filter((p) => p.credentialing_status === 'ativo')
  const blocked: GateImpactPreview['sampleBlocked'] = []

  for (const prof of active) {
    if (exemptSet.has(prof.id)) continue

    const { data: enrollment } = await supabase
      .from('academy_enrollments')
      .select('id')
      .eq('professional_id', prof.id)
      .eq('course_id', courseId)
      .maybeSingle()

    let wouldBlock = true
    if (enrollment && requiredModuleIds.length > 0) {
      const { data: lessons } = await supabase
        .from('academy_lessons')
        .select('id, module_id')
        .in('module_id', requiredModuleIds)
        .eq('is_published', true)

      const lessonIds = (lessons ?? []).map((l) => l.id)
      if (lessonIds.length === 0) {
        wouldBlock = false
      } else {
        const { count } = await supabase
          .from('academy_lesson_progress')
          .select('id', { count: 'exact', head: true })
          .eq('enrollment_id', enrollment.id)
          .in('lesson_id', lessonIds)
          .not('completed_at', 'is', null)
        wouldBlock = (count ?? 0) < lessonIds.length
      }
    }

    if (wouldBlock && blocked.length < 5) {
      blocked.push({
        professionalId: prof.id,
        name: prof.full_name ?? 'PP',
        pendingModule: 'Formação PP',
      })
    }
  }

  const blockedCount = active.filter((p) => !exemptSet.has(p.id)).length

  return {
    totalActivePp: active.length,
    blockedCount,
    sampleBlocked: blocked,
  }
}

export const academyCoursesService = {
  list: getPublishedCourses,
  getModules: getCourseModules,
}
