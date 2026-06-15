import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, BookOpen, Calendar, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AnalyticsStatCard } from '@/components/dashboard/AnalyticsStatCard'
import { DataTable } from '@/components/crud/DataTable'
import { DeleteConfirmDialog } from '@/components/crud/DeleteConfirmDialog'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { DetailPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { ListToolbar } from '@/components/crud/list-page/ListToolbar'
import { PageHeader } from '@/components/layout/PageHeader'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import {
  deleteContent,
  deleteWeeklyPlan,
  getAdminCategory,
  larsanapillAdminKeys,
  listAdminContents,
  listAdminWeeklyPlans,
} from '@/services/academyAdmin'
import type { LarsanaPillContent, LarsanaPillWeeklyPlan } from '@/types/academy'
import { AdminEntitySection } from './components/AdminEntitySection'
import { CategoryFormModal } from './components/CategoryFormModal'
import { ContentFormModal } from './components/ContentFormModal'
import { WeeklyPlanFormModal } from './components/WeeklyPlanFormModal'
import { WeeklyPlanDaysModal } from './components/WeeklyPlanDaysModal'

export function LarsanaPillCategoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [editCategoryOpen, setEditCategoryOpen] = useState(false)
  const [contentModal, setContentModal] = useState<{ open: boolean; content: LarsanaPillContent | null }>({
    open: false,
    content: null,
  })
  const [planModal, setPlanModal] = useState<{ open: boolean; plan: LarsanaPillWeeklyPlan | null }>({
    open: false,
    plan: null,
  })
  const [planDaysModal, setPlanDaysModal] = useState<{ open: boolean; plan: LarsanaPillWeeklyPlan | null }>({
    open: false,
    plan: null,
  })
  const [deleteContentTarget, setDeleteContentTarget] = useState<LarsanaPillContent | null>(null)
  const [deletePlanTarget, setDeletePlanTarget] = useState<LarsanaPillWeeklyPlan | null>(null)
  const [contentSearch, setContentSearch] = useState('')

  const { data: category, isLoading } = useQuery({
    queryKey: larsanapillAdminKeys.category(id!),
    queryFn: () => getAdminCategory(id!),
    enabled: Boolean(id),
  })

  const { data: contents = [], isLoading: loadingContents } = useQuery({
    queryKey: larsanapillAdminKeys.contents(id!),
    queryFn: () => listAdminContents(id!),
    enabled: Boolean(id),
  })

  const { data: weeklyPlans = [], isLoading: loadingPlans } = useQuery({
    queryKey: larsanapillAdminKeys.weeklyPlans,
    queryFn: listAdminWeeklyPlans,
  })

  const filteredContents = useMemo(() => {
    const q = contentSearch.trim().toLowerCase()
    if (!q) return contents
    return contents.filter((c) =>
      [c.title, c.slug, c.content_type].some((v) => String(v).toLowerCase().includes(q)),
    )
  }, [contents, contentSearch])

  const contentStats = useMemo(
    () => ({
      total: contents.length,
      published: contents.filter((c) => c.is_published).length,
      drafts: contents.filter((c) => !c.is_published).length,
      plans: weeklyPlans.length,
    }),
    [contents, weeklyPlans],
  )

  const deleteContentMutation = useCrudMutation({
    mutationFn: deleteContent,
    queryKey: larsanapillAdminKeys.contents(id!),
    successMessage: 'Conteúdo excluído',
    onSuccess: () => setDeleteContentTarget(null),
  })

  const deletePlanMutation = useCrudMutation({
    mutationFn: deleteWeeklyPlan,
    queryKey: larsanapillAdminKeys.weeklyPlans,
    successMessage: 'Plano excluído',
    onSuccess: () => setDeletePlanTarget(null),
  })

  if (isLoading) {
    return (
      <>
        <PageHeader loading>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate('/admin/larsanapill')}>
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
  if (!category) return <p className="p-6 text-sm text-muted-foreground">Categoria não encontrada.</p>

  return (
    <>
      <PageHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap min-w-0 flex-1">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/larsanapill')} className="shrink-0 rounded-xl" aria-label="Voltar">
              <ArrowLeft size={20} />
            </Button>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-xl lg:text-2xl leading-tight tracking-tight truncate">
                {category.title}
              </h1>
              {category.description && (
                <p className="text-sm text-muted-foreground mt-0.5 truncate">{category.description}</p>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" className="rounded-full shrink-0" onClick={() => setEditCategoryOpen(true)}>
            <Pencil className="mr-1 h-4 w-4" /> Editar categoria
          </Button>
        </div>
      </PageHeader>

      <CrudScrollPageLayout>
        <CascadeReveal className="space-y-4 pb-8">
          <CascadeItem>
            <div className="flex flex-wrap gap-2">
              <Badge variant={category.is_published ? 'default' : 'muted'}>
                {category.is_published ? 'Publicada' : 'Rascunho'}
              </Badge>
              <Badge variant="outline">{category.code}</Badge>
            </div>
          </CascadeItem>

          <CascadeItem>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <AnalyticsStatCard label="Conteúdos" icon={BookOpen} value={contentStats.total} showLinkIcon={false} />
              <AnalyticsStatCard label="Publicados" icon={BookOpen} value={contentStats.published} showLinkIcon={false} />
              <AnalyticsStatCard label="Rascunhos" icon={BookOpen} value={contentStats.drafts} showLinkIcon={false} />
              <AnalyticsStatCard label="Planos semanais" icon={Calendar} value={contentStats.plans} showLinkIcon={false} />
            </div>
          </CascadeItem>

          <CascadeItem>
            <AdminEntitySection
              title="Conteúdos"
              description={`Itens da categoria ${category.code}`}
              icon={BookOpen}
              badge={filteredContents.length}
              actions={
                <Button size="sm" className="rounded-full" onClick={() => setContentModal({ open: true, content: null })}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Novo conteúdo
                </Button>
              }
              toolbar={
                <ListToolbar
                  search={contentSearch}
                  onSearchChange={setContentSearch}
                  searchPlaceholder="Pesquisar conteúdos..."
                  onAdd={() => setContentModal({ open: true, content: null })}
                  addLabel="Novo conteúdo"
                />
              }
            >
              <DataTable
                isLoading={loadingContents}
                data={filteredContents as unknown as Array<Record<string, unknown>>}
                getRowKey={(r) => String((r as unknown as LarsanaPillContent).id)}
                onRowClick={(r) => setContentModal({ open: true, content: r as unknown as LarsanaPillContent })}
                emptyMessage="Nenhum conteúdo nesta categoria."
                columns={[
                  { key: 'title', header: 'Título', mobilePrimary: true, cell: (r) => String((r as unknown as LarsanaPillContent).title) },
                  { key: 'type', header: 'Tipo', cell: (r) => String((r as unknown as LarsanaPillContent).content_type) },
                  {
                    key: 'status',
                    header: 'Status',
                    cell: (r) => {
                      const c = r as unknown as LarsanaPillContent
                      return (
                        <Badge variant={c.is_published ? 'default' : 'muted'}>
                          {c.is_published ? 'Publicado' : 'Rascunho'}
                        </Badge>
                      )
                    },
                  },
                  {
                    key: 'actions',
                    header: '',
                    className: 'w-28',
                    mobileHidden: true,
                    cell: (r) => {
                      const c = r as unknown as LarsanaPillContent
                      return (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setContentModal({ open: true, content: c })
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
                              setDeleteContentTarget(c)
                            }}
                          >
                            Excluir
                          </Button>
                        </div>
                      )
                    },
                  },
                ]}
              />
            </AdminEntitySection>
          </CascadeItem>

          <CascadeItem>
            <AdminEntitySection
              title="Planos semanais (T1–T5)"
              description="Rotinas de exercício para pacientes"
              icon={Calendar}
              badge={weeklyPlans.length}
              actions={
                <Button size="sm" className="rounded-full" onClick={() => setPlanModal({ open: true, plan: null })}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Novo plano
                </Button>
              }
            >
              <DataTable
                isLoading={loadingPlans}
                data={weeklyPlans as unknown as Array<Record<string, unknown>>}
                getRowKey={(r) => String((r as unknown as LarsanaPillWeeklyPlan).id)}
                onRowClick={(r) => setPlanModal({ open: true, plan: r as unknown as LarsanaPillWeeklyPlan })}
                emptyMessage="Nenhum plano semanal cadastrado."
                columns={[
                  {
                    key: 'code',
                    header: 'Código',
                    cell: (r) => String((r as unknown as LarsanaPillWeeklyPlan).code),
                  },
                  {
                    key: 'title',
                    header: 'Plano',
                    mobilePrimary: true,
                    cell: (r) => String((r as unknown as LarsanaPillWeeklyPlan).title),
                  },
                  {
                    key: 'sessions',
                    header: 'Frequência',
                    cell: (r) => {
                      const p = r as unknown as LarsanaPillWeeklyPlan
                      return `${p.sessions_per_week}x/semana · ${p.minutes_per_session} min`
                    },
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    cell: (r) => {
                      const p = r as unknown as LarsanaPillWeeklyPlan
                      return (
                        <Badge variant={p.is_published ? 'default' : 'muted'}>
                          {p.is_published ? 'Publicado' : 'Rascunho'}
                        </Badge>
                      )
                    },
                  },
                  {
                    key: 'actions',
                    header: '',
                    className: 'w-40',
                    mobileHidden: true,
                    cell: (r) => {
                      const p = r as unknown as LarsanaPillWeeklyPlan
                      return (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setPlanDaysModal({ open: true, plan: p })
                            }}
                          >
                            Dias
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setPlanModal({ open: true, plan: p })
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
                              setDeletePlanTarget(p)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    },
                  },
                ]}
              />
            </AdminEntitySection>
          </CascadeItem>
        </CascadeReveal>
      </CrudScrollPageLayout>

      <CategoryFormModal open={editCategoryOpen} onOpenChange={setEditCategoryOpen} category={category} />
      <ContentFormModal
        open={contentModal.open}
        onOpenChange={(open) => setContentModal({ open, content: open ? contentModal.content : null })}
        categoryId={id!}
        content={contentModal.content}
      />
      <WeeklyPlanFormModal
        open={planModal.open}
        onOpenChange={(open) => setPlanModal({ open, plan: open ? planModal.plan : null })}
        plan={planModal.plan}
      />
      <WeeklyPlanDaysModal
        open={planDaysModal.open}
        onOpenChange={(open) => setPlanDaysModal({ open, plan: open ? planDaysModal.plan : null })}
        plan={planDaysModal.plan}
        categoryId={id!}
      />

      <DeleteConfirmDialog
        open={Boolean(deleteContentTarget)}
        onOpenChange={(open) => !open && setDeleteContentTarget(null)}
        description="Este conteúdo será excluído permanentemente."
        isDeleting={deleteContentMutation.isPending}
        onConfirm={() => deleteContentTarget && deleteContentMutation.mutate(deleteContentTarget.id)}
      />
      <DeleteConfirmDialog
        open={Boolean(deletePlanTarget)}
        onOpenChange={(open) => !open && setDeletePlanTarget(null)}
        description="Este plano semanal será excluído."
        isDeleting={deletePlanMutation.isPending}
        onConfirm={() => deletePlanTarget && deletePlanMutation.mutate(deletePlanTarget.id)}
      />
    </>
  )
}
