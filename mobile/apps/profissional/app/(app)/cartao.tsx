import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { FileStack, Layers, List, SquareStack } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { getProfessionalPublicProfile } from '@/services/credentialing'

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

export default function CartaoScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['pp', 'publicProfile'],
    queryFn: getProfessionalPublicProfile,
  })

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <PageHeader title="Cartão de visita" subtitle="Compartilhe seu perfil" />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#17310A" />
        </View>
      ) : !data ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-muted-foreground">Dados não encontrados.</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerClassName="gap-3 pb-8">
          <View className="flex-row flex-wrap gap-2">
            <KpiCard
              label="Total"
              value="0"
              icon={SquareStack}
              description="Informações exibidas no cartão digital"
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

          <View className="rounded-xl border border-border bg-card p-6 gap-3 items-center">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Text className="text-2xl font-bold text-primary">
                {data.full_name?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>
            <Text className="text-center font-display text-xl font-bold text-foreground">
              {data.full_name ?? 'Profissional'}
            </Text>
            <Text className="text-center text-sm text-muted-foreground">
              {data.profession ?? ''} {data.specialty ? `· ${data.specialty}` : ''}
            </Text>
            {data.council_registration ? (
              <Text className="text-xs text-muted-foreground">
                CREFITO: {data.council_registration}
              </Text>
            ) : null}
            <Text className="text-xs text-muted-foreground">
              Status: {data.credentialing_status ?? '—'}
            </Text>
            <Text className="text-xs text-muted-foreground">
              Classe: {data.pp_class ?? '—'}
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
