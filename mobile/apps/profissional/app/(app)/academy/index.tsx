import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { ChevronRight, GraduationCap } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { getCurrentProfessionalId, getPublishedCourses } from '@/services/academy'

export default function AcademyHubScreen() {
  const router = useRouter()

  const profQuery = useQuery({
    queryKey: ['pp', 'professionalId'],
    queryFn: getCurrentProfessionalId,
  })

  const coursesQuery = useQuery({
    queryKey: ['academy', 'courses'],
    queryFn: getPublishedCourses,
  })

  const loading = profQuery.isLoading || coursesQuery.isLoading

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <PageHeader title="Academy" subtitle="Formação contínua do Profissional Parceiro" />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#17310A" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerClassName="gap-4 pb-8">
          {(coursesQuery.data ?? []).length === 0 ? (
            <View className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-8">
              <Text className="text-center text-sm text-muted-foreground">
                Nenhum curso disponível no momento.
              </Text>
            </View>
          ) : (
            (coursesQuery.data ?? []).map((course) => (
              <Pressable
                key={course.id}
                onPress={() => router.push(`/(app)/academy/modulos/${course.id}`)}
                className="flex-row items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 active:bg-muted/30"
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <GraduationCap size={18} color="#17310A" />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="font-medium text-foreground">{course.title}</Text>
                  {course.description ? (
                    <Text className="text-xs text-muted-foreground" numberOfLines={2}>
                      {course.description}
                    </Text>
                  ) : null}
                </View>
                <ChevronRight size={18} color="#5A7920" />
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
