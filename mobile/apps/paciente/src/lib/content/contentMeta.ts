import type { AcademyContentType } from '@/types/content'

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
