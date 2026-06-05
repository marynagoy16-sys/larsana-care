export {
  MetricCardSkeleton,
  ToolbarSkeleton,
  PaginationSkeleton,
  CrudTableSkeleton as PatientTableSkeleton,
} from '@/components/crud/list-page/CrudListSkeleton'

import {
  MetricCardSkeleton,
  ToolbarSkeleton,
  CrudTableSkeleton,
} from '@/components/crud/list-page/CrudListSkeleton'

export function PatientListSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Carregando pacientes">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
      <ToolbarSkeleton actions={5} />
      <CrudTableSkeleton variant="rich" />
    </div>
  )
}
