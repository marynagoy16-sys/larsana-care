import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { ChevronRight, SquareStack, Layers, FileStack, List, Users } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { listPPPatients } from '@/services/ppPatients'

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

export default function PacientesScreen() {
  const router = useRouter()
  const { data, isLoading } = useQuery({
    queryKey: ['pp', 'patients'],
    queryFn: listPPPatients,
  })

  const patients = data?.data ?? []
  const count = data?.count ?? 0
  const activeCount = patients.filter((p) => p.care_status === 'ATIVO').length

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <PageHeader title="Meus pacientes" subtitle="Pacientes em atendimento" />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#17310A" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerClassName="gap-3 pb-8">
          <View className="flex-row flex-wrap gap-2">
            <KpiCard
              label="Total"
              value={String(count)}
              icon={SquareStack}
              description="Meus pacientes"
            />
            <KpiCard
              label="ATIVO"
              value={String(activeCount)}
              icon={Layers}
              description={activeCount > 0 ? `${Math.round((activeCount / count) * 100)}% do total` : '0% do total'}
            />
            <KpiCard
              label="Visíveis"
              value={String(count)}
              icon={FileStack}
              description="Sem filtro"
            />
            <KpiCard
              label="Visíveis"
              value={String(count)}
              icon={List}
              description={`1–${count} de ${count}`}
            />
          </View>

          {patients.length === 0 ? (
            <View className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-8">
              <Text className="text-center text-sm text-muted-foreground">
                Nenhum paciente em atendimento.
              </Text>
            </View>
          ) : (
            patients.map((patient) => (
              <Pressable
                key={patient.id}
                onPress={() => router.push(`/(app)/pacientes/${patient.id}`)}
                className="flex-row items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 active:bg-muted/30"
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Users size={18} color="#17310A" />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="font-medium text-foreground">{patient.full_name}</Text>
                  <Text className="text-xs text-muted-foreground">
                    {patient.care_status} {patient.patient_level ? `· ${patient.patient_level}` : ''}
                  </Text>
                </View>
                <ChevronRight size={18} color="#5A7920" />
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
