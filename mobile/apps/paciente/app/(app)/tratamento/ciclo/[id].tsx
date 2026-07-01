import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { supabase } from '@/lib/supabase'

export default function CicloDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ['paciente', 'cycle', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('care_cycles').select('*').eq('id', id!).single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <PageHeader>
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()} className="p-2">
            <ArrowLeft size={22} color="#17310A" />
          </Pressable>
          <Text className="text-lg font-semibold">Ciclo</Text>
        </View>
      </PageHeader>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#17310A" />
        </View>
      ) : !data ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">Ciclo não encontrado.</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerClassName="gap-3 py-4">
          <View className="rounded-xl border border-border bg-card p-5 gap-2">
            <Text className="text-sm text-muted-foreground">Ciclo</Text>
            <Text className="font-medium">#{String(data.cycle_number)}</Text>
            <Text className="text-sm text-muted-foreground">Status</Text>
            <Text className="font-medium">{String(data.status)}</Text>
            <Text className="text-sm text-muted-foreground">Sessões</Text>
            <Text className="font-medium">{String(data.session_count)}</Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
