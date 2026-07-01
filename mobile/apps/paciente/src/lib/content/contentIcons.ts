import type { LucideIcon } from 'lucide-react-native'
import { BookOpen, ClipboardList, Dumbbell, FileText, PlayCircle } from 'lucide-react-native'
import type { AcademyContentType } from '@/types/content'
import { getContentTypeLabel } from '@/lib/content/contentMeta'

export function getContentIcon(type: AcademyContentType): LucideIcon {
  const icons: Record<AcademyContentType, LucideIcon> = {
    video: PlayCircle,
    pdf: FileText,
    ebook: BookOpen,
    richtext: BookOpen,
    quiz: ClipboardList,
    exercise_steps: Dumbbell,
  }
  return icons[type] ?? FileText
}

export function getContentLabel(type: AcademyContentType): string {
  return getContentTypeLabel(type)
}
