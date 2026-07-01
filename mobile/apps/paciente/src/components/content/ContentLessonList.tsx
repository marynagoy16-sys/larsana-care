import { Pressable, ScrollView, Text, View } from 'react-native'
import { cn } from '@/lib/cn'
import type { ContentPlayerGroup } from '@/types/content'

export function ContentLessonList({
  groups,
  activeItemId,
  completedItemIds,
  onSelectItem,
}: {
  groups: ContentPlayerGroup[]
  activeItemId: string
  completedItemIds: Set<string>
  onSelectItem: (id: string) => void
}) {
  const items = groups.flatMap((group) => group.items)

  return (
    <View className="shrink-0 border-b border-border/50 bg-background" style={{ flexGrow: 0 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8, alignItems: 'center' }}
      >
        {items.map((item) => {
          const isActive = item.id === activeItemId
          const isDone = completedItemIds.has(item.id)
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelectItem(item.id)}
              style={{ flexGrow: 0, flexShrink: 0, maxWidth: 220 }}
              className={cn(
                'rounded-full border px-4 py-2',
                isActive ? 'border-primary bg-primary/10' : 'border-border bg-card',
              )}
            >
              <Text
                numberOfLines={1}
                className={cn('text-xs font-medium', isActive ? 'text-primary' : 'text-foreground')}
              >
                {isDone ? '✓ ' : ''}
                {item.title}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}
