import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native'
import { listTransfersWithProfessionals } from '@/services/transfers'
import { TransferCard } from '@/components/financeiro/TransferCard'
import { TransferStatusFilterBar, type TransferStatusFilter } from '@/components/financeiro/StatusFilter'
import { EmptyState } from '@/components/ui/EmptyState'

export default function RepassesScreen() {
  const [statusFilter, setStatusFilter] = useState<TransferStatusFilter>('todos')

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['transfers'],
    queryFn: listTransfersWithProfessionals,
  })

  const filtered = useMemo(() => {
    const rows = data ?? []
    if (statusFilter === 'todos') return rows
    if (statusFilter === 'transferido') return rows.filter((t) => t.status === 'transferido')
    return rows.filter((t) => t.status !== 'transferido')
  }, [data, statusFilter])

  return (
    <ScrollView
      className="flex-1 px-4"
      contentContainerClassName="gap-4 pb-8"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
    >
      <TransferStatusFilterBar value={statusFilter} onChange={setStatusFilter} />

      {isLoading ? (
        <ActivityIndicator color="#095742" className="mt-8" />
      ) : filtered.length ? (
        filtered.map((transfer) => <TransferCard key={transfer.id} transfer={transfer} />)
      ) : (
        <EmptyState title="Nenhum repasse encontrado" />
      )}
    </ScrollView>
  )
}
