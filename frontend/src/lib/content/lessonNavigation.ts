import type {
  AcademyLesson,
  AcademyModuleWithProgress,
  ContentGroupProgress,
  ContentPlayerGroup,
  FlatContentItem,
  LarsanaPillCategory,
  LarsanaPillContent,
  LarsanaPillWeeklyPlan,
  LarsanaPillWeeklyPlanDay,
} from '@/types/academy'

export function flattenAcademyLessons(modules: AcademyModuleWithProgress[]): FlatContentItem[] {
  const items: FlatContentItem[] = []
  let index = 0
  for (const mod of [...modules].sort((a, b) => a.sort_order - b.sort_order)) {
    for (const lesson of [...mod.lessons].sort((a, b) => a.sort_order - b.sort_order)) {
      items.push({
        groupId: mod.id,
        groupTitle: mod.title,
        groupCode: mod.code,
        itemId: lesson.id,
        title: lesson.title,
        contentType: lesson.content_type,
        sortOrder: lesson.sort_order,
        index,
      })
      index += 1
    }
  }
  return items
}

export function flattenCategoryContents(category: LarsanaPillCategory, contents: LarsanaPillContent[]): FlatContentItem[] {
  return [...contents]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((content, index) => ({
      groupId: category.id,
      groupTitle: category.title,
      groupCode: category.code,
      itemId: content.id,
      title: content.title,
      contentType: content.content_type,
      sortOrder: content.sort_order,
      index,
    }))
}

export function academyModulesToGroups(modules: AcademyModuleWithProgress[]): ContentPlayerGroup[] {
  return [...modules]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((mod) => ({
      id: mod.id,
      code: mod.code,
      title: mod.title,
      description: mod.description,
      items: [...mod.lessons]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          contentType: lesson.content_type,
          sortOrder: lesson.sort_order,
        })),
    }))
}

export function categoryToGroups(category: LarsanaPillCategory, contents: LarsanaPillContent[]): ContentPlayerGroup[] {
  return [
    {
      id: category.id,
      code: category.code,
      title: category.title,
      description: category.description,
      items: [...contents]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((content) => ({
          id: content.id,
          title: content.title,
          contentType: content.content_type,
          sortOrder: content.sort_order,
        })),
    },
  ]
}

export function getPrevNext(flat: FlatContentItem[], activeItemId: string) {
  const activeIndex = flat.findIndex((item) => item.itemId === activeItemId)
  if (activeIndex < 0) return { activeIndex: -1, prev: null, next: null, total: flat.length, item: null }
  return {
    activeIndex,
    prev: activeIndex > 0 ? flat[activeIndex - 1] : null,
    next: activeIndex < flat.length - 1 ? flat[activeIndex + 1] : null,
    total: flat.length,
    item: flat[activeIndex],
  }
}

export function getFirstItemId(flat: FlatContentItem[]): string | null {
  return flat[0]?.itemId ?? null
}

export function getGroupProgress(
  group: ContentPlayerGroup,
  completedIds: Set<string>,
  activeItemId?: string,
): ContentGroupProgress {
  const total = group.items.length
  const completed = group.items.filter((item) => completedIds.has(item.id)).length
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0
  const hasActive = activeItemId ? group.items.some((item) => item.id === activeItemId) : false
  const status: ContentGroupProgress['status'] =
    completed >= total && total > 0 ? 'completed' : completed > 0 || hasActive ? 'in_progress' : 'pending'
  return { groupId: group.id, total, completed, percent, status }
}

export function getContinueItemId(flat: FlatContentItem[], completedIds: Set<string>): string | null {
  const next = flat.find((item) => !completedIds.has(item.itemId))
  return next?.itemId ?? flat[0]?.itemId ?? null
}

export function findLessonInModules(modules: AcademyModuleWithProgress[], lessonId: string): AcademyLesson | null {
  for (const mod of modules) {
    const lesson = mod.lessons.find((l) => l.id === lessonId)
    if (lesson) return lesson
  }
  return null
}

export function flattenWeeklyPlanDays(plan: LarsanaPillWeeklyPlan, days: LarsanaPillWeeklyPlanDay[]): FlatContentItem[] {
  return [...days]
    .sort((a, b) => a.day_index - b.day_index)
    .map((day, index) => ({
      groupId: plan.id,
      groupTitle: 'Rotina semanal',
      groupCode: plan.code,
      itemId: day.id,
      title: day.title,
      contentType: day.content_id ? 'exercise_steps' : 'richtext',
      sortOrder: day.sort_order,
      index,
      dayIndex: day.day_index,
      linkedContentId: day.content_id,
      instructions: day.instructions,
    }))
}

export function weeklyPlanToGroups(plan: LarsanaPillWeeklyPlan, days: LarsanaPillWeeklyPlanDay[]): ContentPlayerGroup[] {
  return [
    {
      id: plan.id,
      code: plan.code,
      title: 'Rotina semanal',
      description: plan.description,
      items: [...days]
        .sort((a, b) => a.day_index - b.day_index)
        .map((day) => ({
          id: day.id,
          title: `Dia ${day.day_index} — ${day.title}`,
          contentType: day.content_id ? 'exercise_steps' : 'richtext',
          sortOrder: day.sort_order,
        })),
    },
  ]
}

export function getPrevNextByDayIndex(flat: FlatContentItem[], dayIndex: number) {
  const activeItemId = flat.find((item) => item.dayIndex === dayIndex)?.itemId
  if (!activeItemId) return { activeIndex: -1, prev: null, next: null, total: flat.length, item: null }
  return getPrevNext(flat, activeItemId)
}
