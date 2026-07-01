import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, BookOpen, ChevronRight } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  getCourseWithProgress,
  getCurrentProfessionalId,
  getModuleLessons,
} from '@/services/academy'

export default function AcademyCourseModulesScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  const profQuery = useQuery({
    queryKey: ['pp', 'professionalId'],
    queryFn: getCurrentProfessionalId,
  })

  const courseQuery = useQuery({
    queryKey: ['academy', 'course', id, profQuery.data],
    queryFn: () => getCourseWithProgress(id!, profQuery.data!),
    enabled: !!id && !!profQuery.data,
  })

  const loading = profQuery.isLoading || courseQuery.isLoading
  const data = courseQuery.data

  const progressPercent =
    data && data.totalLessons > 0
      ? Math.round((data.completedLessons / data.totalLessons) * 100)
      : 0

  const handleOpenModule = async (moduleId: string) => {
    const lessons = await getModuleLessons(moduleId)
    const first = [...lessons].sort((a, b) => a.sort_order - b.sort_order)[0]
    if (first) {
      router.push(`/(app)/academy/aulas/${first.id}`)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <PageHeader>
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()} className="p-2">
            <ArrowLeft size={22} color="#17310A" />
          </Pressable>
          <View className="min-w-0 flex-1">
            <Text className="text-lg font-semibold text-foreground" numberOfLines={1}>
              {data?.course.title ?? 'Curso'}
            </Text>
            {data?.course.description ? (
              <Text className="text-xs text-muted-foreground" numberOfLines={2}>
                {data.course.description}
              </Text>
            ) : null}
          </View>
        </View>
      </PageHeader>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#17310A" />
        </View>
      ) : !data ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-sm text-muted-foreground">
            Curso não encontrado ou indisponível.
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerClassName="gap-4 pb-8">
          <View className="rounded-xl border border-border bg-card p-4 gap-2">
            <Text className="text-sm font-medium text-foreground">Seu progresso</Text>
            <View className="h-2 overflow-hidden rounded-full bg-muted">
              <View className="h-full rounded-full bg-primary" style={{ width: `${progressPercent}%` }} />
            </View>
            <Text className="text-xs text-muted-foreground">
              {data.completedLessons} de {data.totalLessons} aulas concluídas ({progressPercent}%)
            </Text>
          </View>

          {data.modules.length === 0 ? (
            <View className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-8">
              <Text className="text-center text-sm text-muted-foreground">
                Nenhum módulo publicado neste curso.
              </Text>
            </View>
          ) : (
            data.modules.map((mod) => {
              const modPercent =
                mod.totalLessons > 0
                  ? Math.round((mod.completedLessons / mod.totalLessons) * 100)
                  : 0

              return (
                <Pressable
                  key={mod.id}
                  onPress={() => handleOpenModule(mod.id)}
                  className="flex-row items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 active:bg-muted/30"
                >
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <BookOpen size={18} color="#17310A" />
                  </View>
                  <View className="min-w-0 flex-1 gap-1">
                    <Text className="font-medium text-foreground">{mod.title}</Text>
                    <Text className="text-xs text-muted-foreground">
                      {mod.completedLessons}/{mod.totalLessons} aulas · {modPercent}%
                    </Text>
                  </View>
                  <ChevronRight size={18} color="#5A7920" />
                </Pressable>
              )
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
