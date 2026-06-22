import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EntityListPage } from '@/components/crud/EntityListPage'
import { TreatmentPausesFilterPanel } from '@/components/crud/list-page/TreatmentPausesFilterPanel'
import type { DataTableColumn } from '@/components/crud/DataTable'
import { Badge } from '@/components/ui/badge'
import { buildTreatmentPauseStatCards } from '@/lib/treatmentPausesListStats'
import {
  formatPauseDuration,
  getTreatmentPauseSearchText,
  getTreatmentPauseStatusLabel,
  isTreatmentPauseActive,
  type TreatmentPauseListRow,
} from '@/lib/treatmentPausesDisplay'
import { formatDateTime } from '@/lib/formatters'
import {
  countActiveTreatmentPausesFilters,
  emptyTreatmentPausesFilters,
  matchesTreatmentPausesFilters,
  type TreatmentPausesListFilters,
} from '@/lib/treatmentPausesFilters'
import { treatmentPausesService } from '@/services/index'
import { cn } from '@/lib/utils'

const PAUSES_SELECT = `
  id, patient_id, paused_at, resumed_at, reason, created_at, created_by,
  patients ( full_name, care_status ),
  creator:profiles!treatment_pauses_created_by_fkey ( full_name )
`

const columns: DataTableColumn<TreatmentPauseListRow>[] = [
  {
    key: 'patient',
    header: 'Paciente',
    mobilePrimary: true,
    cell: (r) => {
      const patient = r.patients as { full_name?: string } | null
      return <span className="font-medium">{patient?.full_name ?? '—'}</span>
    },
  },
  {
    key: 'reason',
    header: 'Motivo',
    cell: (r) => r.reason?.trim() || '—',
  },
  {
    key: 'status',
    header: 'Status',
    mobileBadge: true,
    cell: (r) => {
      const active = isTreatmentPauseActive(r)
      return (
        <Badge
          variant="outline"
          className={cn(
            'font-normal',
            active
              ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20'
              : 'bg-primary/10 text-primary border-primary/20',
          )}
        >
          {getTreatmentPauseStatusLabel(r)}
        </Badge>
      )
    },
  },
  {
    key: 'start',
    header: 'Início',
    mobileMeta: true,
    cell: (r) => formatDateTime(String(r.paused_at)),
  },
  {
    key: 'end',
    header: 'Retorno',
    mobileHidden: true,
    cell: (r) => (r.resumed_at ? formatDateTime(String(r.resumed_at)) : '—'),
  },
  {
    key: 'duration',
    header: 'Duração',
    mobileHidden: true,
    cell: (r) => formatPauseDuration(String(r.paused_at), r.resumed_at as string | null | undefined),
  },
  {
    key: 'creator',
    header: 'Registrado por',
    mobileHidden: true,
    cell: (r) => {
      const creator = r.creator as { full_name?: string } | null
      return creator?.full_name ?? '—'
    },
  },
]

export function TreatmentPausesListPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<TreatmentPausesListFilters>(emptyTreatmentPausesFilters)
  const [filterOpen, setFilterOpen] = useState(false)

  const activeFilterCount = countActiveTreatmentPausesFilters(filters)
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters])

  const rowFilter = useMemo(
    () => (row: TreatmentPauseListRow) => matchesTreatmentPausesFilters(row, filters),
    [filters],
  )

  const buildStats = useMemo(
    () => (_rows: TreatmentPauseListRow[], filteredRows: TreatmentPauseListRow[]) =>
      buildTreatmentPauseStatCards(filteredRows),
    [],
  )

  return (
    <>
      <EntityListPage
        title="Pausas de tratamento"
        description="Suspensões temporárias sem apagar histórico"
        queryKey={['treatment_pauses']}
        queryFn={() =>
          treatmentPausesService.list(PAUSES_SELECT, {
            column: 'paused_at',
            ascending: false,
          }) as Promise<{ data: TreatmentPauseListRow[]; count: number }>
        }
        onRowClick={(r) => navigate(`/admin/pausas/${r.id}`)}
        columns={columns}
        buildStats={buildStats}
        getSearchText={getTreatmentPauseSearchText}
        searchPlaceholder="Pesquisar por paciente, motivo ou responsável..."
        rowFilter={rowFilter}
        filterResetKey={filtersKey}
        onOpenFilters={() => setFilterOpen(true)}
        activeFilterCount={activeFilterCount}
        onClearFilters={() => setFilters(emptyTreatmentPausesFilters)}
        exportFileName="pausas-tratamento"
      />
      <TreatmentPausesFilterPanel
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onApply={setFilters}
      />
    </>
  )
}
