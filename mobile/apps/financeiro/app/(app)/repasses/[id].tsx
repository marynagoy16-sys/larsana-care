import { useLocalSearchParams } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native'
import { SubScreenHeader } from '@/components/layout/SubScreenHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getTransferDetail } from '@/services/transfers'
import { edgeFunctions } from '@/services/edgeFunctions'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters'

export default function TransferDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['transfer', id],
    queryFn: () => getTransferDetail(id!),
    enabled: !!id,
  })

  const releaseMutation = useMutation({
    mutationFn: () => edgeFunctions.transferWallet({ transfer_id: id! }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transfer', id] })
      void queryClient.invalidateQueries({ queryKey: ['transfers'] })
      void queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] })
      Alert.alert('Sucesso', 'Repasse liberado via Wallet.')
    },
    onError: (e: Error) => Alert.alert('Erro', e.message ?? 'Falha ao liberar repasse.'),
  })

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <SubScreenHeader title="Repasse" />
        <ActivityIndicator className="mt-8" color="#17310A" />
      </View>
    )
  }

  if (error || !data) {
    return (
      <View className="flex-1 bg-background">
        <SubScreenHeader title="Repasse" />
        <Text className="mt-8 text-center text-destructive">Repasse não encontrado.</Text>
      </View>
    )
  }

  const professional = data.professionals as { full_name: string; email: string; id: string } | null

  return (
    <View className="flex-1 bg-background">
      <SubScreenHeader title="Repasse" />
      <ScrollView className="flex-1 px-4" contentContainerClassName="gap-4 pb-8">
        <View className="items-center gap-2 py-4">
          <Text className="font-display text-3xl font-bold text-foreground">
            {formatCurrency(data.pp_transfer_amount_cents)}
          </Text>
          <Badge status={data.status} kind="transfer" />
        </View>

        <Card className="gap-3 p-4">
          <DetailRow label="Profissional" value={professional?.full_name ?? '—'} />
          <DetailRow label="E-mail" value={professional?.email ?? '—'} />
          <DetailRow label="Status" value={data.status} />
          <DetailRow label="Criado em" value={formatDateTime(data.created_at)} />
          {data.transferred_at ? (
            <DetailRow label="Transferido em" value={formatDateTime(data.transferred_at)} />
          ) : null}
          <DetailRow label="Ciclo" value={data.cycle_id} />
          <DetailRow
            label="Valor cobrado paciente"
            value={formatCurrency(data.patient_charged_amount_cents)}
          />
        </Card>

        {data.status !== 'transferido' ? (
          <Button loading={releaseMutation.isPending} onPress={() => releaseMutation.mutate()}>
            Liberar repasse (Wallet)
          </Button>
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
