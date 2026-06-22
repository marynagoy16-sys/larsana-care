import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Activity, FileWarning, UserX } from 'lucide-react'
import { toast } from 'sonner'
import { StatsCardRow } from '@/components/crud/list-page/StatsCardRow'
import { ListToolbar } from '@/components/crud/list-page/ListToolbar'
import { SelectionBar } from '@/components/crud/list-page/SelectionBar'
import { SelectableDataTable } from '@/components/crud/list-page/SelectableDataTable'
import { TablePagination } from '@/components/crud/list-page/TablePagination'
import {
  PatientFilterPanel,
  countActiveFilters,
  emptyPatientFilters,
  type PatientListFilters,
} from '@/components/crud/list-page/PatientFilterPanel'
import { DeleteConfirmDialog } from '@/components/crud/DeleteConfirmDialog'
import { PatientPreviewDrawer } from '@/components/patients/PatientPreviewDrawer'
import { PatientListSkeleton } from '@/components/patients/PatientListSkeleton'
import { PaginationSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { CrudListPageLayout } from '@/components/crud/list-page/CrudListPageLayout'
import { PageFooter } from '@/components/layout/PageFooter'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { usePatients, usePatientStats } from '@/hooks/queries/usePatients'
import { useDeletePatient } from '@/hooks/mutations/usePatientMutations'
import { formatCpf, formatDate } from '@/lib/formatters'
import { exportToCsv } from '@/lib/exportCsv'
import { careStatusLabels } from '@/constants/labels'
import type { PatientListItem } from '@/services/patients'
import { cn } from '@/lib/utils'

const CSV_COLUMNS = [
  { header: 'Nome', value: (r: PatientListItem) => r.full_name },
  { header: 'CPF', value: (r: PatientListItem) => r.cpf },
  { header: 'Status', value: (r: PatientListItem) => careStatusLabels[r.care_status] ?? r.care_status },
  { header: 'Cidade', value: (r: PatientListItem) => r.cities?.name },
  { header: 'Região', value: (r: PatientListItem) => r.regions?.code },
  { header: 'Cadastrado em', value: (r: PatientListItem) => formatDate(r.created_at) },
]

function StatusCell({ status }: { status: string }) {
  const isActive = status === 'ATIVO'
  const label = careStatusLabels[status] ?? status

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
        isActive
          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
          : 'bg-destructive/10 text-destructive',
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', isActive ? 'bg-emerald-500' : 'bg-destructive')} />
      {label}
    </span>
  )
}

export function PatientListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<PatientListFilters>(emptyPatientFilters)
  const [sortBy, setSortBy] = useState<'full_name' | 'created_at'>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [filterOpen, setFilterOpen] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [previewId, setPreviewId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(0)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const queryFilters = useMemo(() => ({
    search: debouncedSearch || undefined,
    page,
    pageSize,
    sortBy,
    sortDir,
    care_status: filters.care_status,
    patient_level: filters.patient_level,
    region_id: filters.region_id,
    is_data_complete: filters.is_data_complete,
    sem_pp: filters.sem_pp,
  }), [debouncedSearch, page, pageSize, sortBy, sortDir, filters])

  const { data, isLoading, refetch, isFetching } = usePatients(queryFilters)
  const { data: stats, isLoading: statsLoading } = usePatientStats()
  const deletePatient = useDeletePatient()

  const patients = data?.data ?? []
  const listTotal = data?.count ?? 0
  const activeFilterCount = countActiveFilters(filters)

  const total = stats?.total ?? 0
  const ativos = stats?.ativos ?? 0
  const shareAtivos = total > 0 ? (ativos / total) * 100 : 0

  const isInitialLoad = statsLoading && isLoading
  const isTableRefreshing = isFetching && !isLoading

  const statCards = [
    {
      label: 'Cadastrados',
      value: total,
      icon: Users,
      footer: `${ativos} ativos`,
    },
    {
      label: 'Ativos',
      value: ativos,
      icon: Activity,
      trend: shareAtivos,
      trendLabel: 'do total',
      footer: 'Em tratamento',
      href: '/admin/pacientes',
    },
    {
      label: 'Cadastro incompleto',
      value: stats?.incompletos ?? 0,
      icon: FileWarning,
      footer: 'Dados pendentes',
    },
    {
      label: 'Sem PP alocado',
      value: stats?.sem_pp ?? 0,
      icon: UserX,
      footer: 'Sem profissional',
    },
  ]

  const handleSort = (key: string) => {
    const col = key as 'full_name' | 'created_at'
    if (sortBy === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(col)
      setSortDir('asc')
    }
    setPage(0)
  }

  const handleExport = () => {
    if (patients.length === 0) {
      toast.error('Nenhum registro para exportar')
      return
    }
    exportToCsv(`pacientes-pagina-${page + 1}.csv`, patients, CSV_COLUMNS)
    toast.success('Exportação da página atual concluída')
  }

  const handleDownloadSelected = () => {
    const selected = patients.filter((p) => selectedIds.has(p.id))
    if (selected.length === 0) {
      toast.error('Nenhum item selecionado na página atual')
      return
    }
    exportToCsv('pacientes-selecionados.csv', selected, CSV_COLUMNS)
  }

  const handleBulkEdit = () => {
    if (selectedIds.size !== 1) {
      toast.error('Selecione apenas um paciente para editar')
      return
    }
    navigate(`/admin/pacientes/${[...selectedIds][0]}/editar`)
  }

  const handleBulkDelete = async () => {
    const ids = [...selectedIds]
    for (const id of ids) {
      await deletePatient.mutateAsync(id)
    }
    setSelectedIds(new Set())
    setBulkDeleteOpen(false)
  }

  const rowActions = [
    { label: 'Ver detalhe', onClick: (r: PatientListItem) => setPreviewId(r.id) },
    { label: 'Editar', onClick: (r: PatientListItem) => navigate(`/admin/pacientes/${r.id}/editar`) },
    { label: 'Excluir', variant: 'destructive' as const, onClick: (r: PatientListItem) => {
      setSelectedIds(new Set([r.id]))
      setBulkDeleteOpen(true)
    }},
  ]

  const contentKey = isInitialLoad ? 'skeleton' : 'loaded'

  return (
    <>
    <CrudListPageLayout>
        {isInitialLoad ? (
          <PatientListSkeleton />
        ) : (
          <CascadeReveal key={contentKey} className="space-y-4">
            <CascadeItem>
              <StatsCardRow cards={statCards} columns={4} isLoading={statsLoading} />
            </CascadeItem>

            <CascadeItem>
              <ListToolbar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Pesquisar por nome ou CPF..."
                activeFilterCount={activeFilterCount}
                onOpenFilters={() => setFilterOpen(true)}
                onClearFilters={() => { setFilters(emptyPatientFilters); setPage(0) }}
                onImport={() => toast.info('Importação em breve')}
                onExport={handleExport}
                onRefresh={() => refetch()}
                onSettings={() => toast.info('Configurações em breve')}
                isRefreshing={isFetching}
              />
            </CascadeItem>

            <CascadeItem>
              <SelectionBar
                count={selectedIds.size}
                onClear={() => setSelectedIds(new Set())}
                onEdit={handleBulkEdit}
                onDelete={() => setBulkDeleteOpen(true)}
                onDownload={handleDownloadSelected}
              />
            </CascadeItem>

            <CascadeItem>
              <div
                className={cn(
                  'transition-opacity duration-300',
                  isTableRefreshing && 'opacity-50 pointer-events-none',
                )}
              >
                <SelectableDataTable<PatientListItem>
                  isLoading={isLoading && patients.length === 0}
                  data={patients}
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                  onRowClick={(r) => setPreviewId(r.id)}
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                  rowActions={rowActions}
                  getAvatarLabel={(r) => r.full_name}
                  columns={[
                    {
                      key: 'full_name',
                      header: 'Nome',
                      sortable: true,
                      mobilePrimary: true,
                      cell: (r) => <span className="font-medium">{r.full_name}</span>,
                    },
                    {
                      key: 'status',
                      header: 'Status',
                      mobileBadge: true,
                      cell: (r) => <StatusCell status={r.care_status} />,
                    },
                    {
                      key: 'location',
                      header: 'Localização',
                      mobileSubtitle: true,
                      cell: (r) => (
                        <span className="text-sm">
                          {r.cities?.name ?? '—'}
                          {r.regions?.code && <span> · {r.regions.code}</span>}
                        </span>
                      ),
                    },
                    {
                      key: 'cpf',
                      header: 'CPF',
                      mobileMeta: true,
                      cell: (r) => <span className="text-sm tabular-nums">{formatCpf(r.cpf)}</span>,
                    },
                    {
                      key: 'created_at',
                      header: 'Cadastro',
                      sortable: true,
                      mobileMeta: true,
                      cell: (r) => <span className="text-sm text-muted-foreground">{formatDate(r.created_at)}</span>,
                    },
                    {
                      key: 'notes',
                      header: 'Notas',
                      mobileHidden: true,
                      cell: (r) => (
                        <span className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">
                          {r.clinical_summary?.trim() || 'Nenhuma nota'}
                        </span>
                      ),
                    },
                  ]}
                />
              </div>
            </CascadeItem>
          </CascadeReveal>
        )}
    </CrudListPageLayout>

    <PageFooter loading={isInitialLoad}>
      {isInitialLoad ? (
        <PaginationSkeleton />
      ) : (
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={listTotal}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(0) }}
          stickyFooter
        />
      )}
    </PageFooter>

      <PatientFilterPanel
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onApply={(f) => { setFilters(f); setPage(0) }}
      />

      <PatientPreviewDrawer
        mode="view"
        patientId={previewId}
        open={!!previewId}
        onOpenChange={(open) => !open && setPreviewId(null)}
        onEdit={(id) => { setPreviewId(null); navigate(`/admin/pacientes/${id}/editar`) }}
      />

      <DeleteConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        description={
          selectedIds.size === 1
            ? 'Excluir o paciente selecionado? Esta ação não pode ser desfeita.'
            : `Excluir ${selectedIds.size} pacientes? Esta ação não pode ser desfeita.`
        }
        isDeleting={deletePatient.isPending}
        onConfirm={handleBulkDelete}
      />
    </>
  )
}
