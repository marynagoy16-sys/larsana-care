import { useMemo, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, MapPin } from 'lucide-react'
import { HomeAcademyBanner } from '@/components/profissional/home/HomeAcademyBanner'
import { HomeDayKpiRow } from '@/components/profissional/home/HomeDayKpiRow'
import { HomePendingEvolutionsList } from '@/components/profissional/home/HomePendingEvolutionsList'
import { HomeDemandsPreview, HomeDemandsSectionHeader } from '@/components/profissional/home/HomeDemandsPreview'
import { HomeSessionCard } from '@/components/profissional/home/HomeSessionCard'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { CrudListPageSkeleton, PageHeaderSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { ACADEMY_FORMATION_SLIDE } from '@/constants/academySlides'
import { useAuth } from '@/hooks/useAuth'
import { useMapOrigin } from '@/hooks/useMapOrigin'
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
  formatAgendaDayTitleShort,
  listAgendaSessionsForDay,
  ppAgendaQueryKeys,
} from '@/services/ppAgenda'

const PP_DEMANDS_QUERY_KEY = ['pp', 'demands'] as const
const MAX_TODAY_SESSIONS_MOBILE = 3
const MAX_TODAY_SESSIONS_DESKTOP = 5

function HomeGreeting({ firstName, dateLabel }: { firstName: string; dateLabel: string }) {
  return (
    <div className="min-w-0 space-y-0.5">
      <h1 className="truncate font-display text-2xl font-bold leading-tight tracking-tight lg:text-[1.75rem]">
        Olá, {firstName}
      </h1>
      <p className="truncate text-sm text-muted-foreground">{dateLabel}</p>
    </div>
  )
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
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {action}
    </div>
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

export function PPHomePage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const firstName = profile?.full_name?.split(' ')[0] ?? 'parceiro'

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const dayKey = toAgendaDayKey(today)
  const dateLabel = formatAgendaDayTitleShort(today)

  const sessionsQuery = useQuery({
    queryKey: ppAgendaQueryKeys.day(dayKey),
    queryFn: () => listAgendaSessionsForDay(today),
  })

  const demandsQuery = useQuery({
    queryKey: PP_DEMANDS_QUERY_KEY,
    queryFn: () => demandsService.listOpenForPp(),
  })

  const pendingEvolutionsQuery = useQuery({
    queryKey: ppEvolutionsQueryKeys.pending,
    queryFn: listPendingEvolutionsForPp,
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

  const { origin } = useMapOrigin(mapFallbackCenter)

  const nearbyCount = useMemo(
    () => countDemandsWithinRadius(demands, origin),
    [demands, origin],
  )

  const opportunitiesCopy = describeNearbyDemands(nearbyCount, demands.length)
  const sessions = sessionsQuery.data ?? []
  const daySummary = buildAgendaDaySummary(sessions)
  const previewSessions = sessions.slice(0, MAX_TODAY_SESSIONS_DESKTOP)
  const remainingSessionsMobile = Math.max(0, sessions.length - MAX_TODAY_SESSIONS_MOBILE)
  const remainingSessionsDesktop = Math.max(0, sessions.length - MAX_TODAY_SESSIONS_DESKTOP)

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
    demandsQuery.isLoading ||
    pendingEvolutionsQuery.isLoading

  if (isLoading) {
    return (
      <>
        <PageHeader loading>
          <PageHeaderSkeleton />
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
        <HomeGreeting firstName={firstName} dateLabel={dateLabel} />
      </PageHeader>

      <CrudScrollPageLayout>
        <CascadeReveal className="w-full space-y-5 pb-6 lg:space-y-6 lg:pb-8">
          <CascadeItem className="hidden lg:block">
            <HomeDayKpiRow
              summary={daySummary}
              pendingEvolutionsCount={pendingEvolutionsCount}
              demandsCount={demands.length}
              nearbyDemandsCount={nearbyCount}
            />
          </CascadeItem>

          <div
            className={cn(
              'flex flex-col gap-5',
              pendingEvolutionsCount > 0 && 'lg:grid lg:grid-cols-[1fr_24rem] xl:grid-cols-[1fr_26rem] lg:items-start lg:gap-6',
            )}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-5">
              <CascadeItem className="space-y-3">
                <HomeSectionTitle
                  title="Seu dia"
                  action={
                    <Button variant="ghost" size="sm" className="h-auto px-0 text-primary" asChild>
                      <Link to="/profissional/agenda">
                        Ver agenda
                        <ChevronRight className="ml-0.5 h-4 w-4" />
                      </Link>
                    </Button>
                  }
                />

                {sessions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-6 text-center text-sm text-muted-foreground">
                    Você não tem sessões agendadas para hoje.
                  </div>
                ) : (
                  <>
                    <div
                      className={cn(
                        'grid gap-2 sm:gap-3',
                        previewSessions.length > 1 && 'sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3',
                      )}
                    >
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
                        +{remainingSessionsMobile} sessão{remainingSessionsMobile === 1 ? '' : 'ões'} hoje
                      </p>
                    )}
                    {remainingSessionsDesktop > 0 && (
                      <p className="hidden px-1 text-xs text-muted-foreground lg:block">
                        +{remainingSessionsDesktop} sessão{remainingSessionsDesktop === 1 ? '' : 'ões'} hoje
                      </p>
                    )}
                  </>
                )}
              </CascadeItem>

              <CascadeItem className="space-y-3 lg:hidden">
                <HomeDemandsSectionHeader />
                <HomeDemandsPreview
                  demands={demands}
                  origin={origin}
                  onSelectDemand={(id) => navigate(`/profissional/demandas/${id}`)}
                />
              </CascadeItem>

              <CascadeItem className="hidden space-y-3 lg:block">
                <HomeSectionTitle title="Oportunidades" />
                <button
                  type="button"
                  onClick={() => navigate('/profissional/demandas')}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{opportunitiesCopy.title}</p>
                    <p className="text-xs text-muted-foreground">{opportunitiesCopy.subtitle}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              </CascadeItem>
            </div>

            {pendingEvolutionsCount > 0 && (
              <aside className="hidden w-full min-w-0 lg:block">
                <CascadeItem className="space-y-3">
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" className="h-auto px-0 text-primary" asChild>
                      <Link to="/profissional/evolucoes">Ver todas</Link>
                    </Button>
                  </div>
                  <HomePendingEvolutionsList items={pendingEvolutions} />
                </CascadeItem>
              </aside>
            )}
          </div>

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
