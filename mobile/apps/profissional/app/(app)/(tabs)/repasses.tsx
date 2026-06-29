import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { FileStack, Layers, List, SquareStack } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import { listTransfersForPp } from '@/services/transfers'

function KpiCard({ label, value, icon: Icon, description }: {
  label: string
  value: string
  icon: any
  description?: string
}) {
  return (
    <View className="flex-1 rounded-xl border border-border bg-card p-3 gap-2 min-w-[100px]">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-medium text-muted-foreground">{label}</Text>
        <Icon size={14} color="#5A7920" />
      </View>
      <Text className="text-2xl font-bold text-foreground">{value}</Text>
      {description ? (
        <Text className="text-[10px] text-muted-foreground leading-tight" numberOfLines={2}>
          {description}
        </Text>
      ) : null}
    </View>
  )
}

export default function RepassesTabScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['pp', 'transfers'],
    queryFn: listTransfersForPp,
  })

  const transfers = data?.data ?? []
  const count = data?.count ?? 0

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <PageHeader title="Repasses" subtitle="Ganhos pós-ciclo liberados pela Larsana" />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#17310A" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerClassName="gap-3 pb-28">
          <View className="flex-row flex-wrap gap-2">
            <KpiCard
              label="Total"
              value={String(count)}
              icon={SquareStack}
              description="Repasses"
            />
            <KpiCard
              label="Registros"
              value={String(count)}
              icon={FileStack}
              description="Sem filtro aplicado"
            />
            <KpiCard
              label="Nesta página"
              value={String(count)}
              icon={List}
              description={count === 0 ? 'Nenhum registro' : `1–${count} de ${count}`}
            />
            <KpiCard
              label="Páginas"
              value="1"
              icon={Layers}
              description="—"
            />
          </View>

          {transfers.length === 0 ? (
            <View className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-8">
              <Text className="text-center text-sm text-muted-foreground">
                Nenhum repasse registrado ainda.
              </Text>
            </View>
          ) : (
            transfers.map((transfer) => (
              <View key={transfer.id} className="rounded-xl border border-border bg-card p-4">
                <Text className="text-lg font-semibold text-foreground">
                  {formatCurrency(transfer.pp_transfer_amount_cents)}
                </Text>
                <Text className="mt-1 text-sm text-muted-foreground">Status: {transfer.status}</Text>
                <Text className="mt-0.5 text-xs text-muted-foreground">
                  {formatDateTime(transfer.created_at)}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
