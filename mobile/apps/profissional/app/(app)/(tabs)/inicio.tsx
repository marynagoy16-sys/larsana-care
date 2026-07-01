import { useMemo } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { ChevronRight, MapPin } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { SessionCard } from '@/components/profissional/SessionCard'
import { useAuth } from '@/providers/AuthProvider'
import { toAgendaDayKey } from '@/lib/agendaWeek'
import { listOpenDemandsForPp } from '@/services/demands'
import { listPendingEvolutionsForPp, ppEvolutionsQueryKeys } from '@/services/ppEvolutions'
import {
  buildAgendaDaySummary,
  formatAgendaDayTitleShort,
  listAgendaSessionsForDay,
  ppAgendaQueryKeys,
} from '@/services/ppAgenda'

const MAX_TODAY_SESSIONS = 3

function SectionTitle({ title, actionLabel, onAction }: {
  title: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} className="flex-row items-center">
          <Text className="text-sm text-primary">{actionLabel}</Text>
          <ChevronRight size={16} color="#17310A" />
        </Pressable>
      ) : null}
    </View>
  )
}

export default function InicioScreen() {
  const router = useRouter()
  const { profile } = useAuth()
  const firstName = profile?.full_name?.split(' ')[0] ?? 'parceiro'

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const dayKey = toAgendaDayKey(today)

  const sessionsQuery = useQuery({
    queryKey: ppAgendaQueryKeys.day(dayKey),
    queryFn: () => listAgendaSessionsForDay(today),
  })

  const demandsQuery = useQuery({
    queryKey: ['pp', 'demands'],
    queryFn: listOpenDemandsForPp,
  })

  const pendingQuery = useQuery({
    queryKey: ppEvolutionsQueryKeys.pending,
    queryFn: listPendingEvolutionsForPp,
  })

  const sessions = sessionsQuery.data ?? []
  const daySummary = buildAgendaDaySummary(sessions)
  const demandsCount = demandsQuery.data?.count ?? 0
  const pendingCount = pendingQuery.data?.count ?? 0
  const previewSessions = sessions.slice(0, MAX_TODAY_SESSIONS)
  const remaining = Math.max(0, sessions.length - MAX_TODAY_SESSIONS)

  const loading = sessionsQuery.isLoading || demandsQuery.isLoading

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#17310A" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <PageHeader>
        <View>
          <Text className="font-display text-xl font-bold text-foreground">Olá, {firstName}</Text>
          <Text className="text-sm text-muted-foreground">{formatAgendaDayTitleShort(today)}</Text>
        </View>
      </PageHeader>

      <ScrollView className="flex-1 px-4" contentContainerClassName="gap-5 pb-28">
        <View className="gap-3">
          <SectionTitle
            title="Seu dia"
            actionLabel="Ver agenda"
            onAction={() => router.push('/(app)/agenda')}
          />
          {sessions.length === 0 ? (
            <View className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-6">
              <Text className="text-center text-sm text-muted-foreground">
                Você não tem sessões agendadas para hoje.
              </Text>
            </View>
          ) : (
            <View className="gap-2">
              {previewSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
              {remaining > 0 ? (
                <Text className="px-1 text-xs text-muted-foreground">
                  +{remaining} sessão{remaining === 1 ? '' : 'ões'} hoje
                </Text>
              ) : null}
            </View>
          )}
        </View>

        <View className="gap-3">
          <SectionTitle title="Oportunidades" actionLabel="Ver todas" onAction={() => router.push('/(app)/(tabs)/demandas')} />
          <Pressable
            onPress={() => router.push('/(app)/(tabs)/demandas')}
            className="flex-row items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 active:bg-muted/30"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <MapPin size={18} color="#17310A" />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-sm font-medium text-foreground">
                {demandsCount > 0
                  ? `${demandsCount} demanda${demandsCount === 1 ? '' : 's'} aberta${demandsCount === 1 ? '' : 's'}`
                  : 'Nenhuma demanda aberta'}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {demandsCount > 0 ? 'Veja oportunidades na sua região' : 'Novas oportunidades aparecerão aqui'}
              </Text>
            </View>
            <ChevronRight size={18} color="#5A7920" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
