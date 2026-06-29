import { useMemo } from 'react'
import { ActivityIndicator, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Dumbbell, Heart, Home } from 'lucide-react-native'
import { SubScreenHeader } from '@/components/layout/SubScreenHeader'
import { ContentBannerCarousel } from '@/components/larsanapill/ContentBannerCarousel'
import { ContentDisclaimerBanner } from '@/components/larsanapill/ContentDisclaimerBanner'
import { ContentLessonCard } from '@/components/larsanapill/ContentLessonCard'
import { ContentProgressBanner } from '@/components/larsanapill/ContentProgressBanner'
import { ContentSection } from '@/components/larsanapill/ContentSection'
import { WeeklyPlanStoriesRail } from '@/components/larsanapill/WeeklyPlanStoriesRail'
import { flattenCategoryContents, getContinueItemId } from '@/lib/lessonNavigation'
import {
  getCategoryContents,
  getHubPlayerContext,
  getPlansProgressSummary,
  getPrimaryPatientId,
  getPublishedCategories,
  getWeeklyPlans,
} from '@/services/larsanapill'

const PHIL_SLIDES = [
  {
    id: 'home',
    eyebrow: 'LarsanaPill',
    title: 'Exercícios e orientações em casa',
    subtitle: 'Complemente seu tratamento com conteúdos guiados pelo seu fisioterapeuta.',
    icon: Home,
    className: 'bg-primary',
  },
  {
    id: 'exercise',
    eyebrow: 'PHIL',
    title: 'Programa de exercícios domiciliares',
    subtitle: 'Vídeos, passo a passo e planos semanais para manter a rotina entre as sessões.',
    icon: Dumbbell,
    className: 'bg-muted border border-border',
  },
  {
    id: 'care',
    eyebrow: 'Cuidado integrado',
    title: 'Feito para o seu tratamento',
    subtitle: 'Conteúdos alinhados ao plano terapêutico — não substituem a sessão presencial.',
    icon: Heart,
    className: 'bg-secondary',
  },
]

export default function LarsanaPillHubScreen() {
  const router = useRouter()

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
          return { category: cat, contents, flat: flattenCategoryContents(cat, contents) }
        }),
      )
    },
    enabled: Boolean(hubContext?.categories.length),
  })

  const sectionsWithContent = useMemo(() => {
    return (categoriesWithContents ?? []).filter(({ contents }) => contents.length > 0)
  }, [categoriesWithContents])

  const continueTarget = useMemo(() => {
    if (!sectionsWithContent.length || !hubContext) return null
    const allFlat = sectionsWithContent.flatMap((entry) => entry.flat)
    const contentId = getContinueItemId(allFlat, hubContext.completedIds)
    if (!contentId) return null
    const entry = sectionsWithContent.find((e) => e.contents.some((c) => c.id === contentId))
    if (!entry) return null
    return { slug: entry.category.slug, contentId }
  }, [sectionsWithContent, hubContext])

  const totalItems = sectionsWithContent.reduce((sum, e) => sum + e.contents.length, 0)
  const completedItems = hubContext?.completedIds.size ?? 0

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <SubScreenHeader title="LarsanaPill" />
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#17310A" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerClassName="gap-6 pb-8 pt-2" showsVerticalScrollIndicator={false}>
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
                    router.push(
                      `/(app)/larsanapill/categoria/${continueTarget.slug}/conteudo/${continueTarget.contentId}`,
                    )
                : undefined
            }
          />

          {weeklyPlans && weeklyPlans.length > 0 ? (
            <WeeklyPlanStoriesRail
              plans={weeklyPlans}
              progressByPlanId={plansProgress}
              onSelectPlan={(planSlug) => router.push(`/(app)/larsanapill/planos/${planSlug}`)}
            />
          ) : null}

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
                  onPress={() =>
                    router.push(`/(app)/larsanapill/categoria/${category.slug}/conteudo/${content.id}`)
                  }
                />
              ))}
            </ContentSection>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
