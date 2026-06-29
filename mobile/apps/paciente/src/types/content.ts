export type AcademyContentType = 'video' | 'pdf' | 'richtext' | 'quiz' | 'exercise_steps' | 'ebook'

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

export interface LarsanaPillWeeklyPlanDay {
  id: string
  plan_id: string
  day_index: number
  title: string
  content_id: string | null
  instructions: string | null
  sort_order: number
}

export interface LarsanaPillWeeklyPlanSalesContext {
  plan: LarsanaPillWeeklyPlan
  days: LarsanaPillWeeklyPlanDay[]
  vslContent: LarsanaPillContent | null
  contentById: Record<string, LarsanaPillContent>
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

export interface LarsanaPillCategoryPlayerContext {
  category: LarsanaPillCategory
  groups: ContentPlayerGroup[]
  flatItems: FlatContentItem[]
  completedItemIds: Set<string>
  totalItems: number
  completedItems: number
}
