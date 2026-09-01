import { Link, useNavigate } from 'react-router-dom'
import { useMemo, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, ClipboardList, MapPin, Trophy } from 'lucide-react'
import { HomeAcademyBanner } from '@/components/profissional/home/HomeAcademyBanner'
import { HomeDayKpiRow } from '@/components/profissional/home/HomeDayKpiRow'
import { HomePendingEvolutionsList } from '@/components/profissional/home/HomePendingEvolutionsList'
import { HomeSessionCard } from '@/components/profissional/home/HomeSessionCard'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { CrudListPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { PageHeader } from '@/components/layout/PageHeader'
import { Logo } from '@/components/shared/Logo'
import { Button } from '@/components/ui/button'
import { ACADEMY_FORMATION_SLIDE } from '@/constants/academySlides'
import { usePpDistanceOrigin } from '@/hooks/usePpDistanceOrigin'
import {
  countDemandsWithinRadius,
  MAUA_CENTER,
  resolvePointsCenter,
} from '@/lib/geo'
import { cn } from '@/lib/utils'
import { toAgendaDayKey } from '@/lib/agendaWeek'
import {
  getCoursePlayerContext,
  getContinueLessonId,
  getProfessionalId,
  getPublishedCourses,
} from '@/services/academy'
import { demandsService } from '@/services/demands'
import {
  listPendingEvolutionsForPp,
  ppEvolutionsQueryKeys,
} from '@/services/ppEvolutions'
import {
  buildAgendaDaySummary,
  listAgendaSessionsForDay,
  listUpcomingAgendaSessions,
  ppAgendaQueryKeys,
} from '@/services/ppAgenda'
import { getCurrentProfessional } from '@/services/professionals'
import {
  getProfessionalPointsProfile,
  patenteLabels,
  PATENTE_REPASSE_PERCENT,
} from '@/services/ppPoints'

const PP_DEMANDS_QUERY_KEY = ['pp', 'demands'] as const
const MAX_TODAY_SESSIONS_MOBILE = 3
const MAX_TODAY_SESSIONS_DESKTOP = 5

function PPHomeHeaderLogo() {
  return <Logo layout="horizontal" adaptToTheme style="v1" size="xs" />
}

function HomeSectionTitle({
  title,
  action,
  inlineAction,
}: {
  title: string
  action?: ReactNode
  inlineAction?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3',
        !inlineAction && action && 'justify-between',
      )}
    >
      <h2 className="text-sm font-semibold text-foreground">
        {title}
      </h2>
      {action}
    </div>
  )
}

function HomePendingEvolutionsCard({
  count,
  onClick,
}: {
  count: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-orange-200 bg-orange-50/80 px-4 py-3.5 text-left transition-colors hover:bg-orange-50 active:bg-orange-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-orange-900/40 dark:bg-orange-950/20 dark:hover:bg-orange-950/30"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-orange-700 dark:text-orange-300">
        <ClipboardList className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">Evoluções pendentes</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {count === 1
            ? '1 terapia aguardando registro (prazo 24h)'
            : `${count} terapias aguardando registro (prazo 24h)`}
        </p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  )
}

function describeNearbyDemands(
  nearbyCount: number,
  totalCount: number,
): { title: string; subtitle: string } {
  if (nearbyCount > 0) {
    return {
      title: `${nearbyCount} demanda${nearbyCount === 1 ? '' : 's'} próxima${nearbyCount === 1 ? '' : 's'} de você`,
      subtitle: 'Veja oportunidades na sua região',
    }
  }
  if (totalCount > 0) {
    return {
      title: `${totalCount} demanda${totalCount === 1 ? '' : 's'} aberta${totalCount === 1 ? '' : 's'}`,
      subtitle: 'Explore oportunidades disponíveis',
    }
  }
  return {
    title: 'Nenhuma demanda aberta',
    subtitle: 'Novas oportunidades aparecerão aqui',
  }
}

function HomeEvolutionCard({
  points,
  patenteLabel,
  repassePercent,
}: {
  points: number
  patenteLabel: string
  repassePercent: number
}) {
  return (
    <Link
      to="/profissional/evolucao"
      className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
        <Trophy className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Minha jornada</p>
        <p className="text-xs text-muted-foreground">
          {points} pts · {patenteLabel} · {repassePercent}% repasse
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}

function HomeOpportunitiesCard({
  title,
  subtitle,
  onClick,
}: {
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MapPin className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  )
}

export function PPHomePage() {
  const navigate = useNavigate()

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

  const todaySessions = sessionsQuery.data ?? []

  const upcomingQuery = useQuery({
    queryKey: ppAgendaQueryKeys.upcoming(MAX_TODAY_SESSIONS_DESKTOP),
    queryFn: () => listUpcomingAgendaSessions({ limit: MAX_TODAY_SESSIONS_DESKTOP }),
    enabled: !sessionsQuery.isLoading && todaySessions.length === 0,
  })

  const demandsQuery = useQuery({
    queryKey: PP_DEMANDS_QUERY_KEY,
    queryFn: () => demandsService.listOpenForPp(),
  })

  const pendingEvolutionsQuery = useQuery({
    queryKey: ppEvolutionsQueryKeys.pending,
    queryFn: listPendingEvolutionsForPp,
  })

  const { data: professional } = useQuery({
    queryKey: ['pp', 'current_professional'],
    queryFn: getCurrentProfessional,
  })

  const { data: pointsProfile } = useQuery({
    queryKey: ['pp', 'points_profile', professional?.id],
    queryFn: () => getProfessionalPointsProfile(professional!.id),
    enabled: !!professional?.id,
  })

  const { data: courses } = useQuery({
    queryKey: ['pp', 'academy', 'courses'],
    queryFn: getPublishedCourses,
  })
  const course = courses?.[0]

  const { data: professionalId } = useQuery({
    queryKey: ['pp', 'professional-id'],
    queryFn: getProfessionalId,
  })

  const { data: playerContext } = useQuery({
    queryKey: ['pp', 'academy', 'player-context', course?.id, professionalId],
    queryFn: () => getCoursePlayerContext(course!.id, professionalId!),
    enabled: Boolean(course?.id && professionalId),
  })

  const demands = demandsQuery.data?.data ?? []
  const pendingEvolutions = pendingEvolutionsQuery.data?.data ?? []
  const pendingEvolutionsCount = pendingEvolutionsQuery.data?.count ?? 0

  const mapFallbackCenter = useMemo(() => {
    const points = demands
      .filter((demand) => demand.location_lat != null && demand.location_lng != null)
      .map((demand) => ({ lat: demand.location_lat!, lng: demand.location_lng! }))
    return resolvePointsCenter(points.length > 0 ? points : [MAUA_CENTER])
  }, [demands])

  const { origin } = usePpDistanceOrigin(mapFallbackCenter)

  const nearbyCount = useMemo(
    () => countDemandsWithinRadius(demands, origin),
    [demands, origin],
  )

  const opportunitiesCopy = describeNearbyDemands(nearbyCount, demands.length)
  const upcomingSessions = upcomingQuery.data ?? []
  const showingUpcoming = todaySessions.length === 0 && upcomingSessions.length > 0
  const sessions = showingUpcoming ? upcomingSessions : todaySessions
  const daySummary = buildAgendaDaySummary(todaySessions)
  const previewSessions = sessions.slice(0, MAX_TODAY_SESSIONS_DESKTOP)
  const remainingSessionsMobile = Math.max(0, sessions.length - MAX_TODAY_SESSIONS_MOBILE)
  const remainingSessionsDesktop = Math.max(0, sessions.length - MAX_TODAY_SESSIONS_DESKTOP)
  const sessionsSectionTitle = showingUpcoming ? 'Próximas sessões' : 'Seu dia'
  const sessionsEmpty =
    todaySessions.length === 0 &&
    upcomingSessions.length === 0 &&
    !upcomingQuery.isLoading &&
    !upcomingQuery.isFetching

  const continueLessonId = useMemo(() => {
    if (!playerContext) return null
    return getContinueLessonId(playerContext.flatItems, playerContext.completedItemIds)
  }, [playerContext])

  const openAcademy = () => {
    if (continueLessonId) {
      navigate(`/profissional/academy/aulas/${continueLessonId}`)
      return
    }
    navigate('/profissional/academy')
  }

  const isLoading =
    sessionsQuery.isLoading ||
    (todaySessions.length === 0 && upcomingQuery.isLoading) ||
    demandsQuery.isLoading ||
    pendingEvolutionsQuery.isLoading

  if (isLoading) {
    return (
      <>
        <PageHeader>
          <PPHomeHeaderLogo />
        </PageHeader>
        <CrudScrollPageLayout>
          <CrudListPageSkeleton showStats={false} tableColumns={0} />
        </CrudScrollPageLayout>
      </>
    )
  }

  return (
    <>
      <PageHeader>
        <PPHomeHeaderLogo />
      </PageHeader>

      <CrudScrollPageLayout>
        <CascadeReveal className="w-full space-y-5 pb-6 lg:max-w-none lg:space-y-6 lg:pb-8">
          <CascadeItem className="hidden lg:block">
            <HomeDayKpiRow
              summary={daySummary}
              pendingEvolutionsCount={pendingEvolutionsCount}
              demandsCount={demands.length}
              nearbyDemandsCount={nearbyCount}
            />
          </CascadeItem>

          <CascadeItem className="space-y-3">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_min(20rem,32%)] lg:items-start xl:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="min-w-0 space-y-3">
                <HomeSectionTitle
                  title={sessionsSectionTitle}
                  action={
                    <Button variant="ghost" size="sm" className="h-auto px-0 text-primary" asChild>
                      <Link to="/profissional/agenda">
                        Ver agenda
                        <ChevronRight className="ml-0.5 h-4 w-4" />
                      </Link>
                    </Button>
                  }
                />

                {sessionsEmpty ? (
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-6 text-center text-sm text-muted-foreground">
                    Você não tem sessões agendadas para hoje.
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-2 sm:gap-3">
                      {previewSessions.map((session, index) => (
                        <HomeSessionCard
                          key={session.id}
                          session={session}
                          className={cn(index >= MAX_TODAY_SESSIONS_MOBILE && 'hidden lg:block')}
                        />
                      ))}
                    </div>
                    {remainingSessionsMobile > 0 && (
                      <p className="px-1 text-xs text-muted-foreground lg:hidden">
                        +{remainingSessionsMobile} terapia{remainingSessionsMobile === 1 ? '' : 's'}{' '}
                        {showingUpcoming ? 'nos próximos dias' : 'hoje'}
                      </p>
                    )}
                    {remainingSessionsDesktop > 0 && (
                      <p className="hidden px-1 text-xs text-muted-foreground lg:block">
                        +{remainingSessionsDesktop} terapia{remainingSessionsDesktop === 1 ? '' : 's'}{' '}
                        {showingUpcoming ? 'nos próximos dias' : 'hoje'}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="hidden min-w-0 flex-col gap-6 lg:flex">
                {pendingEvolutionsCount > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Evoluções pendentes
                      </h3>
                      <Button variant="ghost" size="sm" className="h-auto shrink-0 px-0 text-primary" asChild>
                        <Link to="/profissional/evolucoes">
                          Ver todas
                          <ChevronRight className="ml-0.5 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                    <HomePendingEvolutionsList items={pendingEvolutions} />
                  </div>
                )}

                <div className="space-y-3">
                  <HomeSectionTitle title="Oportunidades" />
                  <HomeOpportunitiesCard
                    title={opportunitiesCopy.title}
                    subtitle={opportunitiesCopy.subtitle}
                    onClick={() => navigate('/profissional/demandas')}
                  />
                </div>
              </div>
            </div>
          </CascadeItem>

          {pendingEvolutionsCount > 0 ? (
            <CascadeItem className="lg:hidden">
              <HomePendingEvolutionsCard
                count={pendingEvolutionsCount}
                onClick={() => navigate('/profissional/evolucoes')}
              />
            </CascadeItem>
          ) : null}

          <CascadeItem>
            <HomeEvolutionCard
              points={pointsProfile?.points_total ?? 0}
              patenteLabel={patenteLabels[pointsProfile?.patente ?? 'ALUMINIO']}
              repassePercent={PATENTE_REPASSE_PERCENT[pointsProfile?.patente ?? 'ALUMINIO']}
            />
          </CascadeItem>

          <CascadeItem className="space-y-3 lg:hidden">
            <HomeSectionTitle
              title="Oportunidades"
              action={
                <Button variant="ghost" size="sm" className="h-auto px-0 text-primary" asChild>
                  <Link to="/profissional/demandas">
                    Ver todas
                    <ChevronRight className="ml-0.5 h-4 w-4" />
                  </Link>
                </Button>
              }
            />
            <HomeOpportunitiesCard
              title={opportunitiesCopy.title}
              subtitle={opportunitiesCopy.subtitle}
              onClick={() => navigate('/profissional/demandas')}
            />
          </CascadeItem>

          <CascadeItem>
            <HomeAcademyBanner
              slide={ACADEMY_FORMATION_SLIDE}
              completedLessons={playerContext?.completedItems ?? 0}
              totalLessons={playerContext?.totalItems ?? 0}
              onClick={openAcademy}
            />
          </CascadeItem>
        </CascadeReveal>
      </CrudScrollPageLayout>
    </>
  )
}
