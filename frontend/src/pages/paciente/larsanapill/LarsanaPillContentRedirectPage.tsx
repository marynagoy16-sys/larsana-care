import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { getContentById, getPublishedCategories } from '@/services/larsanapill'

export function LarsanaPillContentRedirectPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: content, isLoading } = useQuery({
    queryKey: ['paciente', 'larsanapill', 'content-redirect', id],
    queryFn: () => getContentById(id!),
    enabled: Boolean(id),
  })

  useEffect(() => {
    if (!content) return
    getPublishedCategories().then((categories) => {
      const category = categories.find((c) => c.id === content.category_id)
      if (category) {
        navigate(`/paciente/larsanapill/categoria/${category.slug}/conteudo/${content.id}`, { replace: true })
      }
    })
  }, [content, navigate])

  if (isLoading) return <PageSkeleton />
  if (!content) return <p className="p-6 text-sm text-muted-foreground">Conteúdo não encontrado.</p>
  return <PageSkeleton />
}
