import { useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SubScreenHeader } from '@/components/layout/SubScreenHeader'
import { ContentLessonLayout } from '@/components/content/ContentLessonLayout'
import { LarsanaPillContentPlayer } from '@/components/larsanapill/LarsanaPillContentPlayer'
import { getPrevNext } from '@/lib/lessonNavigation'
import {
  getCategoryPlayerContext,
  getContentById,
  getPrimaryPatientId,
  markContentComplete,
} from '@/services/larsanapill'

export default function LarsanaPillContentScreen() {
  const { slug, id } = useLocalSearchParams<{ slug: string; id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [completing, setCompleting] = useState(false)

  const { data: patientId } = useQuery({
    queryKey: ['paciente', 'patient-id'],
    queryFn: getPrimaryPatientId,
  })

  const { data: content, isLoading: loadingContent } = useQuery({
    queryKey: ['paciente', 'larsanapill', 'content', id],
    queryFn: () => getContentById(id!),
    enabled: !!id,
  })

  const { data: playerContext, isLoading: loadingContext } = useQuery({
    queryKey: ['paciente', 'larsanapill', 'player-context', slug, patientId],
    queryFn: () => getCategoryPlayerContext(slug!, patientId!),
    enabled: Boolean(slug && patientId),
  })

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!patientId || !id) return
      setCompleting(true)
      await markContentComplete(patientId, id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paciente', 'larsanapill'] })
      const nav = playerContext ? getPrevNext(playerContext.flatItems, id!) : null
      if (nav?.next) {
        router.replace(`/(app)/larsanapill/categoria/${slug}/conteudo/${nav.next.itemId}`)
      }
    },
    onSettled: () => setCompleting(false),
  })

  const isLoading = loadingContent || loadingContext

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <SubScreenHeader title={content?.title ?? playerContext?.category.title ?? 'Conteúdo'} />
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#095742" />
        </View>
      ) : !content || !playerContext || !slug || !id ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-muted-foreground">Conteúdo não encontrado.</Text>
        </View>
      ) : (
        <ContentLessonLayout
          groups={playerContext.groups}
          activeItemId={id}
          completedItemIds={playerContext.completedItemIds}
          onSelectItem={(contentId) =>
            router.replace(`/(app)/larsanapill/categoria/${slug}/conteudo/${contentId}`)
          }
        >
          <LarsanaPillContentPlayer
            content={content}
            completing={completing || completeMutation.isPending}
            onComplete={() => completeMutation.mutate()}
          />
        </ContentLessonLayout>
      )}
    </SafeAreaView>
  )
}
