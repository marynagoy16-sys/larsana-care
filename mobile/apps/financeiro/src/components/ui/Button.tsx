import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { cn } from '@/lib/cn'

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'destructive'

interface ButtonProps {
  children: ReactNode
  onPress?: () => void
  disabled?: boolean
  loading?: boolean
  variant?: ButtonVariant
  className?: string
}

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-primary',
  outline: 'border border-border bg-card',
  ghost: 'bg-transparent',
  destructive: 'bg-destructive',
}

const textClasses: Record<ButtonVariant, string> = {
  default: 'text-primary-foreground',
  outline: 'text-foreground',
  ghost: 'text-primary',
  destructive: 'text-destructive-foreground',
}

export function Button({
  children,
  onPress,
  disabled,
  loading,
  variant = 'default',
  className,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(
        'h-12 items-center justify-center rounded-xl px-4',
        variantClasses[variant],
        (disabled || loading) && 'opacity-50',
        className,
      )}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'default' ? '#fff' : '#095742'} />
      ) : typeof children === 'string' ? (
        <Text className={cn('text-base font-semibold', textClasses[variant])}>{children}</Text>
      ) : (
        <View className="flex-row items-center justify-center">{children}</View>
      )}
    </Pressable>
  )
}
