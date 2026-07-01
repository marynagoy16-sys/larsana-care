import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ChevronRight, FileStack, Layers, List, SquareStack } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  listPendingEvolutionsForPp,
  pendingEvolutionDeadlineLabel,
  ppEvolutionsQueryKeys,
  type PendingEvolutionRow,
} from '@/services/ppEvolutions'
import { formatDateTime } from '@/lib/formatters'

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

export default function EvolucaoScreen() {
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ppEvolutionsQueryKeys.pending,
    queryFn: listPendingEvolutionsForPp,
  })

  const items = data?.data ?? []
  const count = data?.count ?? 0

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <PageHeader
        title="Evoluções pendentes"
        subtitle="Sessões realizadas aguardando registro (prazo 24h)"
      />

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
              description="Sessões realizadas aguardando registro clínico (prazo 24h)"
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
              description={`1–${count} de ${count}`}
            />
            <KpiCard
              label="Páginas"
              value="1"
              icon={Layers}
              description="1ª página ativa"
            />
          </View>

          {items.length === 0 ? (
            <View className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-8">
              <Text className="text-center text-sm text-muted-foreground">
                Nenhuma evolução pendente. Ótimo trabalho!
              </Text>
            </View>
          ) : (
            items.map((row: PendingEvolutionRow) => {
              const deadline = pendingEvolutionDeadlineLabel(row)
              const overdue = deadline.startsWith('Atrasada')
              const patientName = row.care_cycles?.patients?.full_name ?? 'Paciente'

              return (
                <Pressable
                  key={row.id}
                  onPress={() => router.push(`/(app)/evolucao/nova?session=${row.id}`)}
                  className="flex-row items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 active:bg-muted/30"
                >
                  <View className="min-w-0 flex-1">
                    <Text className="text-sm font-medium text-foreground">{patientName}</Text>
                    <Text className="text-xs text-muted-foreground">
                      Ciclo {row.care_cycles?.cycle_number ?? '—'} · Sessão #{row.session_number}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      Realizada em {row.check_out_at || row.scheduled_at
                        ? formatDateTime(String(row.check_out_at ?? row.scheduled_at))
                        : '—'}
                    </Text>
                  </View>
                  <View className={`shrink-0 rounded-full px-2.5 py-1 ${overdue ? 'bg-red-100' : 'bg-amber-100'}`}>
                    <Text className={`text-[11px] font-medium ${overdue ? 'text-red-700' : 'text-amber-700'}`}>
                      {deadline}
                    </Text>
                  </View>
                  <ChevronRight size={18} color="#5A7920" />
                </Pressable>
              )
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
