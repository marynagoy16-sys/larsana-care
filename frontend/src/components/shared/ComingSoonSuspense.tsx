import { lazy, Suspense } from 'react'
import { PageSkeleton } from '@/components/shared/PageSkeleton'

const ComingSoonPage = lazy(() =>
  import('@/pages/shared/ComingSoonPage').then((m) => ({ default: m.ComingSoonPage })),
)

export function ComingSoonSuspense() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ComingSoonPage />
    </Suspense>
  )
}
