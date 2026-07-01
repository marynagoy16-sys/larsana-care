import type { ReactNode } from 'react'
import { Text, View } from 'react-native'
import { Inbox } from 'lucide-react-native'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <View className="items-center justify-center gap-3 px-6 py-12">
      <View className="rounded-full bg-muted p-4">
        <Inbox size={32} color="#5A7920" />
      </View>
      <Text className="text-center text-base font-semibold text-foreground">{title}</Text>
      {description ? (
        <Text className="text-center text-sm text-muted-foreground">{description}</Text>
      ) : null}
      {action}
    </View>
  )
}
