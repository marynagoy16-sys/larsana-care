import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native'
import { SubScreenHeader } from '@/components/layout/SubScreenHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getChargeDetail } from '@/services/charges'
import { chargesService } from '@/services/charges'
import { formatCurrency, formatDate, formatDateTime, getEffectivePaymentStatus } from '@/lib/formatters'

export default function ChargeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['charge', id],
    queryFn: () => getChargeDetail(id!),
    enabled: !!id,
  })

  const markPaid = useMutation({
    mutationFn: () =>
      chargesService.update(id!, {
        payment_status: 'pago',
        paid_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['charge', id] })
      void queryClient.invalidateQueries({ queryKey: ['charges'] })
      void queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] })
      Alert.alert('Sucesso', 'Cobrança marcada como paga.')
    },
    onError: (e: Error) => Alert.alert('Erro', e.message),
  })

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <SubScreenHeader title="Cobrança" />
        <ActivityIndicator className="mt-8" color="#095742" />
      </View>
    )
  }

  if (error || !data) {
    return (
      <View className="flex-1 bg-background">
        <SubScreenHeader title="Cobrança" />
        <Text className="mt-8 text-center text-destructive">Cobrança não encontrada.</Text>
      </View>
    )
  }

  const patient = data.patients as { full_name: string; id: string } | null
  const status = getEffectivePaymentStatus(data.payment_status, data.due_date)

  return (
    <View className="flex-1 bg-background">
      <SubScreenHeader title="Cobrança" />
      <ScrollView className="flex-1 px-4" contentContainerClassName="gap-4 pb-8">
        <View className="items-center gap-2 py-4">
          <Text className="font-display text-3xl font-bold text-foreground">
            {formatCurrency(data.amount_cents)}
          </Text>
          <Badge status={status} kind="payment" />
        </View>

        <Card className="gap-3 p-4">
          <DetailRow label="Paciente" value={patient?.full_name ?? '—'} />
          <DetailRow label="Valor" value={formatCurrency(data.amount_cents)} />
          <DetailRow label="Vencimento" value={data.due_date ? formatDate(data.due_date) : '—'} />
          <DetailRow label="Método" value={data.payment_method ?? '—'} />
          <DetailRow label="Status" value={status} />
          <DetailRow label="Criado em" value={formatDateTime(data.created_at)} />
          {data.paid_at ? <DetailRow label="Pago em" value={formatDateTime(data.paid_at)} /> : null}
          {data.description ? <DetailRow label="Descrição" value={data.description} /> : null}
        </Card>

        <View className="gap-3">
          {status !== 'pago' ? (
            <Button loading={markPaid.isPending} onPress={() => markPaid.mutate()}>
              Marcar como pago (dev)
            </Button>
          ) : null}
          <Button variant="outline" onPress={() => Alert.alert('Em breve', 'Reenvio de boleto em desenvolvimento.')}>
            Reenviar boleto
          </Button>
          <Button variant="ghost" onPress={() => router.back()}>
            Voltar
          </Button>
        </View>
      </ScrollView>
    </View>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-4 border-b border-border/50 py-2 last:border-b-0">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className="max-w-[60%] text-right text-sm font-medium text-foreground">{value}</Text>
    </View>
  )
}
