import type { ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'

interface SubScreenHeaderProps {
  title: string
  onBack?: () => void
  right?: ReactNode
}

export function SubScreenHeader({ title, onBack, right }: SubScreenHeaderProps) {
  const router = useRouter()

  return (
    <View className="flex-row items-center gap-3 px-4 pb-3 pt-1">
      <Pressable
        onPress={onBack ?? (() => router.back())}
        className="rounded-xl border border-border/60 bg-card p-2.5 active:bg-muted/40"
        accessibilityLabel="Voltar"
      >
        <ArrowLeft size={20} color="#095742" />
      </Pressable>
      <Text className="min-w-0 flex-1 font-display text-lg font-bold text-foreground" numberOfLines={2}>
        {title}
      </Text>
      {right ? <View className="shrink-0">{right}</View> : null}
    </View>
  )
}
