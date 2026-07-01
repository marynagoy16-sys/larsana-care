import { useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { addDays, subDays } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { SessionCard } from '@/components/profissional/SessionCard'
import { toAgendaDayKey, formatAgendaDayTitle } from '@/lib/agendaWeek'
import {
  buildAgendaDaySummary,
  listAgendaSessionsForDay,
  ppAgendaQueryKeys,
} from '@/services/ppAgenda'

export default function AgendaScreen() {
  const [anchorDate, setAnchorDate] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })

  const dayKey = toAgendaDayKey(anchorDate)

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ppAgendaQueryKeys.day(dayKey),
    queryFn: () => listAgendaSessionsForDay(anchorDate),
  })

  const summary = useMemo(() => buildAgendaDaySummary(sessions), [sessions])

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <PageHeader title="Agenda" />

      <View className="flex-row items-center justify-between px-4 pb-3">
        <Pressable onPress={() => setAnchorDate((d) => subDays(d, 1))} className="p-2">
          <ChevronLeft size={22} color="#17310A" />
        </Pressable>
        <View className="flex-1 items-center px-2">
          <Text className="text-center font-display text-base font-bold text-foreground">
            {formatAgendaDayTitle(anchorDate)}
          </Text>
        </View>
        <Pressable onPress={() => setAnchorDate((d) => addDays(d, 1))} className="p-2">
          <ChevronRight size={22} color="#17310A" />
        </Pressable>
      </View>

      <View className="mx-4 mb-4 flex-row gap-2">
        <View className="flex-1 rounded-xl border border-border bg-card p-3">
          <Text className="text-lg font-bold">{summary.total}</Text>
          <Text className="text-xs text-muted-foreground">Total</Text>
        </View>
        <View className="flex-1 rounded-xl border border-border bg-card p-3">
          <Text className="text-lg font-bold">{summary.pendingEvolution}</Text>
          <Text className="text-xs text-muted-foreground">Pendentes</Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#17310A" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerClassName="gap-2 pb-8">
          {sessions.length === 0 ? (
            <View className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-8">
              <Text className="text-center text-sm text-muted-foreground">
                Nenhuma sessão neste dia.
              </Text>
            </View>
          ) : (
            sessions.map((session) => <SessionCard key={session.id} session={session} />)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
