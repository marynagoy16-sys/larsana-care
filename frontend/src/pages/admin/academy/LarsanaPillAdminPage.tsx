import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EntityListPage } from '@/components/crud/EntityListPage'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  deleteCategory,
  larsanapillAdminKeys,
  listAdminCategories,
} from '@/services/academyAdmin'
import type { LarsanaPillCategory } from '@/types/academy'
import { CategoryFormModal } from './components/CategoryFormModal'

export function LarsanaPillAdminPage() {
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)
  const [editCategory, setEditCategory] = useState<LarsanaPillCategory | null>(null)
  const [allCategories, setAllCategories] = useState<LarsanaPillCategory[]>([])

  const stats = useMemo(
    () => [
      { label: 'Total', value: allCategories.length, footer: 'Categorias PHIL' },
      { label: 'Publicadas', value: allCategories.filter((r) => r.is_published).length },
      { label: 'Rascunhos', value: allCategories.filter((r) => !r.is_published).length },
      { label: 'Códigos', value: new Set(allCategories.map((r) => r.code)).size },
    ],
    [allCategories],
  )

  return (
    <>
      <PageHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap min-w-0 flex-1">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" className="rounded-xl shrink-0" onClick={() => navigate('/admin/academy')} aria-label="Voltar">
              <ArrowLeft size={20} />
            </Button>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-xl lg:text-2xl leading-tight tracking-tight">
                LarsanaPill (PHIL)
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">Categorias e conteúdos para pacientes</p>
            </div>
          </div>
        </div>
      </PageHeader>

      <EntityListPage
        title="Categorias"
        description="Gerencie as trilhas P1–P6"
        queryKey={larsanapillAdminKeys.categories}
        queryFn={async () => {
          const data = await listAdminCategories()
          setAllCategories(data)
          return { data: data as unknown as Array<Record<string, unknown> & { id: string }>, count: data.length }
        }}
        stats={stats}
        statsColumns={4}
        showStats
        onCreate={() => setCreateOpen(true)}
        createLabel="Nova categoria"
        onRowClick={(r) => navigate(`/admin/larsanapill/categorias/${r.id}`)}
        canDelete
        onDelete={deleteCategory}
        columns={[
          { key: 'code', header: 'Código', cell: (r) => String(r.code) },
          { key: 'title', header: 'Categoria', mobilePrimary: true, cell: (r) => String(r.title) },
          {
            key: 'published',
            header: 'Status',
            cell: (r) => (
              <Badge variant={r.is_published ? 'default' : 'muted'}>
                {r.is_published ? 'Publicado' : 'Rascunho'}
              </Badge>
            ),
          },
          {
            key: 'edit',
            header: '',
            className: 'w-16',
            mobileHidden: true,
            cell: (r) => (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setEditCategory(r as unknown as LarsanaPillCategory)
                }}
              >
                Editar
              </Button>
            ),
          },
        ]}
      />

      <CategoryFormModal open={createOpen} onOpenChange={setCreateOpen} />
      <CategoryFormModal
        open={Boolean(editCategory)}
        onOpenChange={(open) => !open && setEditCategory(null)}
        category={editCategory}
      />
    </>
  )
}
