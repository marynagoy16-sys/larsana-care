import { useLocalSearchParams } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native'
import { SubScreenHeader } from '@/components/layout/SubScreenHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  getSubRepasseDetail,
  releaseSubRepasseToWallet,
  simulateSubRepasseWallet,
} from '@/services/transfers'
import { formatCurrency, formatDateTime } from '@/lib/formatters'

export default function SubRepasseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['sub-repasse', id],
    queryFn: () => getSubRepasseDetail(id!),
    enabled: !!id,
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['sub-repasse', id] })
    void queryClient.invalidateQueries({ queryKey: ['sub-repasses'] })
  }

  const walletMutation = useMutation({
    mutationFn: () => releaseSubRepasseToWallet(id!),
    onSuccess: () => {
      invalidate()
      Alert.alert('Sucesso', 'Repasse SUB enviado via Wallet Asaas.')
    },
    onError: (e: Error) => Alert.alert('Erro', e.message),
  })

  const simulateMutation = useMutation({
    mutationFn: () => simulateSubRepasseWallet(id!),
    onSuccess: () => {
      invalidate()
      Alert.alert('Simulado', 'Repasse SUB marcado como transferido.')
    },
    onError: (e: Error) => Alert.alert('Erro', e.message),
  })

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <SubScreenHeader title="Repasse SUB" />
        <ActivityIndicator className="mt-8" color="#095742" />
      </View>
    )
  }

  if (error || !data) {
    return (
      <View className="flex-1 bg-background">
        <SubScreenHeader title="Repasse SUB" />
        <Text className="mt-8 text-center text-destructive">Repasse SUB não encontrado.</Text>
      </View>
    )
  }

  const substitute = data.substitute as { full_name: string; email: string } | null
  const assigned = data.assigned as { full_name: string; email: string } | null
  const patient = data.patients as { full_name: string } | null
  const busy = walletMutation.isPending || simulateMutation.isPending

  return (
    <View className="flex-1 bg-background">
      <SubScreenHeader title="Repasse SUB" />
      <ScrollView className="flex-1 px-4" contentContainerClassName="gap-4 pb-8">
        <View className="items-center gap-2 py-4">
          <Text className="font-display text-3xl font-bold text-foreground">
            {formatCurrency(data.amount_cents)}
          </Text>
          <Badge status={data.status} kind="transfer" />
          <Text className="text-sm text-muted-foreground">Repasse avulso · sem NF</Text>
        </View>

        <Card className="gap-3 p-4">
          <DetailRow label="Substituto" value={substitute?.full_name ?? '—'} />
          <DetailRow label="PP titular" value={assigned?.full_name ?? '—'} />
          <DetailRow label="Paciente" value={patient?.full_name ?? '—'} />
          <DetailRow label="Sessão" value={String(data.session_number)} />
          <DetailRow label="Comissão" value={`${data.pp_percentage}%`} />
          <DetailRow label="Status" value={data.status} />
          <DetailRow label="Criado em" value={formatDateTime(data.created_at)} />
          {data.transferred_at ? (
            <DetailRow label="Transferido em" value={formatDateTime(data.transferred_at)} />
          ) : null}
        </Card>

        {data.status === 'liberado' ? (
          <View className="gap-2">
            <Button loading={busy} onPress={() => walletMutation.mutate()}>
              Transferir via Wallet Asaas
            </Button>
            <Button variant="secondary" loading={busy} onPress={() => simulateMutation.mutate()}>
              Simular transferência (dev)
            </Button>
          </View>
        ) : null}
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
