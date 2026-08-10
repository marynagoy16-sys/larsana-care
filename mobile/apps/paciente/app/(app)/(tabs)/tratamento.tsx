import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { ChevronRight, FileStack, Layers, List, SquareStack } from 'lucide-react-native'
import { KpiCard } from '@/components/ui/KpiCard'
import { supabase } from '@/lib/supabase'

export default function TratamentoScreen() {
  const router = useRouter()
  const { data, isLoading } = useQuery({
    queryKey: ['paciente', 'cycles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('care_cycles')
        .select('id, cycle_number, status, session_count')
        .order('created_at', { ascending: false })
      if (error) throw error
      const rows = data ?? []
      return { data: rows, count: rows.length }
    },
  })

  const cycles = data?.data ?? []
  const count = data?.count ?? 0

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#095742" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerClassName="gap-3 pb-28">
          <View className="flex-row flex-wrap gap-2">
            <KpiCard label="Total" value={String(count)} icon={SquareStack} description="Ciclos" />
            <KpiCard label="Registros" value={String(count)} icon={FileStack} description="Sem filtro aplicado" />
            <KpiCard label="Nesta página" value={String(count)} icon={List} description={count === 0 ? 'Nenhum registro' : `1–${count} de ${count}`} />
            <KpiCard label="Páginas" value="1" icon={Layers} description="—" />
          </View>
          {cycles.length === 0 ? (
            <View className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-8">
              <Text className="text-center text-sm text-muted-foreground">Nenhum ciclo encontrado.</Text>
            </View>
          ) : (
            cycles.map((cycle: any) => (
              <Pressable
                key={cycle.id}
                onPress={() => router.push(`/(app)/tratamento/ciclo/${cycle.id}`)}
                className="flex-row items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 active:bg-muted/30"
              >
                <View className="min-w-0 flex-1">
                  <Text className="font-medium text-foreground">Ciclo #{cycle.cycle_number}</Text>
                  <Text className="mt-0.5 text-xs text-muted-foreground">
                    {cycle.session_count} sessões · {cycle.status}
                  </Text>
                </View>
                <ChevronRight size={18} color="#49796B" />
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
