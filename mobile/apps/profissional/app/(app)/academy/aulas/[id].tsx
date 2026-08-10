import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import {
  ensureEnrollment,
  getCurrentProfessionalId,
  getLessonById,
  markLessonComplete,
} from '@/services/academy'

export default function AcademyLessonScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { id } = useLocalSearchParams<{ id: string }>()

  const profQuery = useQuery({
    queryKey: ['pp', 'professionalId'],
    queryFn: getCurrentProfessionalId,
  })

  const lessonQuery = useQuery({
    queryKey: ['academy', 'lesson', id],
    queryFn: () => getLessonById(id!),
    enabled: !!id,
  })

  const completeMutation = useMutation({
    mutationFn: async () => {
      const lesson = lessonQuery.data
      const professionalId = profQuery.data
      if (!lesson?.course_id || !professionalId) throw new Error('Dados incompletos')
      const enrollment = await ensureEnrollment(lesson.course_id, professionalId)
      await markLessonComplete(enrollment.id, lesson.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy'] })
      router.back()
    },
  })

  const loading = profQuery.isLoading || lessonQuery.isLoading
  const lesson = lessonQuery.data

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <PageHeader>
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()} className="p-2">
            <ArrowLeft size={22} color="#095742" />
          </Pressable>
          <Text className="flex-1 text-lg font-semibold text-foreground" numberOfLines={1}>
            {lesson?.title ?? 'Aula'}
          </Text>
        </View>
      </PageHeader>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#095742" />
        </View>
      ) : !lesson ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-sm text-muted-foreground">
            Aula não encontrada ou indisponível.
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerClassName="gap-4 pb-8">
          {lesson.description ? (
            <Text className="text-sm text-muted-foreground">{lesson.description}</Text>
          ) : null}

          {lesson.content ? (
            <View className="rounded-xl border border-border bg-card p-4">
              <Text className="text-sm leading-6 text-foreground">{lesson.content}</Text>
            </View>
          ) : (
            <View className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-8">
              <Text className="text-center text-sm text-muted-foreground">
                Conteúdo desta aula disponível na versão web.
              </Text>
            </View>
          )}

          <Button
            variant="default"
            onPress={() => completeMutation.mutate()}
            loading={completeMutation.isPending}
            className="w-full"
          >
            Marcar como concluída
          </Button>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
