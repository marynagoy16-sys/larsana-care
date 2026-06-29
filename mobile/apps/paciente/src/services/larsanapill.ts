import { supabase } from '@/lib/supabase'
import type {
  ExerciseStep,
  LarsanaPillCategory,
  LarsanaPillCategoryPlayerContext,
  LarsanaPillContent,
  LarsanaPillWeeklyPlan,
  LarsanaPillWeeklyPlanDay,
  LarsanaPillWeeklyPlanPlayerContext,
  LarsanaPillWeeklyPlanSalesContext,
} from '@/types/content'
import {
  categoryToGroups,
  flattenCategoryContents,
  flattenWeeklyPlanDays,
  getContinueItemId,
  weeklyPlanToGroups,
} from '@/lib/lessonNavigation'

export async function getCategoryBySlug(slug: string): Promise<LarsanaPillCategory | null> {
  const { data, error } = await supabase
    .from('larsanapill_categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()
  if (error) throw error
  return data as LarsanaPillCategory | null
}

export async function getPatientContentProgress(patientId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('larsanapill_content_progress')
    .select('content_id, progress_percent, completed_at')
    .eq('patient_id', patientId)
  if (error) throw error
  const map: Record<string, number> = {}
  for (const row of data ?? []) {
    map[row.content_id] = row.completed_at ? 100 : Number(row.progress_percent ?? 0)
  }
  return map
}

export async function getCategoryPlayerContext(
  slug: string,
  patientId: string,
): Promise<LarsanaPillCategoryPlayerContext | null> {
  const category = await getCategoryBySlug(slug)
  if (!category) return null
  const contents = await getCategoryContents(category.id)
  const progressMap = await getPatientContentProgress(patientId)
  const completedItemIds = new Set(
    contents.filter((c) => (progressMap[c.id] ?? 0) >= 100).map((c) => c.id),
  )
  const flatItems = flattenCategoryContents(category, contents)
  return {
    category,
    groups: categoryToGroups(category, contents),
    flatItems,
    completedItemIds,
    totalItems: contents.length,
    completedItems: completedItemIds.size,
  }
}

export function getContinueContentId(
  flatItems: ReturnType<typeof flattenCategoryContents>,
  completedIds: Set<string>,
): string | null {
  return getContinueItemId(flatItems, completedIds)
}

export async function getHubPlayerContext(patientId: string): Promise<{
  categories: LarsanaPillCategory[]
  progressMap: Record<string, number>
  completedIds: Set<string>
}> {
  const categories = await getPublishedCategories()
  const progressMap = await getPatientContentProgress(patientId)
  const completedIds = new Set(
    Object.entries(progressMap)
      .filter(([, percent]) => percent >= 100)
      .map(([id]) => id),
  )
  return { categories, progressMap, completedIds }
}

export async function getPublishedCategories(): Promise<LarsanaPillCategory[]> {
  const { data, error } = await supabase
    .from('larsanapill_categories')
    .select('*')
    .eq('is_published', true)
    .order('sort_order')
  if (error) throw error
  return (data ?? []) as LarsanaPillCategory[]
}

export async function getCategoryContents(categoryId: string): Promise<LarsanaPillContent[]> {
  const { data, error } = await supabase
    .from('larsanapill_contents')
    .select('*')
    .eq('category_id', categoryId)
    .eq('is_published', true)
    .order('sort_order')
  if (error) throw error
  return (data ?? []) as LarsanaPillContent[]
}

export async function getContentById(contentId: string): Promise<LarsanaPillContent | null> {
  const { data, error } = await supabase.from('larsanapill_contents').select('*').eq('id', contentId).maybeSingle()
  if (error) throw error
  return data as LarsanaPillContent | null
}

export async function getPrimaryPatientId(): Promise<string | null> {
  const { data, error } = await supabase.from('patients').select('id').limit(1).maybeSingle()
  if (error) throw error
  return data?.id ?? null
}

export async function markContentComplete(patientId: string, contentId: string): Promise<void> {
  const { error } = await supabase.from('larsanapill_content_progress').upsert(
    {
      patient_id: patientId,
      content_id: contentId,
      progress_percent: 100,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'patient_id,content_id' },
  )
  if (error) throw error
}

export async function getWeeklyPlans(): Promise<LarsanaPillWeeklyPlan[]> {
  const { data, error } = await supabase
    .from('larsanapill_weekly_plans')
    .select('*')
    .eq('is_published', true)
    .order('sort_order')
  if (error) throw error
  return (data ?? []) as LarsanaPillWeeklyPlan[]
}

export async function getWeeklyPlanBySlug(slug: string): Promise<LarsanaPillWeeklyPlan | null> {
  const { data, error } = await supabase
    .from('larsanapill_weekly_plans')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()
  if (error) throw error
  return data as LarsanaPillWeeklyPlan | null
}

export async function getWeeklyPlanDays(planId: string): Promise<LarsanaPillWeeklyPlanDay[]> {
  const { data, error } = await supabase
    .from('larsanapill_weekly_plan_days')
    .select('*')
    .eq('plan_id', planId)
    .order('day_index')
  if (error) throw error
  return (data ?? []) as LarsanaPillWeeklyPlanDay[]
}

function resolveVslContentId(plan: LarsanaPillWeeklyPlan, days: LarsanaPillWeeklyPlanDay[]): string | null {
  const fromMetadata = plan.metadata?.vsl_content_id
  if (typeof fromMetadata === 'string' && fromMetadata.trim()) return fromMetadata
  const firstLinkedDay = [...days].sort((a, b) => a.day_index - b.day_index).find((day) => day.content_id)
  return firstLinkedDay?.content_id ?? null
}

export async function getWeeklyPlanSalesContext(slug: string): Promise<LarsanaPillWeeklyPlanSalesContext | null> {
  const plan = await getWeeklyPlanBySlug(slug)
  if (!plan) return null

  const days = await getWeeklyPlanDays(plan.id)
  const contentIds = new Set<string>()
  const vslContentId = resolveVslContentId(plan, days)
  if (vslContentId) contentIds.add(vslContentId)
  for (const day of days) {
    if (day.content_id) contentIds.add(day.content_id)
  }

  const contents = await Promise.all([...contentIds].map((id) => getContentById(id)))
  const contentById: Record<string, LarsanaPillContent> = {}
  for (const content of contents) {
    if (content) contentById[content.id] = content
  }

  return {
    plan,
    days,
    vslContent: vslContentId ? (contentById[vslContentId] ?? null) : null,
    contentById,
  }
}

export async function getPlanProgress(patientId: string, planId: string): Promise<Set<number>> {
  const { data, error } = await supabase
    .from('larsanapill_plan_progress')
    .select('day_index')
    .eq('patient_id', patientId)
    .eq('plan_id', planId)
  if (error) throw error
  return new Set((data ?? []).map((row) => row.day_index))
}

export async function getWeeklyPlanDayCounts(planIds: string[]): Promise<Record<string, number>> {
  if (planIds.length === 0) return {}
  const { data, error } = await supabase
    .from('larsanapill_weekly_plan_days')
    .select('plan_id')
    .in('plan_id', planIds)
  if (error) throw error
  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    counts[row.plan_id] = (counts[row.plan_id] ?? 0) + 1
  }
  return counts
}

export async function getWeeklyPlanPlayerContext(
  slug: string,
  patientId: string,
): Promise<LarsanaPillWeeklyPlanPlayerContext | null> {
  const plan = await getWeeklyPlanBySlug(slug)
  if (!plan) return null
  const days = await getWeeklyPlanDays(plan.id)
  const completedDayIndices = await getPlanProgress(patientId, plan.id)
  const completedItemIds = new Set(
    days.filter((day) => completedDayIndices.has(day.day_index)).map((day) => day.id),
  )
  const flatItems = flattenWeeklyPlanDays(plan, days)
  return {
    plan,
    days,
    groups: weeklyPlanToGroups(plan, days),
    flatItems,
    completedDayIndices,
    completedItemIds,
    totalItems: days.length,
    completedItems: completedDayIndices.size,
  }
}

export async function markPlanDayComplete(patientId: string, planId: string, dayIndex: number): Promise<void> {
  const { error } = await supabase.from('larsanapill_plan_progress').upsert(
    {
      patient_id: patientId,
      plan_id: planId,
      day_index: dayIndex,
      completed_at: new Date().toISOString(),
    },
    { onConflict: 'plan_id,patient_id,day_index' },
  )
  if (error) throw error
}

export async function getPlansProgressSummary(
  patientId: string,
  planIds: string[],
): Promise<Record<string, { completed: number; total: number }>> {
  if (planIds.length === 0) return {}
  const dayCounts = await getWeeklyPlanDayCounts(planIds)
  const { data, error } = await supabase
    .from('larsanapill_plan_progress')
    .select('plan_id, day_index')
    .eq('patient_id', patientId)
    .in('plan_id', planIds)
  if (error) throw error
  const completedByPlan: Record<string, number> = {}
  for (const row of data ?? []) {
    completedByPlan[row.plan_id] = (completedByPlan[row.plan_id] ?? 0) + 1
  }
  const summary: Record<string, { completed: number; total: number }> = {}
  for (const planId of planIds) {
    summary[planId] = {
      completed: completedByPlan[planId] ?? 0,
      total: dayCounts[planId] ?? 0,
    }
  }
  return summary
}

export function parseExerciseSteps(metadata: Record<string, unknown>): ExerciseStep[] {
  const steps = metadata.steps
  if (!Array.isArray(steps)) return []
  return steps
    .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
    .map((s) => ({
      title: String(s.title ?? ''),
      instruction: String(s.instruction ?? ''),
      durationSeconds: Number(s.durationSeconds ?? 30),
    }))
}

export const larsanapillCategoriesService = {
  list: getPublishedCategories,
}

export const larsanapillContentsService = {
  listByCategory: getCategoryContents,
  getById: getContentById,
}
