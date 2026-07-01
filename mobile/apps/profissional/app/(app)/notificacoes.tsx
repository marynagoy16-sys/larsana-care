import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FileStack, Layers, List, SquareStack } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'

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

export default function NotificacoesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <PageHeader title="Notificações" subtitle="Alertas e avisos" />

      <ScrollView className="flex-1 px-4" contentContainerClassName="gap-3 pb-8">
        <View className="flex-row flex-wrap gap-2">
          <KpiCard
            label="Total"
            value="0"
            icon={SquareStack}
            description="Notificações"
          />
          <KpiCard
            label="Registros"
            value="0"
            icon={FileStack}
            description="Sem filtro aplicado"
          />
          <KpiCard
            label="Nesta página"
            value="0"
            icon={List}
            description="Nenhum registro"
          />
          <KpiCard
            label="Páginas"
            value="1"
            icon={Layers}
            description="—"
          />
        </View>

        <View className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-8">
          <Text className="text-center text-sm text-muted-foreground">
            Nenhuma notificação no momento.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
