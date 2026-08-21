import type { LucideIcon } from 'lucide-react'
import { BookOpen, ClipboardList, Dumbbell, FileText, PlayCircle } from 'lucide-react'
import { createElement } from 'react'
import type { AcademyContentType } from '@/types/academy'
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

/** Renders a Lucide content icon without assigning a component during render. */
export function ContentTypeIcon({
  type,
  icon,
  className,
}: {
  type?: AcademyContentType
  icon?: LucideIcon
  className?: string
}) {
  return createElement(icon ?? getContentIcon(type ?? 'richtext'), { className })
}

export function getContentLabel(type: AcademyContentType): string {
  return getContentTypeLabel(type)
}
