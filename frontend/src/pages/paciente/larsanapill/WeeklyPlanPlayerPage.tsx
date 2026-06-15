import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ContentLessonExperience } from '@/components/content-experience/ContentLessonExperience'
import { ContentLessonPanel } from '@/components/content-experience/ContentLessonPanel'
import { ContentLessonSkeleton } from '@/components/content-experience/ContentLessonSkeleton'
import { ContentPlayerLayout } from '@/components/content-experience/ContentPlayerLayout'
import { WeeklyPlanDayPanel } from '@/components/larsanapill/WeeklyPlanDayPanel'
import {
  getPrimaryPatientId,
  getWeeklyPlanPlayerContext,
  markPlanDayComplete,
} from '@/services/larsanapill'

export function WeeklyPlanPlayerPage() {
  const { slug, dayIndex } = useParams<{ slug: string; dayIndex: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [completing, setCompleting] = useState(false)
  const parsedDayIndex = Number(dayIndex)

  const { data: patientId } = useQuery({
    queryKey: ['paciente', 'patient-id'],
    queryFn: getPrimaryPatientId,
  })

  const { data: playerContext, isLoading } = useQuery({
    queryKey: ['paciente', 'larsanapill', 'plan-player', slug, patientId],
    queryFn: () => getWeeklyPlanPlayerContext(slug!, patientId!),
    enabled: Boolean(slug && patientId),
  })

  const activeDay = playerContext?.days.find((day) => day.day_index === parsedDayIndex)

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!patientId || !playerContext || !activeDay) return
      setCompleting(true)
      await markPlanDayComplete(patientId, playerContext.plan.id, activeDay.day_index)
      if (activeDay.content_id) {
        const { markContentComplete } = await import('@/services/larsanapill')
        await markContentComplete(patientId, activeDay.content_id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paciente', 'larsanapill'] })
    },
    onSettled: () => setCompleting(false),
  })

  const handleSelectItem = useCallback(
    (dayId: string) => {
      const day = playerContext?.days.find((d) => d.id === dayId)
      if (day && slug) navigate(`/paciente/larsanapill/planos/${slug}/dia/${day.day_index}`)
    },
    [navigate, playerContext?.days, slug],
  )

  if (!isLoading && (!playerContext || !activeDay || !slug)) {
    return <p className="p-6 text-sm text-muted-foreground">Dia do plano não encontrado.</p>
  }

  return (
    <ContentPlayerLayout
      backHref={`/paciente/larsanapill/planos/${slug}`}
      backLabel="Voltar ao plano"
      isLoading={isLoading}
      skeleton={<ContentLessonSkeleton />}
    >
      {playerContext && activeDay && (
        <ContentLessonExperience
          title={playerContext.plan.title}
          groups={playerContext.groups}
          flatItems={playerContext.flatItems}
          activeItemId={activeDay.id}
          onSelectItem={handleSelectItem}
          completedItemIds={playerContext.completedItemIds}
        >
          <ContentLessonPanel
            title={`Dia ${activeDay.day_index} — ${activeDay.title}`}
            description={playerContext.plan.description}
          >
            <WeeklyPlanDayPanel
              day={activeDay}
              completing={completing || completeMutation.isPending}
              onComplete={() => completeMutation.mutate()}
            />
          </ContentLessonPanel>
        </ContentLessonExperience>
      )}
    </ContentPlayerLayout>
  )
}
