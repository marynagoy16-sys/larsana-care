import type { ReactNode } from 'react'
import { CONTENT_GRID_CLASS, CONTENT_HUB_SECTION_PADDING } from '@/lib/content/contentMeta'
import { cn } from '@/lib/utils'

interface ContentSectionProps {
  title: string
  description?: string | null
  children: ReactNode
  className?: string
  padded?: boolean
}

export function ContentSection({ title, description, children, className, padded = false }: ContentSectionProps) {
  return (
    <section className={cn('space-y-4', padded && CONTENT_HUB_SECTION_PADDING, className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <h2 className="shrink-0 text-lg font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground sm:max-w-md sm:text-right">{description}</p>
        )}
      </div>
      <div className={CONTENT_GRID_CLASS}>{children}</div>
    </section>
  )
}
