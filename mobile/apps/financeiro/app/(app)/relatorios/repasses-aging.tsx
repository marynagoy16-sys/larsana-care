import { useQuery } from '@tanstack/react-query'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { SubScreenHeader } from '@/components/layout/SubScreenHeader'
import { TransferCard } from '@/components/financeiro/TransferCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { getRepassesAgingData } from '@/services/reports'
import { daysSince, formatCurrency } from '@/lib/formatters'

export default function RepassesAgingReportScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['report-repasses-aging'],
    queryFn: getRepassesAgingData,
  })

  return (
    <View className="flex-1 bg-background">
      <SubScreenHeader title="Repasses Aging" />
      <ScrollView className="flex-1 px-4" contentContainerClassName="gap-4 pb-8">
        <View className="rounded-xl border border-border bg-card p-4">
          <Text className="text-sm text-muted-foreground">Total pendente</Text>
          <Text className="font-display text-2xl font-bold text-foreground">
            {formatCurrency(data?.total ?? 0)}
          </Text>
          <Text className="mt-1 text-xs text-muted-foreground">{data?.count ?? 0} repasses em aberto</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color="#095742" />
        ) : data?.transfers.length ? (
          data.transfers.map((transfer) => (
            <View key={transfer.id} className="gap-1">
              <Text className="text-xs font-medium text-amber-700">
                {daysSince(transfer.created_at)} dias em aberto
              </Text>
              <TransferCard transfer={transfer} />
            </View>
          ))
        ) : (
          <EmptyState title="Nenhum repasse pendente" />
        )}
      </ScrollView>
    </View>
  )
}
