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

export function Badge({ label, className }: { label: string; className?: string }) {
  return (
    <View className={cn('rounded-full px-2.5 py-1', className)}>
      <Text className="text-xs font-medium">{label}</Text>
    </View>
  )
}
