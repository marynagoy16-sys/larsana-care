import { useMemo } from 'react'
import { getPrevNext } from '@/lib/content/lessonNavigation'
import type { FlatContentItem } from '@/types/academy'

export function useContentLessonNav(flat: FlatContentItem[], activeItemId: string) {
  return useMemo(() => getPrevNext(flat, activeItemId), [flat, activeItemId])
}
