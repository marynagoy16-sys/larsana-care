import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'

export function SubScreenHeader({ title }: { title: string }) {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  return (
    <View className="border-b border-border/50 bg-background">
      <View
        className="flex-row items-center gap-2 px-2 pb-3"
        style={{ paddingTop: Math.max(insets.top, 10) }}
      >
        <Pressable
          onPress={() => router.back()}
          className="rounded-xl p-2 active:bg-muted/40"
          accessibilityLabel="Voltar"
        >
          <ChevronLeft size={24} color="#17310A" />
        </Pressable>
        <Text className="flex-1 font-display text-lg font-bold text-foreground" numberOfLines={1}>
          {title}
        </Text>
        <View className="w-10" />
      </View>
    </View>
  )
}
