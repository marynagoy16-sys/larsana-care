import type { AcademyContentType } from '@/types/academy'

export const CONTENT_GRID_CLASS =
  'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4'

export const CONTENT_HUB_SCROLL_CLASS = 'flex h-full flex-col overflow-auto gap-6'

export const CONTENT_HUB_SECTION_PADDING = 'px-4 lg:px-6'

export function getContentTypeLabel(type: AcademyContentType): string {
  const labels: Record<AcademyContentType, string> = {
    video: 'Vídeo',
    pdf: 'PDF',
    ebook: 'E-book',
    richtext: 'Leitura',
    quiz: 'Quiz',
    exercise_steps: 'Exercício',
  }
  return labels[type] ?? type
}
