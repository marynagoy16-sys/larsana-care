import { Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { ChevronRight, Pill } from 'lucide-react-native'

export function PatientHomeLarsanaPillTeaser() {
  const router = useRouter()

  return (
    <Pressable
      onPress={() => router.push('/(app)/larsanapill')}
      className="overflow-hidden rounded-xl border border-border bg-card active:bg-muted/30"
    >
      <View className="flex-row items-stretch">
        <View className="w-16 items-center justify-center bg-primary">
          <Pill size={28} color="#fff" />
        </View>
        <View className="min-w-0 flex-1 px-4 py-3.5">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-primary">Em breve</Text>
          <Text className="mt-0.5 font-medium text-foreground" numberOfLines={2}>
            LarsanaPill
          </Text>
          <Text className="mt-1 text-xs text-muted-foreground" numberOfLines={2}>
            Protocolo, orientações e materiais práticos para o seu dia a dia.
          </Text>
        </View>
        <View className="items-center justify-center pr-3">
          <ChevronRight size={20} color="#49796B" />
        </View>
      </View>
    </Pressable>
  )
}

export function PatientHomeHelpLink() {
  const router = useRouter()

  return (
    <Pressable onPress={() => router.push('/(app)/(tabs)/ajuda')} className="items-center pt-2">
      <Text className="text-sm text-muted-foreground underline">Precisa de ajuda?</Text>
    </Pressable>
  )
}
