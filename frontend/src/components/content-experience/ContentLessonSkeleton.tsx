import { Skeleton } from '@/components/ui/skeleton'

export function ContentLessonSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      <div className="hidden space-y-3 border-r p-4 lg:block lg:w-[22rem]">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <div className="flex-1 space-y-4 p-4 lg:p-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="aspect-video w-full rounded-2xl" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  )
}
