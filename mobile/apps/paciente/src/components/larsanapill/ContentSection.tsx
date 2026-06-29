import { ScrollView, Text, View } from 'react-native'
import type { ReactNode } from 'react'

interface ContentSectionProps {
  title: string
  description?: string | null
  children: ReactNode
}

export function ContentSection({ title, description, children }: ContentSectionProps) {
  return (
    <View className="gap-3">
      <View>
        <Text className="text-lg font-semibold text-foreground">{title}</Text>
        {description ? <Text className="mt-0.5 text-sm text-muted-foreground">{description}</Text> : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 4 }}>
        {children}
      </ScrollView>
    </View>
  )
}
