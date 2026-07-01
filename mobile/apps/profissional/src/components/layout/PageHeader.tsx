import type { ReactNode } from 'react'
import { Text, View } from 'react-native'
import { cn } from '@/lib/cn'

interface PageHeaderProps {
  title?: string
  subtitle?: string
  children?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, children, className }: PageHeaderProps) {
  return (
    <View className={cn('px-4 pt-2 pb-3', className)}>
      {children ?? (
        <View className="min-w-0">
          {title ? (
            <Text className="font-display text-xl font-bold text-foreground">{title}</Text>
          ) : null}
          {subtitle ? (
            <Text className="mt-0.5 text-sm text-muted-foreground">{subtitle}</Text>
          ) : null}
        </View>
      )}
    </View>
  )
}
