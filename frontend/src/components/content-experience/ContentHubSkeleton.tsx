import { Skeleton } from '@/components/ui/skeleton'
import { CONTENT_GRID_CLASS, CONTENT_HUB_SCROLL_CLASS } from '@/lib/content/contentMeta'

export function ContentHubSkeleton() {
  return (
    <div className={CONTENT_HUB_SCROLL_CLASS}>
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className={CONTENT_GRID_CLASS}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5] w-full rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
