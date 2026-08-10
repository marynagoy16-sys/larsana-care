import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { Plus } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { listChargesWithPatients } from '@/services/charges'
import { ChargeCard } from '@/components/financeiro/ChargeCard'
import { StatusFilter, type StatusFilterValue } from '@/components/financeiro/StatusFilter'
import { SearchField } from '@/components/ui/SearchField'
import { MonthPicker } from '@/components/ui/DatePicker'
import { EmptyState } from '@/components/ui/EmptyState'
import { getCurrentMonthKey, getEffectivePaymentStatus, getMonthRange } from '@/lib/formatters'

export default function CobrancasScreen() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('todos')
  const [search, setSearch] = useState('')
  const [monthKey, setMonthKey] = useState(getCurrentMonthKey())

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['charges'],
    queryFn: listChargesWithPatients,
  })

  const filtered = useMemo(() => {
    const rows = data ?? []
    const { start, end } = getMonthRange(monthKey)

    return rows.filter((charge) => {
      const inMonth =
        charge.created_at >= `${start}T00:00:00` && charge.created_at <= `${end}T23:59:59`
      if (!inMonth) return false

      const effectiveStatus = getEffectivePaymentStatus(charge.payment_status, charge.due_date)
      if (statusFilter !== 'todos' && effectiveStatus !== statusFilter) return false

      if (search.trim()) {
        const name = charge.patients?.full_name?.toLowerCase() ?? ''
        if (!name.includes(search.trim().toLowerCase())) return false
      }

      return true
    })
  }, [data, statusFilter, search, monthKey])

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1 px-4"
        contentContainerClassName="gap-4 pb-24"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
      >
        <SearchField value={search} onChangeText={setSearch} placeholder="Buscar paciente" />
        <MonthPicker value={monthKey} onChange={setMonthKey} label="Período" />
        <StatusFilter value={statusFilter} onChange={setStatusFilter} />

        {isLoading ? (
          <ActivityIndicator color="#095742" className="mt-8" />
        ) : filtered.length ? (
          filtered.map((charge) => <ChargeCard key={charge.id} charge={charge} />)
        ) : (
          <EmptyState title="Nenhuma cobrança encontrada" description="Ajuste os filtros ou crie uma nova cobrança." />
        )}
      </ScrollView>

      <Pressable
        onPress={() => router.push('/(app)/cobrancas/nova')}
        className="absolute bottom-6 right-6 flex-row items-center gap-2 rounded-full bg-primary px-5 py-3 shadow-lg"
      >
        <Plus size={20} color="#fff" />
        <Text className="font-semibold text-primary-foreground">Nova cobrança</Text>
      </Pressable>
    </View>
  )
}
