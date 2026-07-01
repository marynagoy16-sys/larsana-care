import type { ReactNode } from 'react'
import { Text, View } from 'react-native'
import { cn } from '@/lib/cn'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <View className={cn('rounded-xl border border-border bg-card', className)}>
      {children}
    </View>
  )
}
