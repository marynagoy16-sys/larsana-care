import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EntityListPage } from '@/components/crud/EntityListPage'
import { DemandFilterPanel } from '@/components/crud/list-page/DemandFilterPanel'
import { demandListColumns } from '@/components/demands/demandListColumns'
import {
  countActiveDemandFilters,
  emptyDemandFilters,
  matchesDemandFilters,
  type DemandListFilters,
} from '@/lib/demandFilters'
import { demandsService, type DemandListItem } from '@/services/demands'

const DEMANDS_QUERY_KEY = ['demands'] as const

export function DemandsListPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<DemandListFilters>(emptyDemandFilters)
  const [filterOpen, setFilterOpen] = useState(false)

  const activeFilterCount = countActiveDemandFilters(filters)
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters])

  const rowFilter = useMemo(
    () => (row: DemandListItem) => matchesDemandFilters(row, filters),
    [filters],
  )

  return (
    <>
      <EntityListPage
        title="Demandas"
        queryKey={DEMANDS_QUERY_KEY}
        queryFn={() => demandsService.list()}
        onRowClick={(r) => navigate(`/admin/demandas/${r.id}`)}
        columns={demandListColumns}
        rowFilter={rowFilter}
        filterResetKey={filtersKey}
        onOpenFilters={() => setFilterOpen(true)}
        activeFilterCount={activeFilterCount}
        onClearFilters={() => setFilters(emptyDemandFilters)}
      />
      <DemandFilterPanel
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onApply={(next) => {
          setFilters(next)
        }}
      />
    </>
  )
}
