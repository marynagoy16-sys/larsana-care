import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { addDays, addMonths, isSameDay, subDays, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AgendaDayTimeline } from '@/components/agenda/AgendaDayTimeline'
import { AgendaLegend } from '@/components/agenda/AgendaLegend'
import { AgendaMobileDayStrip } from '@/components/agenda/AgendaMobileDayStrip'
import { AgendaViewToggle } from '@/components/agenda/AgendaViewToggle'
import { AgendaWeekTimeline } from '@/components/agenda/AgendaWeekTimeline'
import { PageHeader } from '@/components/layout/PageHeader'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { DetailPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { useImmersiveLayout } from '@/contexts/ImmersiveLayoutContext'
import {
  formatAgendaMobileMonthTitle,
  formatAgendaWeekTitle,
  getMobileDayStripRange,
  getWeekRange,
  isCurrentWeek,
  toAgendaDayKey,
  type AgendaViewMode,
} from '@/lib/agendaWeek'
import {
  formatAgendaDayTitle,
  listAgendaSessionsForDay,
  listAgendaSessionsForRange,
  listAgendaSessionsForWeek,
  ppAgendaQueryKeys,
} from '@/services/ppAgenda'
import { ppRescheduleSession } from '@/services/scheduling'
import { listPpRescheduleWindowsForProfessional } from '@/services/sessionReschedule'
import { PpRescheduleWindowCard } from '@/components/profissional/agenda/PpRescheduleWindowCard'
import { useCrudMutation } from '@/hooks/useCrudMutation'

export function PPAgendaPage() {
  const queryClient = useQueryClient()
  const { setFixedMain } = useImmersiveLayout()
  const scrollRef = useRef<HTMLDivElement>(null)
  const mobileScrollRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<AgendaViewMode>('week')
  const [anchorDate, setAnchorDate] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })

  useEffect(() => {
    setFixedMain(true)
    return () => setFixedMain(false)
  }, [setFixedMain])

  const weekRange = useMemo(() => getWeekRange(anchorDate), [anchorDate])
  const mobileStripRange = useMemo(() => getMobileDayStripRange(anchorDate), [anchorDate])
  const dayKey = toAgendaDayKey(anchorDate)
  const weekKey = toAgendaDayKey(weekRange.start)
  const stripStartKey = toAgendaDayKey(mobileStripRange.start)
  const stripEndKey = toAgendaDayKey(mobileStripRange.end)

  const dayQuery = useQuery({
    queryKey: ppAgendaQueryKeys.day(dayKey),
    queryFn: () => listAgendaSessionsForDay(anchorDate),
  })

  const stripQuery = useQuery({
    queryKey: ppAgendaQueryKeys.range(stripStartKey, stripEndKey),
    queryFn: () => listAgendaSessionsForRange(mobileStripRange.start, mobileStripRange.end),
  })

  const weekQuery = useQuery({
    queryKey: ppAgendaQueryKeys.week(weekKey),
    queryFn: () => listAgendaSessionsForWeek(anchorDate),
    enabled: view === 'week',
  })

  const ppRescheduleWindowsQuery = useQuery({
    queryKey: ['pp', 'reschedule-windows'],
    queryFn: listPpRescheduleWindowsForProfessional,
  })

  const weekSessions = weekQuery.data ?? []

  const rescheduleMutation = useCrudMutation({
    mutationFn: ({ sessionId, newScheduledAt }: { sessionId: string; newScheduledAt: Date }) =>
      ppRescheduleSession(sessionId, newScheduledAt.toISOString()),
    queryKey: ['pp', 'agenda'],
    successMessage: 'Solicitação enviada ao paciente',
    onSuccess: () => {
      setPendingReschedule(null)
      queryClient.invalidateQueries({ queryKey: ['pp', 'agenda'] })
      queryClient.invalidateQueries({ queryKey: ['pp', 'reschedule-windows'] })
    },
  })

  const [pendingReschedule, setPendingReschedule] = useState<{
    sessionId: string
    newScheduledAt: Date
  } | null>(null)

  const handleRescheduleSession = (sessionId: string, newScheduledAt: Date) => {
    setPendingReschedule({ sessionId, newScheduledAt })
  }

  const confirmReschedule = () => {
    if (!pendingReschedule) return
    rescheduleMutation.mutate(pendingReschedule)
  }

  const daySessions = dayQuery.data ?? []

  const stripSessionDayKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const session of stripQuery.data ?? []) {
      const day = session.scheduledAt ? new Date(session.scheduledAt) : session.start
      keys.add(toAgendaDayKey(day))
    }
    return keys
  }, [stripQuery.data])

  const isToday = view === 'day'
    ? isSameDay(anchorDate, new Date())
    : isCurrentWeek(weekRange.start, weekRange.end)

  const title = view === 'day'
    ? formatAgendaDayTitle(anchorDate)
    : formatAgendaWeekTitle(weekRange.start, weekRange.end)

  const mobileMonthTitle = formatAgendaMobileMonthTitle(anchorDate)

  const goPrev = () => {
    setAnchorDate((d) => subDays(d, view === 'day' ? 1 : 7))
  }

  const goNext = () => {
    setAnchorDate((d) => addDays(d, view === 'day' ? 1 : 7))
  }

  const goToday = () => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    setAnchorDate(d)
  }

  const goPrevMonth = () => {
    setAnchorDate((d) => subMonths(d, 1))
  }

  const goNextMonth = () => {
    setAnchorDate((d) => addMonths(d, 1))
  }

  const selectDay = (day: Date) => {
    const d = new Date(day)
    d.setHours(0, 0, 0, 0)
    setAnchorDate(d)
  }

  const selectDayFromWeek = (day: Date) => {
    selectDay(day)
    setView('day')
  }

  if (dayQuery.isLoading || (view === 'week' && weekQuery.isLoading)) {
    return (
      <>
        <PageHeader>
          <h1 className="font-display min-w-0 truncate text-xl font-bold leading-tight tracking-tight lg:text-2xl">
            Agenda
          </h1>
        </PageHeader>
        <CrudScrollPageLayout>
          <DetailPageSkeleton />
        </CrudScrollPageLayout>
      </>
    )
  }

  return (
    <>
      <PageHeader>
        <h1 className="font-display min-w-0 truncate text-xl font-bold leading-tight tracking-tight lg:text-2xl">
          Agenda
        </h1>
      </PageHeader>

      <div className="flex flex-1 flex-col min-h-0 min-w-0 overflow-hidden">
      {/* Cabeçalho desktop */}
      <div className="hidden shrink-0 border-b border-border/60 bg-background/80 py-2 shell-content-x sm:block">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2">
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full"
              onClick={goPrev}
              aria-label={view === 'day' ? 'Dia anterior' : 'Semana anterior'}
            >
              <ChevronLeft size={16} />
            </Button>

            <div className="flex min-w-0 items-center gap-1">
              <h1 className="truncate text-sm font-medium">{title}</h1>
              {isToday && (
                <Badge variant="secondary" className="shrink-0 rounded-full text-xs">
                  {view === 'day' ? 'Hoje' : 'Esta semana'}
                </Badge>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full"
              onClick={goNext}
              aria-label={view === 'day' ? 'Próximo dia' : 'Próxima semana'}
            >
              <ChevronRight size={16} />
            </Button>
          </div>

          <div className="flex min-w-0 justify-center overflow-x-auto px-1 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <AgendaLegend inline />
          </div>

          <div className="flex shrink-0 items-center justify-end gap-1.5">
            <AgendaViewToggle value={view} onChange={setView} className="shrink-0" />

            {!isToday && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full"
                onClick={goToday}
                aria-label="Ir para hoje"
              >
                <CalendarDays size={14} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cabeçalho mobile */}
      <div className="shrink-0 border-b border-border/60 bg-background/80 sm:hidden">
        <div className="flex items-center justify-between gap-3 shell-content-x py-2.5">
          <div className="flex min-w-0 flex-1 items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full"
              onClick={view === 'day' ? goPrevMonth : goPrev}
              aria-label={view === 'day' ? 'Mês anterior' : 'Semana anterior'}
            >
              <ChevronLeft size={18} />
            </Button>
            <p className="min-w-0 flex-1 truncate text-center text-sm font-semibold text-foreground">
              {view === 'day' ? mobileMonthTitle : title}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full"
              onClick={view === 'day' ? goNextMonth : goNext}
              aria-label={view === 'day' ? 'Próximo mês' : 'Próxima semana'}
            >
              <ChevronRight size={18} />
            </Button>
          </div>
          <AgendaViewToggle
            value={view}
            onChange={setView}
            className="shrink-0"
          />
        </div>

        {view === 'day' ? (
          <AgendaMobileDayStrip
            anchorDate={anchorDate}
            onSelectDay={selectDay}
            sessionDayKeys={stripSessionDayKeys}
            className="border-b-0"
          />
        ) : (
          <div className="flex items-center justify-center gap-2 border-t border-border/40 px-4 py-2">
            {isToday && (
              <Badge variant="secondary" className="shrink-0 rounded-full text-xs">
                Esta semana
              </Badge>
            )}
            {!isToday && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 rounded-full px-2.5 text-xs"
                onClick={goToday}
              >
                <CalendarDays size={14} className="mr-1" />
                Hoje
              </Button>
            )}
          </div>
        )}
      </div>

      {(ppRescheduleWindowsQuery.data?.length ?? 0) > 0 && (
        <div className="shrink-0 space-y-2 shell-content-x py-3">
          {ppRescheduleWindowsQuery.data!.map((request) => (
            <PpRescheduleWindowCard
              key={request.id}
              request={request}
              onCompleted={() => {
                ppRescheduleWindowsQuery.refetch()
                queryClient.invalidateQueries({ queryKey: ['pp', 'agenda'] })
              }}
            />
          ))}
        </div>
      )}

      {/* Mobile — dia ou semana */}
      {view === 'day' ? (
        <div
          ref={mobileScrollRef}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-sidebar shell-content-x pt-1.5 pb-24 sm:hidden"
        >
          <AgendaDayTimeline
            date={anchorDate}
            sessions={daySessions}
            scrollContainerRef={mobileScrollRef}
          />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col pt-1.5 pb-24 sm:hidden">
          <AgendaWeekTimeline
            anchorDate={anchorDate}
            sessions={weekSessions}
            onSelectDay={selectDayFromWeek}
            scrollContainerRef={mobileScrollRef}
            enableDragReschedule
            onRescheduleSession={handleRescheduleSession}
          />
        </div>
      )}

      {/* Desktop — dia ou semana */}
      {view === 'day' ? (
        <div
          ref={scrollRef}
          className="hidden min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-sidebar shell-content-x pt-1.5 pb-[var(--shell-gap)] sm:block"
        >
          <AgendaDayTimeline
            date={anchorDate}
            sessions={daySessions}
            scrollContainerRef={scrollRef}
          />
        </div>
      ) : (
        <div className="hidden min-h-0 flex-1 flex-col pl-[var(--shell-gap)] pt-1.5 pb-[var(--shell-gap)] sm:flex">
          <AgendaWeekTimeline
            anchorDate={anchorDate}
            sessions={weekSessions}
            onSelectDay={selectDayFromWeek}
            scrollContainerRef={scrollRef}
            enableDragReschedule
            onRescheduleSession={handleRescheduleSession}
          />
        </div>
      )}
      </div>

      <AlertDialog open={!!pendingReschedule} onOpenChange={(open) => !open && setPendingReschedule(null)}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md px-4 py-5 sm:w-full sm:px-6">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar remarcação?</AlertDialogTitle>
            <AlertDialogDescription>
              O paciente receberá uma notificação e poderá aceitar ou recusar o novo horário antes da alteração
              definitiva na agenda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rescheduleMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReschedule} disabled={rescheduleMutation.isPending}>
              {rescheduleMutation.isPending ? 'Enviando…' : 'Enviar solicitação'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
