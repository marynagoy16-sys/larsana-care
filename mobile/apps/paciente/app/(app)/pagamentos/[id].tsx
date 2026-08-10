import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { simulateChargePayment } from '@/services/patientPayments'
import { patientPortalQueryKeys } from '@/services/patientPortal'
import { supabase } from '@/lib/supabase'

export default function PagamentoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['paciente', 'charges', id],
    queryFn: async () => {
      const { data: row, error } = await supabase
        .from('charges_patient')
        .select('id, amount_cents, payment_status, due_date, description, payment_method, cycle_id')
        .eq('id', id!)
        .single()
      if (error) throw error
      return row
    },
    enabled: !!id,
  })

  const simulateMutation = useMutation({
    mutationFn: () => simulateChargePayment(id!),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['paciente', 'charges', id] })
      queryClient.invalidateQueries({ queryKey: ['paciente', 'charges'] })
      queryClient.invalidateQueries({ queryKey: patientPortalQueryKeys.home })
      if (result.already_paid) {
        Alert.alert('Pagamento', 'Este pagamento já estava confirmado.')
        return
      }
      Alert.alert(
        'Pagamento confirmado',
        result.sessions_count > 0 ? `${result.sessions_count} sessões liberadas.` : 'Pagamento registrado.',
      )
    },
    onError: (err: Error) => Alert.alert('Erro', err.message),
  })

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <PageHeader>
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()} className="p-2">
            <ArrowLeft size={22} color="#095742" />
          </Pressable>
          <Text className="text-lg font-semibold">Detalhe do pagamento</Text>
        </View>
      </PageHeader>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#095742" />
        </View>
      ) : isError || !data ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-muted-foreground">Cobrança não encontrada.</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerClassName="gap-4 py-4 pb-8">
          <View className="rounded-xl border border-border bg-card p-5 gap-3">
            <Text className="text-2xl font-bold text-foreground">{formatCurrency(Number(data.amount_cents))}</Text>
            <Text className="text-sm text-muted-foreground">Status: {String(data.payment_status)}</Text>
            <Text className="text-sm text-muted-foreground">
              Vencimento: {data.due_date ? formatDate(String(data.due_date)) : '—'}
            </Text>
            {data.description ? <Text className="text-sm text-foreground">{data.description}</Text> : null}
          </View>
          {data.payment_status !== 'pago' ? (
            <Button onPress={() => simulateMutation.mutate()} loading={simulateMutation.isPending}>
              Simular pagamento (dev)
            </Button>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
