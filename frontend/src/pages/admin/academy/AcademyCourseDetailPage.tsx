import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Layers,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AnalyticsStatCard } from '@/components/dashboard/AnalyticsStatCard'
import { DataTable } from '@/components/crud/DataTable'
import { DeleteConfirmDialog } from '@/components/crud/DeleteConfirmDialog'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { DetailPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import {
  academyAdminKeys,
  deleteLesson,
  deleteModule,
  getAdminCourse,
  getCourseStats,
  listAdminLessons,
  listAdminModules,
} from '@/services/academyAdmin'
import type { AcademyLesson, AcademyModule } from '@/types/academy'
import { AdminEntitySection } from './components/AdminEntitySection'
import { CourseFormModal } from './components/CourseFormModal'
import { ModuleFormModal } from './components/ModuleFormModal'
import { LessonFormModal } from './components/LessonFormModal'

export function AcademyCourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [editCourseOpen, setEditCourseOpen] = useState(false)
  const [moduleModal, setModuleModal] = useState<{ open: boolean; module: AcademyModule | null }>({ open: false, module: null })
  const [lessonModal, setLessonModal] = useState<{
    open: boolean
    moduleId: string
    lesson: AcademyLesson | null
  }>({ open: false, moduleId: '', lesson: null })
  const [deleteModuleTarget, setDeleteModuleTarget] = useState<AcademyModule | null>(null)
  const [deleteLessonTarget, setDeleteLessonTarget] = useState<{ lesson: AcademyLesson; moduleId: string } | null>(null)

  const { data: course, isLoading: loadingCourse } = useQuery({
    queryKey: academyAdminKeys.course(id!),
    queryFn: () => getAdminCourse(id!),
    enabled: Boolean(id),
  })

  const { data: modules, isLoading: loadingModules } = useQuery({
    queryKey: academyAdminKeys.modules(id!),
    queryFn: () => listAdminModules(id!),
    enabled: Boolean(id),
  })

  const { data: stats } = useQuery({
    queryKey: academyAdminKeys.courseStats(id!),
    queryFn: () => getCourseStats(id!),
    enabled: Boolean(id),
  })

  const moduleIds = modules?.map((m) => m.id) ?? []

  const { data: lessonsByModule } = useQuery({
    queryKey: [...academyAdminKeys.lessons(id!), moduleIds],
    queryFn: async () => {
      const result: Record<string, AcademyLesson[]> = {}
      for (const mod of modules ?? []) {
        result[mod.id] = await listAdminLessons(mod.id)
      }
      return result
    },
    enabled: Boolean(modules?.length),
  })

  const deleteModuleMutation = useCrudMutation({
    mutationFn: deleteModule,
    queryKey: academyAdminKeys.modules(id!),
    successMessage: 'Módulo excluído',
    onSuccess: () => setDeleteModuleTarget(null),
  })

  const deleteLessonMutation = useCrudMutation({
    mutationFn: deleteLesson,
    queryKey: academyAdminKeys.lessons(deleteLessonTarget?.moduleId ?? id!),
    successMessage: 'Aula excluída',
    onSuccess: () => setDeleteLessonTarget(null),
  })

  const lessonColumns = useMemo(
    () => (mod: AcademyModule) => [
      {
        key: 'title',
        header: 'Aula',
        mobilePrimary: true,
        cell: (r: AcademyLesson) => r.title,
      },
      {
        key: 'type',
        header: 'Tipo',
        cell: (r: AcademyLesson) => r.content_type,
      },
      {
        key: 'status',
        header: 'Status',
        cell: (r: AcademyLesson) => (
          <Badge variant={r.is_published ? 'default' : 'muted'}>
            {r.is_published ? 'Publicada' : 'Rascunho'}
          </Badge>
        ),
      },
      {
        key: 'duration',
        header: 'Duração',
        cell: (r: AcademyLesson) =>
          r.duration_seconds != null ? `${Math.round(r.duration_seconds / 60)} min` : '—',
      },
      {
        key: 'actions',
        header: '',
        className: 'w-28',
        mobileHidden: true,
        cell: (r: AcademyLesson) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setLessonModal({ open: true, moduleId: mod.id, lesson: r })
              }}
            >
              Editar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                setDeleteLessonTarget({ lesson: r, moduleId: mod.id })
              }}
            >
              Excluir
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  if (loadingCourse || loadingModules) {
    return (
      <>
        <PageHeader loading>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate('/admin/academy/cursos')}>
              <ArrowLeft size={20} />
            </Button>
          </div>
        </PageHeader>
        <CrudScrollPageLayout>
          <DetailPageSkeleton />
        </CrudScrollPageLayout>
      </>
    )
  }
  if (!course) return <p className="p-6 text-sm text-muted-foreground">Curso não encontrado.</p>

  return (
    <>
      <PageHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap min-w-0 flex-1">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/academy/cursos')} className="shrink-0 rounded-xl" aria-label="Voltar">
              <ArrowLeft size={20} />
            </Button>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-xl lg:text-2xl leading-tight tracking-tight truncate">
                {course.title}
              </h1>
              {course.description && (
                <p className="text-sm text-muted-foreground mt-0.5 truncate">{course.description}</p>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" className="rounded-full shrink-0" onClick={() => setEditCourseOpen(true)}>
            <Pencil className="mr-1 h-4 w-4" /> Editar curso
          </Button>
        </div>
      </PageHeader>

      <CrudScrollPageLayout>
        <CascadeReveal className="space-y-4 pb-8">
          <CascadeItem>
            <div className="flex flex-wrap gap-2">
              <Badge variant={course.is_published ? 'default' : 'muted'}>
                {course.is_published ? 'Publicado' : 'Rascunho'}
              </Badge>
              {course.is_mandatory && <Badge variant="secondary">Obrigatório</Badge>}
              <Badge variant="outline">{course.audience}</Badge>
            </div>
          </CascadeItem>

          <CascadeItem>
            <div className="grid gap-4 sm:grid-cols-3">
              <AnalyticsStatCard label="Módulos" icon={Layers} value={stats?.moduleCount ?? 0} showLinkIcon={false} />
              <AnalyticsStatCard
                label="Aulas publicadas"
                icon={BookOpen}
                value={`${stats?.publishedLessons ?? 0} / ${stats?.totalLessons ?? 0}`}
                showLinkIcon={false}
              />
              <AnalyticsStatCard
                label="Duração estimada"
                icon={Clock}
                value={`${stats?.totalDurationMinutes ?? 0} min`}
                showLinkIcon={false}
              />
            </div>
          </CascadeItem>

          <CascadeItem>
            <AdminEntitySection
              title="Módulos"
              description="Estrutura M1–M5 do curso"
              icon={Layers}
              badge={modules?.length ?? 0}
              actions={
                <Button size="sm" className="rounded-full" onClick={() => setModuleModal({ open: true, module: null })}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Novo módulo
                </Button>
              }
            >
              <div className="space-y-3">
                {modules?.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum módulo cadastrado.</p>
                )}
                {modules?.map((mod) => {
                  const lessons = lessonsByModule?.[mod.id] ?? []
                  return (
                    <AdminEntitySection
                      key={mod.id}
                      title={`${mod.code} — ${mod.title}`}
                      description={mod.description ?? undefined}
                      icon={BookOpen}
                      badge={`${lessons.length} aulas`}
                      collapsible
                      defaultExpanded={modules.length <= 3}
                      actions={
                        <>
                          <Button
                            size="sm"
                            className="rounded-full"
                            onClick={(e) => {
                              e.stopPropagation()
                              setLessonModal({ open: true, moduleId: mod.id, lesson: null })
                            }}
                          >
                            <Plus className="mr-1 h-3.5 w-3.5" /> Nova aula
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                            onClick={(e) => {
                              e.stopPropagation()
                              setModuleModal({ open: true, module: mod })
                            }}
                          >
                            <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-full text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteModuleTarget(mod)
                            }}
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                          </Button>
                        </>
                      }
                    >
                      <DataTable
                        data={lessons as unknown as Array<Record<string, unknown>>}
                        columns={lessonColumns(mod) as never}
                        getRowKey={(r) => String((r as unknown as AcademyLesson).id)}
                        onRowClick={(r) =>
                          setLessonModal({ open: true, moduleId: mod.id, lesson: r as unknown as AcademyLesson })
                        }
                        emptyMessage="Nenhuma aula neste módulo."
                      />
                    </AdminEntitySection>
                  )
                })}
              </div>
            </AdminEntitySection>
          </CascadeItem>
        </CascadeReveal>
      </CrudScrollPageLayout>

      <CourseFormModal open={editCourseOpen} onOpenChange={setEditCourseOpen} course={course} />
      <ModuleFormModal
        open={moduleModal.open}
        onOpenChange={(open) => setModuleModal({ open, module: open ? moduleModal.module : null })}
        courseId={id!}
        module={moduleModal.module}
      />
      <LessonFormModal
        open={lessonModal.open}
        onOpenChange={(open) => {
          if (!open) setLessonModal({ open: false, moduleId: '', lesson: null })
          else setLessonModal((prev) => ({ ...prev, open: true }))
        }}
        moduleId={lessonModal.moduleId}
        courseId={id!}
        lesson={lessonModal.lesson}
      />

      <DeleteConfirmDialog
        open={Boolean(deleteModuleTarget)}
        onOpenChange={(open) => !open && setDeleteModuleTarget(null)}
        description="O módulo e todas as aulas serão excluídos."
        isDeleting={deleteModuleMutation.isPending}
        onConfirm={() => deleteModuleTarget && deleteModuleMutation.mutate(deleteModuleTarget.id)}
      />
      <DeleteConfirmDialog
        open={Boolean(deleteLessonTarget)}
        onOpenChange={(open) => !open && setDeleteLessonTarget(null)}
        description="Esta aula será excluída permanentemente."
        isDeleting={deleteLessonMutation.isPending}
        onConfirm={() => deleteLessonTarget && deleteLessonMutation.mutate(deleteLessonTarget.lesson.id)}
      />
    </>
  )
}
