import { useCallback } from 'react'
import type { ReactNode } from 'react'
import { ContentLessonFooter } from '@/components/content-experience/ContentLessonFooter'
import { ContentLessonSidebar } from '@/components/content-experience/ContentLessonSidebar'
import { useContentLessonNav } from '@/hooks/useContentLessonNav'
import type { ContentPlayerGroup, FlatContentItem } from '@/types/academy'
import { cn } from '@/lib/utils'

interface ContentLessonExperienceProps {
  title: string
  groups: ContentPlayerGroup[]
  flatItems: FlatContentItem[]
  activeItemId: string
  onSelectItem: (itemId: string) => void
  completedItemIds?: Set<string>
  children: ReactNode
  className?: string
}

export function ContentLessonExperience({
  title,
  groups,
  flatItems,
  activeItemId,
  onSelectItem,
  completedItemIds = new Set(),
  children,
  className,
}: ContentLessonExperienceProps) {
  const { activeIndex, prev, next, total } = useContentLessonNav(flatItems, activeItemId)

  const handlePrev = useCallback(() => {
    if (prev) onSelectItem(prev.itemId)
  }, [prev, onSelectItem])

  const handleNext = useCallback(() => {
    if (next) onSelectItem(next.itemId)
  }, [next, onSelectItem])

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col lg:flex-row lg:overflow-hidden',
        'max-lg:overflow-y-auto max-lg:pb-content-lesson-scroll',
        className,
      )}
    >
      <main className="order-1 flex min-w-0 flex-col lg:order-2 lg:min-h-0 lg:flex-1">
        <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto px-4 py-4 lg:px-6 lg:py-5">{children}</div>
        <ContentLessonFooter
          activeIndex={activeIndex}
          total={total}
          prev={prev}
          next={next}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      </main>
      <div className="order-2 shrink-0 lg:order-1 lg:min-h-0 lg:overflow-hidden">
        <ContentLessonSidebar
          title={title}
          groups={groups}
          activeItemId={activeItemId}
          activeIndex={activeIndex}
          total={total}
          onSelectItem={onSelectItem}
          completedItemIds={completedItemIds}
        />
      </div>
    </div>
  )
}
