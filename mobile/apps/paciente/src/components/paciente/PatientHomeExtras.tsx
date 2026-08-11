import { Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Pill } from 'lucide-react-native'
import {
  getPatientHomeLarsanaPillTeaser,
  patientHomeLarsanaPillQueryKeys,
  type PatientHomeLarsanaPillTeaser,
} from '@/services/larsanapill'

function navigateToTeaser(router: ReturnType<typeof useRouter>, teaser: PatientHomeLarsanaPillTeaser) {
  if (teaser.kind === 'weekly_plan' && teaser.planSlug) {
    router.push(`/(app)/larsanapill/planos/${teaser.planSlug}`)
    return
  }
  if (teaser.kind === 'content' && teaser.categorySlug && teaser.contentId) {
    router.push(`/(app)/larsanapill/categoria/${teaser.categorySlug}/conteudo/${teaser.contentId}`)
    return
  }
  router.push('/(app)/larsanapill')
}

export function PatientHomeLarsanaPillTeaser({ patientId }: { patientId: string }) {
  const router = useRouter()
  const { data: teaser, isLoading } = useQuery({
    queryKey: patientHomeLarsanaPillQueryKeys.teaser(patientId),
    queryFn: () => getPatientHomeLarsanaPillTeaser(patientId),
    enabled: !!patientId,
  })

  if (isLoading || !teaser) return null

  return (
    <Pressable
      onPress={() => navigateToTeaser(router, teaser)}
      className="overflow-hidden rounded-xl border border-border bg-card active:bg-muted/30"
    >
      <View className="flex-row items-stretch">
        <View className="w-16 items-center justify-center bg-primary">
          <Pill size={28} color="#fff" />
        </View>
        <View className="min-w-0 flex-1 px-4 py-3.5">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-primary">{teaser.eyebrow}</Text>
          <Text className="mt-0.5 font-medium text-foreground" numberOfLines={2}>
            {teaser.title}
          </Text>
          <Text className="mt-1 text-xs text-muted-foreground" numberOfLines={2}>
            {teaser.subtitle}
          </Text>
          {teaser.progressPercent != null && teaser.progressPercent > 0 ? (
            <View className="mt-2.5 h-1.5 max-w-[12rem] overflow-hidden rounded-full bg-muted">
              <View className="h-full rounded-full bg-primary" style={{ width: `${teaser.progressPercent}%` }} />
            </View>
          ) : null}
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
