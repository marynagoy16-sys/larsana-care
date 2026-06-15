import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { getCategoryBySlug, getCategoryContents } from '@/services/larsanapill'

export function LarsanaPillCategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const { data: category, isLoading: loadingCat } = useQuery({
    queryKey: ['paciente', 'larsanapill', 'category', slug],
    queryFn: () => getCategoryBySlug(slug!),
    enabled: Boolean(slug),
  })

  const { data: contents, isLoading: loadingContents } = useQuery({
    queryKey: ['paciente', 'larsanapill', 'contents', category?.id],
    queryFn: () => getCategoryContents(category!.id),
    enabled: Boolean(category?.id),
  })

  useEffect(() => {
    if (!category || !contents?.length) return
    const first = [...contents].sort((a, b) => a.sort_order - b.sort_order)[0]
    if (first) {
      navigate(`/paciente/larsanapill/categoria/${category.slug}/conteudo/${first.id}`, { replace: true })
    }
  }, [category, contents, navigate])

  if (loadingCat || loadingContents) return <PageSkeleton />

  if (!category || !contents?.length) {
    return <p className="p-6 text-sm text-muted-foreground">Categoria não encontrada ou sem conteúdos.</p>
  }

  return <PageSkeleton />
}
