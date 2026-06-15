import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EntityListPage } from '@/components/crud/EntityListPage'
import {
  academyAdminKeys,
  deleteCourse,
  listAdminCourses,
} from '@/services/academyAdmin'
import type { AcademyCourse } from '@/types/academy'
import { CourseFormModal } from './components/CourseFormModal'

export function AcademyCoursesPage() {
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)
  const [editCourse, setEditCourse] = useState<AcademyCourse | null>(null)

  const statsFn = (rows: AcademyCourse[]) => [
    { label: 'Total', value: rows.length, footer: 'Cursos cadastrados' },
    { label: 'Publicados', value: rows.filter((r) => r.is_published).length },
    { label: 'Rascunhos', value: rows.filter((r) => !r.is_published).length },
    { label: 'Obrigatórios', value: rows.filter((r) => r.is_mandatory).length },
  ]

  const [allCourses, setAllCourses] = useState<AcademyCourse[]>([])

  const stats = useMemo(() => statsFn(allCourses), [allCourses])

  return (
    <>
      <EntityListPage
        title="Cursos Academy"
        description="Formação PP e trilhas educacionais"
        queryKey={academyAdminKeys.courses}
        queryFn={async () => {
          const data = await listAdminCourses()
          setAllCourses(data)
          return { data: data as unknown as Array<Record<string, unknown> & { id: string }>, count: data.length }
        }}
        stats={stats}
        statsColumns={4}
        onCreate={() => setCreateOpen(true)}
        createLabel="Novo curso"
        onRowClick={(r) => navigate(`/admin/academy/cursos/${r.id}`)}
        canDelete
        onDelete={deleteCourse}
        columns={[
          { key: 'title', header: 'Curso', mobilePrimary: true, cell: (r) => String(r.title) },
          { key: 'audience', header: 'Público', cell: (r) => String(r.audience) },
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
                  setEditCourse(r as unknown as AcademyCourse)
                }}
              >
                Editar
              </Button>
            ),
          },
        ]}
      />

      <CourseFormModal open={createOpen} onOpenChange={setCreateOpen} />
      <CourseFormModal
        open={Boolean(editCourse)}
        onOpenChange={(open) => !open && setEditCourse(null)}
        course={editCourse}
      />
    </>
  )
}
