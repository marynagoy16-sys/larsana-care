import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { SubScreenHeader } from '@/components/layout/SubScreenHeader'
import { MonthPicker } from '@/components/ui/DatePicker'
import { ChargeCard } from '@/components/financeiro/ChargeCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { getFaturamentoData } from '@/services/reports'
import { formatCurrency, getCurrentMonthKey } from '@/lib/formatters'

export default function FaturamentoReportScreen() {
  const [monthKey, setMonthKey] = useState(getCurrentMonthKey())

  const { data, isLoading } = useQuery({
    queryKey: ['report-faturamento', monthKey],
    queryFn: () => getFaturamentoData(monthKey),
  })

  const total = data?.total ?? 0
  const pago = data?.pago ?? 0
  const pendente = data?.pendente ?? 0
  const vencido = data?.vencido ?? 0

  return (
    <View className="flex-1 bg-background">
      <SubScreenHeader title="Faturamento" />
      <ScrollView className="flex-1 px-4" contentContainerClassName="gap-4 pb-8">
        <MonthPicker value={monthKey} onChange={setMonthKey} label="Período" />

        <View className="rounded-xl border border-border bg-card p-4 gap-3">
          <Text className="text-sm text-muted-foreground">Total do período</Text>
          <Text className="font-display text-2xl font-bold text-foreground">{formatCurrency(total)}</Text>
          <BreakdownBar label="Pago" value={pago} total={total} color="bg-emerald-500" />
          <BreakdownBar label="Pendente" value={pendente} total={total} color="bg-amber-500" />
          <BreakdownBar label="Vencido" value={vencido} total={total} color="bg-red-500" />
        </View>

        {isLoading ? (
          <ActivityIndicator color="#17310A" />
        ) : data?.charges.length ? (
          data.charges.map((charge) => <ChargeCard key={charge.id} charge={charge} />)
        ) : (
          <EmptyState title="Sem cobranças no período" />
        )}
      </ScrollView>
    </View>
  )
}

function BreakdownBar({
  label,
  value,
  total,
  color,
}: {
  label: string
  value: number
  total: number
  color: string
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <View className="gap-1">
      <View className="flex-row justify-between">
        <Text className="text-xs text-muted-foreground">{label}</Text>
        <Text className="text-xs font-medium text-foreground">
          {formatCurrency(value)} ({pct}%)
        </Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-muted">
        <View className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </View>
    </View>
  )
}
