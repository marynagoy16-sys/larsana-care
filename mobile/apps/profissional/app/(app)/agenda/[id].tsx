import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { ArrowLeft } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Card'
import { getAgendaStatusConfig } from '@/lib/sessionStatus'
import { getAgendaSessionById, ppAgendaQueryKeys } from '@/services/ppAgenda'
import { ppSessionCheckIn, ppSessionCheckOut } from '@/services/ppSessions'

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: session, isLoading } = useQuery({
    queryKey: ppAgendaQueryKeys.session(id ?? ''),
    queryFn: () => getAgendaSessionById(id!),
    enabled: !!id,
  })

  const checkMutation = useMutation({
    mutationFn: async (action: 'in' | 'out') => {
      if (!id) throw new Error('Sessão inválida')
      if (action === 'in') await ppSessionCheckIn(id)
      else await ppSessionCheckOut(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ppAgendaQueryKeys.session(id!) })
      Alert.alert('Sucesso', 'Registro atualizado')
    },
    onError: (err: Error) => Alert.alert('Erro', err.message),
  })

  if (isLoading || !session) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background" edges={['top']}>
        <ActivityIndicator size="large" color="#095742" />
      </SafeAreaView>
    )
  }

  const cfg = getAgendaStatusConfig(session.displayStatus)
  const timeLabel = format(
    session.scheduledAt ? parseISO(session.scheduledAt) : session.start,
    'HH:mm',
  )

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <PageHeader>
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} className="rounded-xl p-2">
            <ArrowLeft size={20} color="#095742" />
          </Pressable>
          <Text className="flex-1 font-display text-lg font-bold text-foreground" numberOfLines={1}>
            {session.patientName}
          </Text>
          <Badge label={cfg.label} className={cfg.badge} />
        </View>
      </PageHeader>

      <ScrollView className="flex-1 px-4" contentContainerClassName="gap-4 pb-8">
        <View className="rounded-xl border border-border bg-card p-5 gap-3">
          <View>
            <Text className="text-xs text-muted-foreground">Horário</Text>
            <Text className="font-medium text-foreground">{timeLabel}</Text>
          </View>
          <View>
            <Text className="text-xs text-muted-foreground">Ciclo / terapia</Text>
            <Text className="font-medium text-foreground">
              Ciclo {session.cycleNumber} · Terapia #{session.sessionNumber}
            </Text>
          </View>
          <View>
            <Text className="text-xs text-muted-foreground">Endereço</Text>
            <Text className="font-medium text-foreground">{session.address ?? '—'}</Text>
          </View>
          {session.neighborhood ? (
            <View>
              <Text className="text-xs text-muted-foreground">Bairro</Text>
              <Text className="font-medium text-foreground">{session.neighborhood}</Text>
            </View>
          ) : null}
          <View>
            <Text className="text-xs text-muted-foreground">Tipo</Text>
            <Text className="font-medium text-foreground">
              {session.isAssessment ? 'Avaliação inicial' : 'Evolução clínica'} · domiciliar
            </Text>
          </View>
        </View>

        <View className="gap-2">
          {!session.checkInAt ? (
            <Button onPress={() => checkMutation.mutate('in')} loading={checkMutation.isPending}>
              Check-in
            </Button>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
