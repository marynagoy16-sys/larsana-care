import type { ReactNode } from 'react'
import { Text, View } from 'react-native'

export function KpiCard({ label, value, icon: Icon, description }: {
  label: string
  value: string
  icon: any
  description?: string
}) {
  return (
    <View className="min-w-[100px] flex-1 gap-2 rounded-xl border border-border bg-card p-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-medium text-muted-foreground">{label}</Text>
        <Icon size={14} color="#49796B" />
      </View>
      <Text className="text-2xl font-bold text-foreground">{value}</Text>
      {description ? (
        <Text className="text-[10px] leading-tight text-muted-foreground" numberOfLines={2}>
          {description}
        </Text>
      ) : null}
    </View>
  )
}
