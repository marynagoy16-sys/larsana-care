import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ContentLessonExperience } from '@/components/content-experience/ContentLessonExperience'
import { ContentLessonPanel } from '@/components/content-experience/ContentLessonPanel'
import { ContentLessonSkeleton } from '@/components/content-experience/ContentLessonSkeleton'
import { ContentPlayerLayout } from '@/components/content-experience/ContentPlayerLayout'
import { LarsanaPillContentPlayer } from '@/components/larsanapill/LarsanaPillContentPlayer'
import {
  getCategoryPlayerContext,
  getContentById,
  getPrimaryPatientId,
  markContentComplete,
} from '@/services/larsanapill'

export function LarsanaPillContentPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [completing, setCompleting] = useState(false)

  const { data: patientId } = useQuery({
    queryKey: ['paciente', 'patient-id'],
    queryFn: getPrimaryPatientId,
  })

  const { data: content, isLoading: loadingContent } = useQuery({
    queryKey: ['paciente', 'larsanapill', 'content', id],
    queryFn: () => getContentById(id!),
    enabled: Boolean(id),
  })

  const { data: playerContext, isLoading: loadingContext } = useQuery({
    queryKey: ['paciente', 'larsanapill', 'player-context', slug, patientId],
    queryFn: () => getCategoryPlayerContext(slug!, patientId!),
    enabled: Boolean(slug && patientId),
  })

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!patientId || !id) return
      setCompleting(true)
      await markContentComplete(patientId, id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paciente', 'larsanapill'] })
    },
    onSettled: () => setCompleting(false),
  })

  const handleSelectItem = useCallback(
    (contentId: string) => {
      navigate(`/paciente/larsanapill/categoria/${slug}/conteudo/${contentId}`)
    },
    [navigate, slug],
  )

  const isLoading = loadingContent || loadingContext

  if (!isLoading && (!content || !playerContext || !slug || !id)) {
    return <p className="p-6 text-sm text-muted-foreground">Conteúdo não encontrado.</p>
  }

  return (
    <ContentPlayerLayout
      backHref="/paciente/larsanapill"
      backLabel="Voltar ao LarsanaPill"
      isLoading={isLoading}
      skeleton={<ContentLessonSkeleton />}
    >
      {content && playerContext && id && (
        <ContentLessonExperience
          title={playerContext.category.title}
          groups={playerContext.groups}
          flatItems={playerContext.flatItems}
          activeItemId={id}
          onSelectItem={handleSelectItem}
          completedItemIds={playerContext.completedItemIds}
        >
          <ContentLessonPanel title={content.title} description={content.description}>
            <LarsanaPillContentPlayer
              content={content}
              completing={completing || completeMutation.isPending}
              onComplete={() => completeMutation.mutate()}
            />
          </ContentLessonPanel>
        </ContentLessonExperience>
      )}
    </ContentPlayerLayout>
  )
}
