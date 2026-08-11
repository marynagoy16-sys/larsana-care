import { useMemo } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { ChevronRight, MapPin, Trophy } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { SessionCard } from '@/components/profissional/SessionCard'
import { useAuth } from '@/providers/AuthProvider'
import { toAgendaDayKey, formatAgendaDayTitleShort } from '@/lib/agendaWeek'
import { listOpenDemandsForPp } from '@/services/demands'
import { listPendingEvolutionsForPp, ppEvolutionsQueryKeys } from '@/services/ppEvolutions'
import {
  buildAgendaDaySummary,
  listAgendaSessionsForDay,
  ppAgendaQueryKeys,
} from '@/services/ppAgenda'
import {
  getCurrentProfessionalId,
  getProfessionalPointsProfile,
  patenteLabels,
  PATENTE_REPASSE_PERCENT,
} from '@/services/ppPoints'

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
          <ChevronRight size={16} color="#095742" />
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

  const { data: professionalId } = useQuery({
    queryKey: ['pp', 'professional_id'],
    queryFn: getCurrentProfessionalId,
  })

  const { data: pointsProfile } = useQuery({
    queryKey: ['pp', 'points_profile', professionalId],
    queryFn: () => getProfessionalPointsProfile(professionalId!),
    enabled: !!professionalId,
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
        <ActivityIndicator size="large" color="#095742" />
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
        <Pressable
          onPress={() => router.push('/(app)/minha-evolucao')}
          className="flex-row items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 active:bg-muted/30"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
            <Trophy size={18} color="#B45309" />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-medium text-foreground">Minha evolução</Text>
            <Text className="text-xs text-muted-foreground">
              {pointsProfile?.points_total ?? 0} pts · {patenteLabels[pointsProfile?.patente ?? 'ALUMINIO']} ·{' '}
              {PATENTE_REPASSE_PERCENT[pointsProfile?.patente ?? 'ALUMINIO']}% repasse
            </Text>
          </View>
          <ChevronRight size={18} color="#49796B" />
        </Pressable>

        <View className="gap-3">
          <SectionTitle
            title="Seu dia"
            actionLabel="Ver agenda"
            onAction={() => router.push('/(app)/(tabs)/agenda')}
          />
          {sessions.length === 0 ? (
            <View className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-6">
              <Text className="text-center text-sm text-muted-foreground">
                Você não tem terapias agendadas para hoje.
              </Text>
            </View>
          ) : (
            <View className="gap-2">
              {previewSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
              {remaining > 0 ? (
                <Text className="px-1 text-xs text-muted-foreground">
                  +{remaining} terapia{remaining === 1 ? '' : 's'} hoje
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
              <MapPin size={18} color="#095742" />
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
            <ChevronRight size={18} color="#49796B" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
