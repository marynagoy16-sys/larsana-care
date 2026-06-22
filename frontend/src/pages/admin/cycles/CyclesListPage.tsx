import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EntityListPage } from '@/components/crud/EntityListPage'
import { CareCyclesFilterPanel } from '@/components/crud/list-page/CareCyclesFilterPanel'
import type { DataTableColumn } from '@/components/crud/DataTable'
import { CycleSessionsProgress } from '@/components/cycles/CycleSessionsProgress'
import { buildCareCyclesStatCards } from '@/lib/careCyclesListStats'
import {
  countActiveCareCyclesFilters,
  emptyCareCyclesFilters,
  getCareCycleSearchText,
  matchesCareCyclesFilters,
  type CareCyclesListFilters,
} from '@/lib/careCyclesFilters'
import { cycleStatusLabels, paymentStatusLabels } from '@/constants/labels'
import { listCareCycles, type CycleListItem } from '@/services/cycles'

const columns: DataTableColumn<CycleListItem>[] = [
  {
    key: 'cycle',
    header: 'Ciclo',
    cell: (r) => `#${String(r.cycle_number)}`,
  },
  {
    key: 'patient',
    header: 'Paciente',
    mobilePrimary: true,
    cell: (r) => <span className="font-medium">{r.patient_name}</span>,
  },
  {
    key: 'professional',
    header: 'Profissional',
    mobileHidden: true,
    cell: (r) => r.professional_name,
  },
  {
    key: 'sessions',
    header: 'Sessões',
    cell: (r) => (
      <CycleSessionsProgress done={r.completed_sessions} total={Number(r.session_count)} />
    ),
  },
  {
    key: 'status',
    header: 'Status',
    mobileBadge: true,
    cell: (r) => cycleStatusLabels[String(r.status)] ?? String(r.status),
  },
  {
    key: 'payment',
    header: 'Pagamento',
    mobileMeta: true,
    cell: (r) => paymentStatusLabels[String(r.payment_status)] ?? String(r.payment_status),
  },
]

export function CyclesListPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<CareCyclesListFilters>(emptyCareCyclesFilters)
  const [filterOpen, setFilterOpen] = useState(false)

  const activeFilterCount = countActiveCareCyclesFilters(filters)
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters])

  const rowFilter = useMemo(
    () => (row: CycleListItem) => matchesCareCyclesFilters(row, filters),
    [filters],
  )

  const buildStats = useMemo(
    () => (_rows: CycleListItem[], filteredRows: CycleListItem[]) =>
      buildCareCyclesStatCards(filteredRows),
    [],
  )

  return (
    <>
      <EntityListPage
        title="Ciclos de tratamento"
        description="Acompanhamento operacional e financeiro"
        queryKey={['care_cycles']}
        queryFn={() => listCareCycles()}
        onRowClick={(r) => navigate(`/admin/ciclos/${r.id}`)}
        columns={columns}
        buildStats={buildStats}
        getSearchText={getCareCycleSearchText}
        searchPlaceholder="Pesquisar por paciente, profissional ou ciclo..."
        rowFilter={rowFilter}
        filterResetKey={filtersKey}
        onOpenFilters={() => setFilterOpen(true)}
        activeFilterCount={activeFilterCount}
        onClearFilters={() => setFilters(emptyCareCyclesFilters)}
        exportFileName="ciclos-tratamento"
      />
      <CareCyclesFilterPanel
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onApply={setFilters}
      />
    </>
  )
}
