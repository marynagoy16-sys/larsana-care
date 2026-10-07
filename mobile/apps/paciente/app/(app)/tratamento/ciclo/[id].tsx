import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { loadPatientCycleDetail, patientTreatmentQueryKeys } from '@/services/patientTreatment'

const cycleStatusLabels: Record<string, string> = {
  rascunho: 'Rascunho',
  aguardando_pagamento: 'Aguardando pagamento',
  ativo: 'Ativo',
  em_pausa: 'Em pausa',
  em_analise: 'Em análise',
  encerrado: 'Concluído',
  fechado_financeiramente: 'Concluído',
  cancelado: 'Cancelado',
}

const sessionStatusLabels: Record<string, string> = {
  prevista: 'Agendada',
  realizada: 'Concluída',
  remarcada: 'Remarcada',
  falta: 'Falta',
  intercorrencia: 'Intercorrência',
  cancelada_sem_justificativa: 'Cancelada (50%)',
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function CicloDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const { data: cycle, isLoading } = useQuery({
    queryKey: patientTreatmentQueryKeys.detail(id ?? ''),
    queryFn: () => loadPatientCycleDetail(id!),
    enabled: !!id,
  })

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <PageHeader>
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()} className="p-2">
            <ArrowLeft size={22} color="#095742" />
          </Pressable>
          <Text className="text-lg font-semibold">Voltar</Text>
        </View>
      </PageHeader>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#095742" />
        </View>
      ) : !cycle ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-center text-muted-foreground">Ciclo não encontrado.</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerClassName="gap-5 py-4 pb-28">
          <View>
            <Text className="font-display text-xl font-bold text-foreground">Ciclo #{cycle.cycle_number}</Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              {cycleStatusLabels[cycle.status] ?? cycle.status}
            </Text>
          </View>

          <View className="rounded-xl border border-border bg-card p-4">
            <View className="flex-row items-center justify-between">
              <View className="min-w-0 flex-1">
                <Text className="text-sm font-semibold text-foreground">Progresso do ciclo</Text>
                {cycle.professionalName ? (
                  <Text className="mt-0.5 text-xs text-muted-foreground">
                    Profissional: {cycle.professionalName}
                  </Text>
                ) : null}
              </View>
              <Text className="text-sm font-bold text-foreground">
                {Math.min(cycle.completedSessions, cycle.cycle_number === 1 ? Math.max(cycle.session_count - 1, 1) : cycle.session_count)}/{cycle.cycle_number === 1 ? Math.max(cycle.session_count - 1, 1) : cycle.session_count}
              </Text>
            </View>
          </View>

          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">Sessões</Text>
            {cycle.sessions.length === 0 ? (
              <View className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-8">
                <Text className="text-center text-sm text-muted-foreground">
                  Nenhuma sessão registrada neste ciclo.
                </Text>
              </View>
            ) : (
              cycle.sessions.map((session) => (
                <View
                  key={session.id}
                  className="flex-row items-start justify-between gap-3 rounded-xl border border-border bg-card px-4 py-4"
                >
                  <View className="min-w-0 flex-1">
                    <Text className="font-medium text-foreground">
                      {cycle.cycle_number === 1 && session.session_number === 1
                        ? 'Avaliação inicial'
                        : `Terapia ${cycle.cycle_number === 1 ? Math.max(session.session_number - 1, 1) : session.session_number}`}
                    </Text>
                    <Text className="mt-0.5 text-xs text-muted-foreground">
                      {session.scheduled_at ? formatDateTime(session.scheduled_at) : 'Data a definir'}
                      {session.professionalName ? ` · ${session.professionalName}` : ''}
                    </Text>
                  </View>
                  <Text className="text-xs font-medium text-muted-foreground">
                    {sessionStatusLabels[session.status] ?? session.status}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
