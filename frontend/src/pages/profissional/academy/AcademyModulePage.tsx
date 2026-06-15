import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { getModuleLessons, getPublishedCourses } from '@/services/academy'

export function AcademyModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const navigate = useNavigate()

  const { data: courses } = useQuery({ queryKey: ['pp', 'academy', 'courses'], queryFn: getPublishedCourses })
  const course = courses?.[0]

  const { data: lessons, isLoading } = useQuery({
    queryKey: ['pp', 'academy', 'module-lessons', moduleId],
    queryFn: () => getModuleLessons(moduleId!),
    enabled: Boolean(moduleId),
  })

  useEffect(() => {
    if (!lessons || lessons.length === 0) return
    const first = [...lessons].sort((a, b) => a.sort_order - b.sort_order)[0]
    if (first) navigate(`/profissional/academy/aulas/${first.id}`, { replace: true })
  }, [lessons, navigate])

  if (isLoading) return <PageSkeleton />

  if (!course || !lessons?.length) {
    return <p className="p-6 text-sm text-muted-foreground">Módulo não encontrado ou sem aulas publicadas.</p>
  }

  return <PageSkeleton />
}
