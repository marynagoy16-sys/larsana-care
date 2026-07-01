import { useState } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SubScreenHeader } from '@/components/layout/SubScreenHeader'
import { Button } from '@/components/ui/Button'
import { ContentLessonLayout } from '@/components/content/ContentLessonLayout'
import { LarsanaPillContentPlayer } from '@/components/larsanapill/LarsanaPillContentPlayer'
import {
  getContentById,
  getPrimaryPatientId,
  getWeeklyPlanPlayerContext,
  markContentComplete,
  markPlanDayComplete,
} from '@/services/larsanapill'

export default function WeeklyPlanPlayerScreen() {
  const { slug, dayIndex } = useLocalSearchParams<{ slug: string; dayIndex: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [completing, setCompleting] = useState(false)
  const parsedDayIndex = Number(dayIndex)

  const { data: patientId } = useQuery({
    queryKey: ['paciente', 'patient-id'],
    queryFn: getPrimaryPatientId,
  })

  const { data: playerContext, isLoading } = useQuery({
    queryKey: ['paciente', 'larsanapill', 'plan-player', slug, patientId],
    queryFn: () => getWeeklyPlanPlayerContext(slug!, patientId!),
    enabled: Boolean(slug && patientId),
  })

  const activeDay = playerContext?.days.find((day) => day.day_index === parsedDayIndex)

  const { data: linkedContent } = useQuery({
    queryKey: ['paciente', 'larsanapill', 'day-content', activeDay?.content_id],
    queryFn: () => getContentById(activeDay!.content_id!),
    enabled: !!activeDay?.content_id,
  })

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!patientId || !playerContext || !activeDay) return
      setCompleting(true)
      await markPlanDayComplete(patientId, playerContext.plan.id, activeDay.day_index)
      if (activeDay.content_id) {
        await markContentComplete(patientId, activeDay.content_id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paciente', 'larsanapill'] })
      const nextDay = playerContext?.days
        .filter((d) => d.day_index > parsedDayIndex)
        .sort((a, b) => a.day_index - b.day_index)[0]
      if (nextDay) {
        router.replace(`/(app)/larsanapill/planos/${slug}/dia/${nextDay.day_index}`)
      } else {
        router.back()
      }
    },
    onSettled: () => setCompleting(false),
  })

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <SubScreenHeader title={activeDay ? `Dia ${activeDay.day_index} — ${activeDay.title}` : 'Plano'} />
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#17310A" />
        </View>
      ) : !playerContext || !activeDay ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">Dia do plano não encontrado.</Text>
        </View>
      ) : (
        <ContentLessonLayout
          groups={playerContext.groups}
          activeItemId={activeDay.id}
          completedItemIds={playerContext.completedItemIds}
          onSelectItem={(dayId) => {
            const day = playerContext.days.find((d) => d.id === dayId)
            if (day) router.replace(`/(app)/larsanapill/planos/${slug}/dia/${day.day_index}`)
          }}
        >
          <ScrollView contentContainerClassName="gap-4 pb-8" showsVerticalScrollIndicator={false}>
            {activeDay.instructions ? (
              <Text className="text-sm text-muted-foreground">{activeDay.instructions}</Text>
            ) : null}
            {linkedContent ? (
              <LarsanaPillContentPlayer
                content={linkedContent}
                completing={completing || completeMutation.isPending}
                onComplete={() => completeMutation.mutate()}
              />
            ) : (
              <Button onPress={() => completeMutation.mutate()} loading={completeMutation.isPending}>
                Marcar dia como concluído
              </Button>
            )}
          </ScrollView>
        </ContentLessonLayout>
      )}
    </SafeAreaView>
  )
}
