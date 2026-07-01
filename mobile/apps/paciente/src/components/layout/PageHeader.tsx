import type { ReactNode } from 'react'
import { Text, View } from 'react-native'

interface PageHeaderProps {
  title?: string
  subtitle?: string
  children?: ReactNode
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <View className="border-b border-border bg-card px-4 pb-4 pt-2">
      {children ?? (
        <View>
          {title ? <Text className="font-display text-xl font-bold text-foreground">{title}</Text> : null}
          {subtitle ? <Text className="mt-0.5 text-sm text-muted-foreground">{subtitle}</Text> : null}
        </View>
      )}
    </View>
  )
}
