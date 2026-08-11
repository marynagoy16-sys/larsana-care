import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { FileWarning, Wallet } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import {
  isTransferNfPending,
  listTransfersForPp,
  transferStatusLabels,
} from '@/services/transfers'

function SummaryCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View className="flex-1 rounded-xl border border-border bg-card p-3">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text className="mt-1 text-xl font-bold text-foreground">{value}</Text>
      {hint ? <Text className="mt-0.5 text-[10px] text-muted-foreground">{hint}</Text> : null}
    </View>
  )
}

export default function RepassesScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['pp', 'transfers'],
    queryFn: listTransfersForPp,
  })

  const transfers = data?.data ?? []
  const totalCents = transfers.reduce((sum, t) => sum + t.pp_transfer_amount_cents, 0)
  const nfPendingCount = transfers.filter((t) => isTransferNfPending(t.status)).length
  const transferredCount = transfers.filter((t) => t.status === 'transferido').length

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <PageHeader title="Repasses" subtitle="Ganhos por ciclo liberados pela Larsana" />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#095742" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerClassName="gap-3 pb-8">
          <View className="flex-row gap-2">
            <SummaryCard
              label="Total acumulado"
              value={formatCurrency(totalCents)}
              hint={`${transfers.length} repasse${transfers.length === 1 ? '' : 's'}`}
            />
            <SummaryCard
              label="Transferidos"
              value={String(transferredCount)}
              hint="Pagos ao PP"
            />
          </View>

          {nfPendingCount > 0 ? (
            <View className="flex-row items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3">
              <FileWarning size={18} color="#B45309" />
              <View className="min-w-0 flex-1">
                <Text className="text-sm font-medium text-amber-900">
                  {nfPendingCount} repasse{nfPendingCount === 1 ? '' : 's'} aguardando NF
                </Text>
                <Text className="mt-0.5 text-xs text-amber-800/90">
                  Envie a nota fiscal para liberar o pagamento do ciclo.
                </Text>
              </View>
            </View>
          ) : null}

          {transfers.length === 0 ? (
            <View className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-8">
              <Text className="text-center text-sm text-muted-foreground">
                Nenhum repasse registrado ainda.
              </Text>
            </View>
          ) : (
            transfers.map((transfer) => {
              const statusLabel = transferStatusLabels[transfer.status] ?? transfer.status
              const nfPending = isTransferNfPending(transfer.status)

              return (
                <View key={transfer.id} className="rounded-xl border border-border bg-card p-4">
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="min-w-0 flex-1">
                      <Text className="text-lg font-semibold text-foreground">
                        {formatCurrency(transfer.pp_transfer_amount_cents)}
                      </Text>
                      <Text className="mt-0.5 text-sm text-foreground">
                        {transfer.patient_name ?? 'Paciente'}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        Ciclo {transfer.cycle_number ?? '—'} · {formatDateTime(transfer.created_at)}
                      </Text>
                    </View>
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Wallet size={18} color="#095742" />
                    </View>
                  </View>
                  <View className="mt-3 flex-row flex-wrap items-center gap-2">
                    <View className={`rounded-full px-2.5 py-1 ${nfPending ? 'bg-amber-100' : 'bg-muted'}`}>
                      <Text className={`text-[11px] font-medium ${nfPending ? 'text-amber-800' : 'text-muted-foreground'}`}>
                        {statusLabel}
                      </Text>
                    </View>
                    {nfPending ? (
                      <Text className="text-[11px] text-amber-700">Envie a NF para liberar</Text>
                    ) : null}
                  </View>
                </View>
              )
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
