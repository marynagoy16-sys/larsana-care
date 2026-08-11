import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Calendar, ChevronRight, UserRound } from 'lucide-react-native'
import { loadPatientTreatmentPage, patientTreatmentQueryKeys } from '@/services/patientTreatment'

const cycleStatusLabels: Record<string, string> = {
  rascunho: 'Rascunho',
  aguardando_pagamento: 'Aguardando pagamento',
  ativo: 'Ativo',
  em_pausa: 'Em pausa',
  em_analise: 'Em análise',
  encerrado: 'Encerrado',
  fechado_financeiramente: 'Fechado financeiramente',
  cancelado: 'Cancelado',
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

export default function TratamentoScreen() {
  const router = useRouter()
  const { data, isLoading } = useQuery({
    queryKey: patientTreatmentQueryKeys.list,
    queryFn: loadPatientTreatmentPage,
  })

  const activeCycle = data?.activeCycle ?? null
  const cycles = data?.cycles ?? []
  const otherCycles = activeCycle ? cycles.filter((cycle) => cycle.id !== activeCycle.id) : cycles

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#095742" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerClassName="gap-5 pb-28 py-4">
          {cycles.length === 0 ? (
            <View className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-8">
              <Text className="text-center text-sm text-muted-foreground">
                Nenhum ciclo de tratamento encontrado no momento.
              </Text>
            </View>
          ) : (
            <>
              {activeCycle && (
                <View className="overflow-hidden rounded-xl border border-border bg-card">
                  <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
                    <View>
                      <Text className="text-sm font-semibold text-foreground">Tratamento ativo</Text>
                      <Text className="mt-0.5 text-xs text-muted-foreground">Ciclo #{activeCycle.cycle_number}</Text>
                    </View>
                    <Text className="text-sm font-bold text-foreground">
                      {activeCycle.completedSessions}/{activeCycle.session_count}
                    </Text>
                  </View>
                  <View className="gap-2 p-4">
                    {activeCycle.professionalName ? (
                      <View className="flex-row items-center gap-2">
                        <UserRound size={16} color="#49796B" />
                        <Text className="text-sm text-muted-foreground">
                          Profissional:{' '}
                          <Text className="font-medium text-foreground">{activeCycle.professionalName}</Text>
                        </Text>
                      </View>
                    ) : null}
                    {activeCycle.nextSessionAt ? (
                      <View className="flex-row items-center gap-2">
                        <Calendar size={16} color="#49796B" />
                        <Text className="text-sm text-muted-foreground">
                          Próxima sessão:{' '}
                          <Text className="font-medium text-foreground">
                            {formatDateTime(activeCycle.nextSessionAt)}
                          </Text>
                        </Text>
                      </View>
                    ) : (
                      <Text className="text-sm text-muted-foreground">Nenhuma sessão prevista no momento.</Text>
                    )}
                    <Pressable
                      onPress={() => router.push(`/(app)/tratamento/ciclo/${activeCycle.id}`)}
                      className="mt-2 self-start rounded-lg border border-border px-3 py-2"
                    >
                      <Text className="text-sm font-medium text-primary">Ver detalhes do ciclo</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              <View className="gap-3">
                <Text className="text-sm font-semibold text-foreground">
                  {activeCycle ? 'Outros ciclos' : 'Todos os ciclos'}
                </Text>
                {otherCycles.length === 0 ? (
                  <Text className="text-sm text-muted-foreground">
                    Você possui apenas o ciclo ativo no momento.
                  </Text>
                ) : (
                  otherCycles.map((cycle) => (
                    <Pressable
                      key={cycle.id}
                      onPress={() => router.push(`/(app)/tratamento/ciclo/${cycle.id}`)}
                      className="flex-row items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 active:bg-muted/30"
                    >
                      <View className="min-w-0 flex-1">
                        <Text className="font-medium text-foreground">Ciclo #{cycle.cycle_number}</Text>
                        <Text className="mt-0.5 text-xs text-muted-foreground">
                          {cycle.professionalName ? `${cycle.professionalName} · ` : ''}
                          {cycle.completedSessions}/{cycle.session_count} sessões
                        </Text>
                      </View>
                      <Text className="text-xs font-medium text-muted-foreground">
                        {cycleStatusLabels[cycle.status] ?? cycle.status}
                      </Text>
                      <ChevronRight size={18} color="#49796B" />
                    </Pressable>
                  ))
                )}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
