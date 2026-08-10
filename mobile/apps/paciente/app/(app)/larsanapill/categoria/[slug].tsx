import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ChevronRight } from 'lucide-react-native'
import { SubScreenHeader } from '@/components/layout/SubScreenHeader'
import { getCategoryBySlug, getCategoryContents } from '@/services/larsanapill'

export default function LarsanaPillCategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()

  const { data: category, isLoading: loadingCat } = useQuery({
    queryKey: ['paciente', 'larsanapill', 'category', slug],
    queryFn: () => getCategoryBySlug(slug!),
    enabled: !!slug,
  })

  const { data: contents, isLoading: loadingContents } = useQuery({
    queryKey: ['paciente', 'larsanapill', 'category-contents', category?.id],
    queryFn: () => getCategoryContents(category!.id),
    enabled: !!category?.id,
  })

  const isLoading = loadingCat || loadingContents

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <SubScreenHeader title={category?.title ?? 'Categoria'} />
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#095742" />
        </View>
      ) : !category ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">Categoria não encontrada.</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerClassName="gap-3 pb-8 pt-2">
          {category.description ? (
            <Text className="text-sm text-muted-foreground">{category.description}</Text>
          ) : null}
          {(contents ?? []).map((content) => (
            <Pressable
              key={content.id}
              onPress={() => router.push(`/(app)/larsanapill/categoria/${slug}/conteudo/${content.id}`)}
              className="flex-row items-center gap-3 rounded-xl border border-border bg-card px-4 py-4"
            >
              <View className="min-w-0 flex-1">
                <Text className="font-medium text-foreground">{content.title}</Text>
                <Text className="text-xs text-muted-foreground">{content.content_type}</Text>
              </View>
              <ChevronRight size={18} color="#49796B" />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
