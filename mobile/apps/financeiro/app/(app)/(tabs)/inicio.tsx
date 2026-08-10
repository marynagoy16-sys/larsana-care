import { useQuery } from '@tanstack/react-query'
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native'
import { getFinanceKpis } from '@/services/dashboard'
import { DashboardKpiGrid } from '@/components/financeiro/DashboardKpiGrid'
import { ChargeCard } from '@/components/financeiro/ChargeCard'
import { TransferCard } from '@/components/financeiro/TransferCard'
import { EmptyState } from '@/components/ui/EmptyState'

export default function InicioScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['finance-dashboard'],
    queryFn: getFinanceKpis,
  })

  if (isLoading && !data) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#095742" />
      </View>
    )
  }

  return (
    <ScrollView
      className="flex-1 px-4"
      contentContainerClassName="gap-6 pb-8"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
    >
      {data ? <DashboardKpiGrid kpis={data} /> : null}

      <View className="gap-3">
        <Text className="font-display text-base font-bold text-foreground">Últimas cobranças</Text>
        {data?.recentCharges.length ? (
          data.recentCharges.map((charge) => <ChargeCard key={charge.id} charge={charge} />)
        ) : (
          <EmptyState title="Nenhuma cobrança recente" />
        )}
      </View>

      <View className="gap-3">
        <Text className="font-display text-base font-bold text-foreground">Repasses pendentes</Text>
        {data?.recentPendingTransfers.length ? (
          data.recentPendingTransfers.map((transfer) => (
            <TransferCard key={transfer.id} transfer={transfer} />
          ))
        ) : (
          <EmptyState title="Nenhum repasse pendente" />
        )}
      </View>
    </ScrollView>
  )
}
