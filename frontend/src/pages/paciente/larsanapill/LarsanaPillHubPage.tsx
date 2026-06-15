import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Dumbbell, Heart, Home } from 'lucide-react'
import { ContentBannerCarousel } from '@/components/content-experience/ContentBannerCarousel'
import { ContentDisclaimerBanner } from '@/components/content-experience/ContentDisclaimerBanner'
import { ContentHubLayout } from '@/components/content-experience/ContentHubLayout'
import { ContentHubSkeleton } from '@/components/content-experience/ContentHubSkeleton'
import { ContentLessonCard } from '@/components/content-experience/ContentLessonCard'
import { ContentProgressBanner } from '@/components/content-experience/ContentProgressBanner'
import { ContentSection } from '@/components/content-experience/ContentSection'
import { WeeklyPlanStoriesRail } from '@/components/larsanapill/WeeklyPlanStoriesRail'
import {
  getCategoryContents,
  getContinueContentId,
  getHubPlayerContext,
  getPlansProgressSummary,
  getPrimaryPatientId,
  getPublishedCategories,
  getWeeklyPlans,
} from '@/services/larsanapill'
import { flattenCategoryContents } from '@/lib/content/lessonNavigation'

const PHIL_SLIDES = [
  {
    id: 'home',
    eyebrow: 'LarsanaPill',
    title: 'Exercícios e orientações em casa',
    subtitle: 'Complemente seu tratamento com conteúdos guiados pelo seu fisioterapeuta.',
    icon: Home,
    className: 'bg-primary text-primary-foreground',
  },
  {
    id: 'exercise',
    eyebrow: 'PHIL',
    title: 'Programa de exercícios domiciliares',
    subtitle: 'Vídeos, passo a passo e planos semanais para manter a rotina entre as sessões.',
    icon: Dumbbell,
    className: 'bg-muted text-foreground border',
  },
  {
    id: 'care',
    eyebrow: 'Cuidado integrado',
    title: 'Feito para o seu tratamento',
    subtitle: 'Conteúdos alinhados ao plano terapêutico — não substituem a sessão presencial.',
    icon: Heart,
    className: 'bg-secondary text-secondary-foreground',
  },
]

export function LarsanaPillHubPage() {
  const navigate = useNavigate()

  const { data: patientId } = useQuery({
    queryKey: ['paciente', 'patient-id'],
    queryFn: getPrimaryPatientId,
  })

  const { data: hubContext, isLoading } = useQuery({
    queryKey: ['paciente', 'larsanapill', 'hub', patientId],
    queryFn: async () => {
      if (patientId) return getHubPlayerContext(patientId)
      const categories = await getPublishedCategories()
      return { categories, progressMap: {} as Record<string, number>, completedIds: new Set<string>() }
    },
  })

  const { data: weeklyPlans } = useQuery({
    queryKey: ['paciente', 'larsanapill', 'weekly-plans'],
    queryFn: getWeeklyPlans,
  })

  const { data: plansProgress } = useQuery({
    queryKey: ['paciente', 'larsanapill', 'plans-progress', patientId, weeklyPlans?.map((p) => p.id)],
    queryFn: () => getPlansProgressSummary(patientId!, weeklyPlans!.map((p) => p.id)),
    enabled: Boolean(patientId && weeklyPlans?.length),
  })

  const { data: categoriesWithContents } = useQuery({
    queryKey: ['paciente', 'larsanapill', 'hub-contents', hubContext?.categories.map((c) => c.id)],
    queryFn: async () => {
      if (!hubContext) return []
      return Promise.all(
        hubContext.categories.map(async (cat) => {
          const contents = await getCategoryContents(cat.id)
          return {
            category: cat,
            contents,
            flat: flattenCategoryContents(cat, contents),
          }
        }),
      )
    },
    enabled: Boolean(hubContext?.categories.length),
  })

  const sectionsWithContent = useMemo(() => {
    if (!categoriesWithContents) return []
    return categoriesWithContents.filter(({ contents }) => contents.length > 0)
  }, [categoriesWithContents])

  const continueTarget = useMemo(() => {
    if (!sectionsWithContent.length || !hubContext) return null
    const allFlat = sectionsWithContent.flatMap((entry) => entry.flat)
    const contentId = getContinueContentId(allFlat, hubContext.completedIds)
    if (!contentId) return null
    const entry = sectionsWithContent.find((e) => e.contents.some((c) => c.id === contentId))
    if (!entry) return null
    return { slug: entry.category.slug, contentId }
  }, [sectionsWithContent, hubContext])

  const totalItems = sectionsWithContent.reduce((sum, e) => sum + e.contents.length, 0)
  const completedItems = hubContext?.completedIds.size ?? 0

  if (isLoading) return <ContentHubSkeleton />

  return (
    <ContentHubLayout>
      <ContentBannerCarousel slides={PHIL_SLIDES} />

      <ContentDisclaimerBanner>
        Complemento ao tratamento — não substitui sessão presencial com seu fisioterapeuta.
      </ContentDisclaimerBanner>

      <ContentProgressBanner
        title="Seu progresso"
        subtitle="Acompanhe os conteúdos que você já concluiu"
        completed={completedItems}
        total={totalItems}
        continueLabel="Continuar de onde parou"
        onContinue={
          continueTarget
            ? () =>
                navigate(
                  `/paciente/larsanapill/categoria/${continueTarget.slug}/conteudo/${continueTarget.contentId}`,
                )
            : undefined
        }
      />

      {weeklyPlans && weeklyPlans.length > 0 && (
        <WeeklyPlanStoriesRail
          plans={weeklyPlans}
          progressByPlanId={plansProgress}
          onSelectPlan={(planSlug) => navigate(`/paciente/larsanapill/planos/${planSlug}`)}
        />
      )}

      {sectionsWithContent.map(({ category, contents }) => (
        <ContentSection key={category.id} title={category.title} description={category.description}>
          {contents.map((content) => (
            <ContentLessonCard
              key={content.id}
              title={content.title}
              subtitle={content.description}
              badgeLabel={category.code}
              contentType={content.content_type}
              progressPercent={hubContext?.progressMap[content.id] ?? 0}
              href={`/paciente/larsanapill/categoria/${category.slug}/conteudo/${content.id}`}
            />
          ))}
        </ContentSection>
      ))}
    </ContentHubLayout>
  )
}
