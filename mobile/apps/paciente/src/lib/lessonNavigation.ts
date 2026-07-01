import type {
  FlatContentItem,
  LarsanaPillCategory,
  LarsanaPillContent,
  LarsanaPillWeeklyPlan,
  LarsanaPillWeeklyPlanDay,
  ContentPlayerGroup,
} from '@/types/content'

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

export function getContinueItemId(flat: FlatContentItem[], completedIds: Set<string>): string | null {
  const next = flat.find((item) => !completedIds.has(item.itemId))
  return next?.itemId ?? flat[0]?.itemId ?? null
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
