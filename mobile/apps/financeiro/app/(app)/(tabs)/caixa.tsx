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
import { listExpenses } from '@/services/expenses'
import { ExpenseCard } from '@/components/financeiro/ExpenseCard'
import { MonthPicker } from '@/components/ui/DatePicker'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, getCurrentMonthKey } from '@/lib/formatters'

export default function CaixaScreen() {
  const router = useRouter()
  const [monthKey, setMonthKey] = useState(getCurrentMonthKey())

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['expenses', monthKey],
    queryFn: () => listExpenses(monthKey),
  })

  const monthTotal = useMemo(
    () => (data ?? []).reduce((sum, e) => sum + e.amount_cents, 0),
    [data],
  )

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1 px-4"
        contentContainerClassName="gap-4 pb-24"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
      >
        <MonthPicker value={monthKey} onChange={setMonthKey} label="Mês de referência" />

        <View className="rounded-xl border border-border bg-card p-4">
          <Text className="text-sm text-muted-foreground">Total do mês</Text>
          <Text className="font-display text-2xl font-bold text-foreground">{formatCurrency(monthTotal)}</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color="#095742" className="mt-8" />
        ) : data?.length ? (
          data.map((expense) => <ExpenseCard key={expense.id} expense={expense} />)
        ) : (
          <EmptyState title="Nenhuma despesa neste mês" />
        )}
      </ScrollView>

      <Pressable
        onPress={() => router.push('/(app)/caixa/nova')}
        className="absolute bottom-6 right-6 flex-row items-center gap-2 rounded-full bg-primary px-5 py-3 shadow-lg"
      >
        <Plus size={20} color="#fff" />
        <Text className="font-semibold text-primary-foreground">Nova despesa</Text>
      </Pressable>
    </View>
  )
}
