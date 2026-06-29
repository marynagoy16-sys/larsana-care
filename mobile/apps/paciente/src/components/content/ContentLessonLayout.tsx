import type { ReactNode } from 'react'
import { View } from 'react-native'
import { ContentLessonList } from '@/components/content/ContentLessonList'
import type { ContentPlayerGroup } from '@/types/content'

interface ContentLessonLayoutProps {
  groups: ContentPlayerGroup[]
  activeItemId: string
  completedItemIds: Set<string>
  onSelectItem: (id: string) => void
  children: ReactNode
}

export function ContentLessonLayout({
  groups,
  activeItemId,
  completedItemIds,
  onSelectItem,
  children,
}: ContentLessonLayoutProps) {
  return (
    <View className="min-h-0 flex-1">
      <ContentLessonList
        groups={groups}
        activeItemId={activeItemId}
        completedItemIds={completedItemIds}
        onSelectItem={onSelectItem}
      />
      <View className="min-h-0 flex-1 px-4 pt-4">{children}</View>
    </View>
  )
}
