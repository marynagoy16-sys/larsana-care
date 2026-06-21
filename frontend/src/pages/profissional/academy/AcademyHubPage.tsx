import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AcademyGateBanner } from '@/components/academy/AcademyGateBanner'
import { ContentBannerCarousel } from '@/components/content-experience/ContentBannerCarousel'
import { ContentFloatingToolbar } from '@/components/content-experience/ContentFloatingToolbar'
import { ContentHubLayout } from '@/components/content-experience/ContentHubLayout'
import { ContentHubSkeleton } from '@/components/content-experience/ContentHubSkeleton'
import { ContentHubToolbarSpacer } from '@/components/content-experience/ContentHubToolbarSpacer'
import { ContentLessonCard } from '@/components/content-experience/ContentLessonCard'
import { ContentProgressBanner } from '@/components/content-experience/ContentProgressBanner'
import { ContentSection } from '@/components/content-experience/ContentSection'
import { ACADEMY_SLIDES } from '@/constants/academySlides'
import { getContinueLessonId, getCoursePlayerContext, getDemandsGateRule, getPublishedCourses, getProfessionalId, checkPpPassesGate } from '@/services/academy'

function matchesSearch(text: string | null | undefined, query: string) {
  if (!query.trim()) return true
  return (text ?? '').toLowerCase().includes(query.trim().toLowerCase())
}

export function AcademyHubPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const blockedMsg = params.get('msg')
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState<string | null>(null)

  const { data: courses, isLoading: loadingCourses } = useQuery({
    queryKey: ['pp', 'academy', 'courses'],
    queryFn: getPublishedCourses,
  })
  const course = courses?.[0]

  const { data: professionalId } = useQuery({
    queryKey: ['pp', 'professional-id'],
    queryFn: getProfessionalId,
  })

  const { data: playerContext, isLoading: loadingContext } = useQuery({
    queryKey: ['pp', 'academy', 'player-context', course?.id, professionalId],
    queryFn: () => getCoursePlayerContext(course!.id, professionalId!),
    enabled: Boolean(course?.id && professionalId),
  })

  const { data: gateRule } = useQuery({
    queryKey: ['pp', 'academy', 'demands-rule'],
    queryFn: getDemandsGateRule,
  })

  const { data: passesGate } = useQuery({
    queryKey: ['pp', 'academy', 'passes-demands'],
    queryFn: () => checkPpPassesGate('demands'),
  })

  const requiredModuleIds = useMemo(() => new Set(gateRule?.required_module_ids ?? []), [gateRule])

  const visibleModules = useMemo(() => {
    if (!playerContext) return []
    return playerContext.groups.filter((group) => {
      if (moduleFilter && group.id !== moduleFilter) return false
      if (!search.trim()) return true
      return (
        matchesSearch(group.title, search) ||
        matchesSearch(group.description, search) ||
        group.items.some((item) => matchesSearch(item.title, search))
      )
    })
  }, [playerContext, moduleFilter, search])

  const continueLessonId = useMemo(() => {
    if (!playerContext) return null
    return getContinueLessonId(playerContext.flatItems, playerContext.completedItemIds)
  }, [playerContext])

  if (loadingCourses || loadingContext) return <ContentHubSkeleton />

  if (!course || !playerContext) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Nenhum curso publicado na Academy. Aguarde a configuração pelo administrador.
      </div>
    )
  }

  const filters = playerContext.groups.map((group) => ({
    id: group.id,
    label: group.code ?? group.title,
  }))

  return (
    <ContentHubLayout>
      <ContentBannerCarousel slides={ACADEMY_SLIDES} />

      {(blockedMsg || passesGate === false) && (
        <AcademyGateBanner message={decodeURIComponent(blockedMsg ?? gateRule?.block_message ?? '')} />
      )}

      <ContentProgressBanner
        title="Academy PP"
        subtitle="Capacitação para operar na plataforma Larsana Care"
        completed={playerContext.completedItems}
        total={playerContext.totalItems}
        onContinue={
          continueLessonId
            ? () => navigate(`/profissional/academy/aulas/${continueLessonId}`)
            : undefined
        }
      />

      {visibleModules.map((group) => {
        const firstLesson = [...group.items].sort((a, b) => a.sortOrder - b.sortOrder)[0]
        if (!firstLesson) return null
        const modProgress = playerContext.groups.find((g) => g.id === group.id)
        const completed = modProgress
          ? modProgress.items.filter((item) => playerContext.completedItemIds.has(item.id)).length
          : 0
        const total = modProgress?.items.length ?? 0
        const progressPercent = total > 0 ? (completed / total) * 100 : 0

        return (
          <ContentSection
            key={group.id}
            title={`${group.code ? `${group.code} — ` : ''}${group.title}`}
            description={group.description}
          >
            <ContentLessonCard
              title={group.title}
              subtitle={group.description}
              badgeLabel={requiredModuleIds.has(group.id) ? 'Obrigatório' : group.code}
              contentType={firstLesson.contentType}
              progressPercent={progressPercent}
              href={`/profissional/academy/aulas/${firstLesson.id}`}
            />
          </ContentSection>
        )
      })}

      <ContentFloatingToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar módulos e aulas…"
        filters={filters}
        activeFilter={moduleFilter}
        onFilterChange={setModuleFilter}
      />

      <ContentHubToolbarSpacer />
    </ContentHubLayout>
  )
}
