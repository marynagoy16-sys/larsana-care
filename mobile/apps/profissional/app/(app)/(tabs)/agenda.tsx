import { useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { addDays, subDays } from 'date-fns'
import { useRouter } from 'expo-router'
import { ChevronLeft, ChevronRight, ChevronRight as ChevronRightIcon } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { SessionCard } from '@/components/profissional/SessionCard'
import { cn } from '@/lib/cn'
import {
  formatAgendaWeekTitle,
  formatWeekDayHeader,
  getWeekRange,
  groupSessionsByDay,
  isCurrentWeek,
  isTodayDate,
  toAgendaDayKey,
} from '@/lib/agendaWeek'
import { formatDateTime } from '@/lib/formatters'
import {
  buildAgendaDaySummary,
  listAgendaSessionsForWeek,
  ppAgendaQueryKeys,
} from '@/services/ppAgenda'
import {
  listPendingEvolutionsForPp,
  pendingEvolutionDeadlineLabel,
  ppEvolutionsQueryKeys,
  type PendingEvolutionRow,
} from '@/services/ppEvolutions'

type AgendaSubTab = 'semana' | 'pendentes'

function SubTabBar({
  active,
  onChange,
  pendingCount,
}: {
  active: AgendaSubTab
  onChange: (tab: AgendaSubTab) => void
  pendingCount: number
}) {
  return (
    <View className="mx-4 mb-3 flex-row rounded-xl border border-border bg-muted/30 p-1">
      <Pressable
        onPress={() => onChange('semana')}
        className={cn(
          'flex-1 rounded-lg py-2',
          active === 'semana' ? 'bg-card shadow-sm' : 'bg-transparent',
        )}
      >
        <Text
          className={cn(
            'text-center text-xs font-medium',
            active === 'semana' ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          Agenda da semana
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onChange('pendentes')}
        className={cn(
          'flex-1 flex-row items-center justify-center gap-1.5 rounded-lg py-2',
          active === 'pendentes' ? 'bg-card shadow-sm' : 'bg-transparent',
        )}
      >
        <Text
          className={cn(
            'text-center text-xs font-medium',
            active === 'pendentes' ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          Evoluções pendentes
        </Text>
        {pendingCount > 0 ? (
          <View className="min-w-[18px] rounded-full bg-amber-500 px-1.5 py-0.5">
            <Text className="text-center text-[10px] font-bold text-white">{pendingCount}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  )
}

function PendingEvolutionsList({ items }: { items: PendingEvolutionRow[] }) {
  const router = useRouter()

  if (items.length === 0) {
    return (
      <View className="mx-4 rounded-xl border border-dashed border-border bg-muted/20 px-5 py-8">
        <Text className="text-center text-sm text-muted-foreground">
          Nenhuma evolução pendente. Ótimo trabalho!
        </Text>
      </View>
    )
  }

  return (
    <View className="gap-2 px-4">
      {items.map((row) => {
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
                Ciclo {row.care_cycles?.cycle_number ?? '—'} · Terapia #{row.session_number}
              </Text>
              <Text className="text-xs text-muted-foreground">
                Realizada em{' '}
                {row.check_out_at || row.scheduled_at
                  ? formatDateTime(String(row.check_out_at ?? row.scheduled_at))
                  : '—'}
              </Text>
            </View>
            <View className={`shrink-0 rounded-full px-2.5 py-1 ${overdue ? 'bg-red-100' : 'bg-amber-100'}`}>
              <Text className={`text-[11px] font-medium ${overdue ? 'text-red-700' : 'text-amber-700'}`}>
                {deadline}
              </Text>
            </View>
            <ChevronRightIcon size={18} color="#49796B" />
          </Pressable>
        )
      })}
    </View>
  )
}

export default function AgendaTabScreen() {
  const [subTab, setSubTab] = useState<AgendaSubTab>('semana')
  const [anchorDate, setAnchorDate] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })

  const weekRange = useMemo(() => getWeekRange(anchorDate), [anchorDate])
  const weekKey = toAgendaDayKey(weekRange.start)

  const weekQuery = useQuery({
    queryKey: ppAgendaQueryKeys.week(weekKey),
    queryFn: () => listAgendaSessionsForWeek(anchorDate),
  })

  const pendingQuery = useQuery({
    queryKey: ppEvolutionsQueryKeys.pending,
    queryFn: listPendingEvolutionsForPp,
  })

  const sessions = weekQuery.data ?? []
  const grouped = useMemo(
    () => groupSessionsByDay(sessions, weekRange.days),
    [sessions, weekRange.days],
  )
  const weekSummary = useMemo(() => buildAgendaDaySummary(sessions), [sessions])
  const pendingItems = pendingQuery.data?.data ?? []
  const pendingCount = pendingQuery.data?.count ?? 0
  const isThisWeek = isCurrentWeek(weekRange.start, weekRange.end)

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <PageHeader title="Agenda" subtitle="Terapias domiciliares da semana" />

      <SubTabBar active={subTab} onChange={setSubTab} pendingCount={pendingCount} />

      {subTab === 'semana' ? (
        <>
          <View className="flex-row items-center justify-between px-4 pb-3">
            <Pressable onPress={() => setAnchorDate((d) => subDays(d, 7))} className="p-2">
              <ChevronLeft size={22} color="#095742" />
            </Pressable>
            <View className="flex-1 items-center px-2">
              <Text className="text-center font-display text-base font-bold text-foreground">
                {formatAgendaWeekTitle(weekRange.start, weekRange.end)}
              </Text>
              {isThisWeek ? (
                <Text className="text-xs text-primary">Semana atual</Text>
              ) : null}
            </View>
            <Pressable onPress={() => setAnchorDate((d) => addDays(d, 7))} className="p-2">
              <ChevronRight size={22} color="#095742" />
            </Pressable>
          </View>

          <View className="mx-4 mb-4 flex-row gap-2">
            <View className="flex-1 rounded-xl border border-border bg-card p-3">
              <Text className="text-lg font-bold">{weekSummary.total}</Text>
              <Text className="text-xs text-muted-foreground">Terapias</Text>
            </View>
            <View className="flex-1 rounded-xl border border-border bg-card p-3">
              <Text className="text-lg font-bold">{weekSummary.pendingEvolution}</Text>
              <Text className="text-xs text-muted-foreground">Evol. pendentes</Text>
            </View>
          </View>

          {weekQuery.isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#095742" />
            </View>
          ) : (
            <ScrollView className="flex-1" contentContainerClassName="gap-4 pb-28 px-4">
              {weekRange.days.map((day) => {
                const dayKey = toAgendaDayKey(day)
                const daySessions = grouped[dayKey] ?? []
                const { weekday, day: dayLabel } = formatWeekDayHeader(day)

                return (
                  <View key={dayKey} className="gap-2">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-sm font-semibold text-foreground">{weekday}</Text>
                      <Text className="text-xs text-muted-foreground">{dayLabel}</Text>
                      {isTodayDate(day) ? (
                        <View className="rounded-full bg-primary/10 px-2 py-0.5">
                          <Text className="text-[10px] font-medium text-primary">Hoje</Text>
                        </View>
                      ) : null}
                      <Text className="ml-auto text-xs text-muted-foreground">
                        {daySessions.length} terapia{daySessions.length === 1 ? '' : 's'}
                      </Text>
                    </View>
                    {daySessions.length === 0 ? (
                      <View className="rounded-xl border border-dashed border-border bg-muted/10 px-4 py-3">
                        <Text className="text-xs text-muted-foreground">Sem terapias agendadas</Text>
                      </View>
                    ) : (
                      daySessions.map((session) => (
                        <SessionCard key={session.id} session={session} />
                      ))
                    )}
                  </View>
                )
              })}
            </ScrollView>
          )}
        </>
      ) : pendingQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#095742" />
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerClassName="gap-3 pb-28 pt-1">
          <Text className="px-4 text-xs text-muted-foreground">
            Terapias realizadas aguardando registro clínico (prazo 24h)
          </Text>
          <PendingEvolutionsList items={pendingItems} />
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
