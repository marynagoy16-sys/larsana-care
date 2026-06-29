import { View } from 'react-native'
import { cn } from '@/lib/cn'

interface ProgressBarProps {
  value: number
  className?: string
  trackClassName?: string
  fillClassName?: string
}

export function ProgressBar({ value, className, trackClassName, fillClassName }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <View className={cn('h-2 overflow-hidden rounded-full bg-muted', className, trackClassName)}>
      <View
        className={cn('h-full rounded-full bg-primary', fillClassName)}
        style={{ width: `${clamped}%` }}
      />
    </View>
  )
}
