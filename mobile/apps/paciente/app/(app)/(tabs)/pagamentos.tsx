import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { ChevronRight, FileStack, Layers, List, SquareStack } from 'lucide-react-native'
import { KpiCard } from '@/components/ui/KpiCard'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { supabase } from '@/lib/supabase'

export default function PagamentosScreen() {
  const router = useRouter()
  const { data, isLoading } = useQuery({
    queryKey: ['paciente', 'charges'],
    queryFn: async () => {
      const { data, error } = await supabase.from('charges_patient').select('*').order('due_date', { ascending: false })
      if (error) throw error
      const rows = data ?? []
      return { data: rows, count: rows.length }
    },
  })

  const charges = data?.data ?? []
  const count = data?.count ?? 0

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#17310A" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerClassName="gap-3 pb-28">
          <View className="flex-row flex-wrap gap-2">
            <KpiCard label="Total" value={String(count)} icon={SquareStack} description="Pagamentos" />
            <KpiCard label="Registros" value={String(count)} icon={FileStack} description="Sem filtro aplicado" />
            <KpiCard label="Nesta página" value={String(count)} icon={List} description={count === 0 ? 'Nenhum registro' : `1–${count} de ${count}`} />
            <KpiCard label="Páginas" value="1" icon={Layers} description="—" />
          </View>
          {charges.length === 0 ? (
            <View className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-8">
              <Text className="text-center text-sm text-muted-foreground">Nenhum pagamento registrado.</Text>
            </View>
          ) : (
            charges.map((charge: any) => (
              <Pressable
                key={charge.id}
                onPress={() => router.push(`/(app)/pagamentos/${charge.id}`)}
                className="flex-row items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 active:bg-muted/30"
              >
                <View className="min-w-0 flex-1">
                  <Text className="font-medium text-foreground">{formatCurrency(Number(charge.amount_cents))}</Text>
                  <Text className="mt-0.5 text-xs text-muted-foreground">
                    {String(charge.payment_status)} · {charge.due_date ? formatDate(String(charge.due_date)) : '—'}
                  </Text>
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
