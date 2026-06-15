import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { EntityListPage } from '@/components/crud/EntityListPage'
import { academyAdminKeys, listAdminEnrollments } from '@/services/academyAdmin'
import { formatDateTime } from '@/lib/formatters'
import { EnrollmentDetailModal } from './components/EnrollmentDetailModal'

export function AcademyEnrollmentsPage() {
  const [detailId, setDetailId] = useState<string | null>(null)
  const [allEnrollments, setAllEnrollments] = useState<Array<Record<string, unknown> & { id: string }>>([])

  const stats = useMemo(
    () => [
      { label: 'Total', value: allEnrollments.length, footer: 'Matrículas' },
      { label: 'Em progresso', value: allEnrollments.filter((r) => r.status === 'in_progress').length },
      { label: 'Concluídas', value: allEnrollments.filter((r) => r.status === 'completed').length },
      { label: 'Não iniciadas', value: allEnrollments.filter((r) => r.status === 'not_started').length },
    ],
    [allEnrollments],
  )

  return (
    <>
      <EntityListPage
        title="Matrículas Academy"
        description="Progresso dos profissionais parceiros"
        queryKey={academyAdminKeys.enrollments}
        queryFn={async () => {
          const data = await listAdminEnrollments()
          setAllEnrollments(data as Array<Record<string, unknown> & { id: string }>)
          return { data: data as Array<Record<string, unknown> & { id: string }>, count: data.length }
        }}
        stats={stats}
        statsColumns={4}
        onRowClick={(r) => setDetailId(r.id)}
        columns={[
          {
            key: 'pp',
            header: 'Profissional',
            mobilePrimary: true,
            cell: (r) => String((r.professionals as { full_name?: string } | null)?.full_name ?? '—'),
          },
          {
            key: 'course',
            header: 'Curso',
            cell: (r) => String((r.academy_courses as { title?: string } | null)?.title ?? '—'),
          },
          {
            key: 'status',
            header: 'Status',
            cell: (r) => (
              <Badge variant={r.status === 'completed' ? 'default' : 'muted'}>{String(r.status)}</Badge>
            ),
          },
          {
            key: 'enrolled',
            header: 'Matriculado em',
            cell: (r) => formatDateTime(String(r.enrolled_at)),
          },
        ]}
      />

      <EnrollmentDetailModal
        open={Boolean(detailId)}
        onOpenChange={(open) => !open && setDetailId(null)}
        enrollmentId={detailId}
      />
    </>
  )
}
