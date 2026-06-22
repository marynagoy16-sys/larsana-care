import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EntityListPage } from '@/components/crud/EntityListPage'
import { MedicalRecordsFilterPanel } from '@/components/crud/list-page/MedicalRecordsFilterPanel'
import type { DataTableColumn } from '@/components/crud/DataTable'
import { buildMedicalRecordsStatCards } from '@/lib/medicalRecordsListStats'
import {
  countActiveMedicalRecordsFilters,
  emptyMedicalRecordsFilters,
  getMedicalRecordSearchText,
  matchesMedicalRecordsFilters,
  type MedicalRecordListRow,
  type MedicalRecordsListFilters,
} from '@/lib/medicalRecordsFilters'
import { formatDateTime } from '@/lib/formatters'
import { medicalRecordTypeLabels } from '@/constants/labels'
import { medicalRecordsService } from '@/services/index'

const MEDICAL_RECORDS_SELECT = `
  id, record_type, created_at, recorded_at, patient_id, professional_id,
  session_id, cycle_id, content_richtext, definitive_deadline_at, alert_24h_triggered,
  patients ( full_name, region_id ),
  professionals ( full_name )
`

const columns: DataTableColumn<MedicalRecordListRow>[] = [
  {
    key: 'patient',
    header: 'Paciente',
    mobilePrimary: true,
    cell: (r) => {
      const patient = r.patients as { full_name?: string } | null
      return patient?.full_name ?? '—'
    },
  },
  {
    key: 'professional',
    header: 'Profissional',
    mobileHidden: true,
    cell: (r) => {
      const pro = r.professionals as { full_name?: string } | null
      return pro?.full_name ?? '—'
    },
  },
  {
    key: 'type',
    header: 'Tipo',
    mobileBadge: true,
    cell: (r) => medicalRecordTypeLabels[String(r.record_type)] ?? String(r.record_type),
  },
  {
    key: 'date',
    header: 'Registrado em',
    mobileMeta: true,
    cell: (r) => formatDateTime(String(r.recorded_at ?? r.created_at)),
  },
]

export function MedicalRecordsListPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<MedicalRecordsListFilters>(emptyMedicalRecordsFilters)
  const [filterOpen, setFilterOpen] = useState(false)

  const activeFilterCount = countActiveMedicalRecordsFilters(filters)
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters])

  const rowFilter = useMemo(
    () => (row: MedicalRecordListRow) => matchesMedicalRecordsFilters(row, filters),
    [filters],
  )

  const buildStats = useMemo(
    () => (_rows: MedicalRecordListRow[], filteredRows: MedicalRecordListRow[]) =>
      buildMedicalRecordsStatCards(filteredRows),
    [],
  )

  return (
    <>
      <EntityListPage
        title="Prontuários"
        description="Painel de conformidade CREFITO"
        queryKey={['medical_records']}
        queryFn={() =>
          medicalRecordsService.list(MEDICAL_RECORDS_SELECT, {
            column: 'recorded_at',
            ascending: false,
          }) as Promise<{ data: MedicalRecordListRow[]; count: number }>
        }
        onRowClick={(r) => navigate(`/admin/prontuarios/${r.id}`)}
        columns={columns}
        buildStats={buildStats}
        getSearchText={getMedicalRecordSearchText}
        searchPlaceholder="Pesquisar por paciente, profissional ou conteúdo..."
        rowFilter={rowFilter}
        filterResetKey={filtersKey}
        onOpenFilters={() => setFilterOpen(true)}
        activeFilterCount={activeFilterCount}
        onClearFilters={() => setFilters(emptyMedicalRecordsFilters)}
        exportFileName="prontuarios"
      />
      <MedicalRecordsFilterPanel
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onApply={setFilters}
      />
    </>
  )
}
