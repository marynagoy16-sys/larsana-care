import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ContentLessonExperience } from '@/components/content-experience/ContentLessonExperience'
import { ContentLessonPanel } from '@/components/content-experience/ContentLessonPanel'
import { ContentLessonSkeleton } from '@/components/content-experience/ContentLessonSkeleton'
import { ContentPlayerLayout } from '@/components/content-experience/ContentPlayerLayout'
import { AcademyLessonPlayer } from '@/components/academy/AcademyLessonPlayer'
import {
  getCoursePlayerContext,
  getLessonById,
  getProfessionalId,
  getPublishedCourses,
  markLessonComplete,
} from '@/services/academy'

export function AcademyLessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [completing, setCompleting] = useState(false)

  const { data: courses } = useQuery({ queryKey: ['pp', 'academy', 'courses'], queryFn: getPublishedCourses })
  const course = courses?.[0]

  const { data: professionalId } = useQuery({ queryKey: ['pp', 'professional-id'], queryFn: getProfessionalId })

  const { data: playerContext, isLoading: loadingContext } = useQuery({
    queryKey: ['pp', 'academy', 'player-context', course?.id, professionalId],
    queryFn: () => getCoursePlayerContext(course!.id, professionalId!),
    enabled: Boolean(course?.id && professionalId),
  })

  const { data: lesson, isLoading: loadingLesson } = useQuery({
    queryKey: ['pp', 'academy', 'lesson', lessonId],
    queryFn: () => getLessonById(lessonId!),
    enabled: Boolean(lessonId),
  })

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!playerContext?.enrollment.id || !lessonId) return
      setCompleting(true)
      await markLessonComplete(playerContext.enrollment.id, lessonId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pp', 'academy'] })
    },
    onSettled: () => setCompleting(false),
  })

  const handleSelectItem = useCallback(
    (nextLessonId: string) => {
      navigate(`/profissional/academy/aulas/${nextLessonId}`)
    },
    [navigate],
  )

  const isLoading = loadingContext || loadingLesson

  if (!isLoading && (!lesson || !playerContext || !lessonId)) {
    return <p className="p-6 text-sm text-muted-foreground">Aula não encontrada.</p>
  }

  return (
    <ContentPlayerLayout
      backHref="/profissional/academy"
      backLabel="Voltar à Academy"
      isLoading={isLoading}
      skeleton={<ContentLessonSkeleton />}
    >
      {lesson && playerContext && (
        <ContentLessonExperience
          title={playerContext.course.title}
          groups={playerContext.groups}
          flatItems={playerContext.flatItems}
          activeItemId={lessonId!}
          onSelectItem={handleSelectItem}
          completedItemIds={playerContext.completedItemIds}
        >
          <ContentLessonPanel title={lesson.title} description={lesson.description}>
            <AcademyLessonPlayer
              lesson={lesson}
              completing={completing || completeMutation.isPending}
              onComplete={() => completeMutation.mutate()}
            />
          </ContentLessonPanel>
        </ContentLessonExperience>
      )}
    </ContentPlayerLayout>
  )
}
