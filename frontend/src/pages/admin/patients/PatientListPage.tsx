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
import { useSetPatientsActive } from '@/hooks/mutations/usePatientMutations'
import { formatCpf, formatDate } from '@/lib/formatters'
import { exportToCsv } from '@/lib/exportCsv'
import { careStatusLabels } from '@/constants/labels'
import { Button } from '@/components/ui/button'
import { AdminImportDialog } from '@/components/admin/import/AdminImportDialog'
import {
  bulkImportHistoricalEvolutions,
  bulkImportPatientLinks,
  bulkImportPatients,
  EVOLUTION_IMPORT_TEMPLATE,
  PATIENT_IMPORT_TEMPLATE,
  PATIENT_LINK_IMPORT_TEMPLATE,
} from '@/services/bulkImport'
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

function StatusCell({ status, accountActive = true }: { status: string; accountActive?: boolean }) {
  if (!accountActive) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-muted-foreground">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
        Inativo
      </span>
    )
  }

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
  const [activeChange, setActiveChange] = useState<{ ids: string[]; activate: boolean } | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [linkImportOpen, setLinkImportOpen] = useState(false)
  const [evolutionImportOpen, setEvolutionImportOpen] = useState(false)

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
  const setPatientsActive = useSetPatientsActive()

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

  const requestActiveChange = (rows: PatientListItem[]) => {
    if (rows.length === 0) return
    const activate = rows.every((row) => row.is_active === false)
    setActiveChange({ ids: rows.map((row) => row.id), activate })
  }

  const confirmActiveChange = async () => {
    if (!activeChange) return
    try {
      await setPatientsActive.mutateAsync({ ids: activeChange.ids, isActive: activeChange.activate })
      setSelectedIds(new Set())
      setActiveChange(null)
    } catch {
      // O aviso de erro já é exibido pela mutação.
    }
  }

  const rowActions = [
    { label: 'Ver detalhe', onClick: (r: PatientListItem) => setPreviewId(r.id) },
    { label: 'Editar', onClick: (r: PatientListItem) => navigate(`/admin/pacientes/${r.id}/editar`) },
    { label: 'Ativar/Inativar', onClick: (r: PatientListItem) => requestActiveChange([r]) },
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
                onImport={() => setImportOpen(true)}
                importDisabled={false}
                onExport={handleExport}
                onRefresh={() => refetch()}
                onSettings={() => toast.info('Configurações em breve')}
                isRefreshing={isFetching}
              />
              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setLinkImportOpen(true)}>
                  Importar vínculo paciente–PP
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setEvolutionImportOpen(true)}>
                  Importar evoluções históricas
                </Button>
              </div>
            </CascadeItem>

            <CascadeItem>
              <SelectionBar
                count={selectedIds.size}
                onClear={() => setSelectedIds(new Set())}
                onEdit={handleBulkEdit}
                onToggleActive={() => requestActiveChange(patients.filter((patient) => selectedIds.has(patient.id)))}
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
                      cell: (r) => <StatusCell status={r.care_status} accountActive={r.is_active !== false} />,
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
                      key: 'professional',
                      header: 'Profissional',
                      cell: (r) => <span className="text-sm">{r.professionals?.full_name ?? '—'}</span>,
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

    <PageFooter
      loading={isInitialLoad}
      contentKey={`${page}-${pageSize}-${listTotal}-${isInitialLoad}`}
    >
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
        open={activeChange != null}
        onOpenChange={(open) => !open && setActiveChange(null)}
        title={
          activeChange?.activate
            ? activeChange.ids.length === 1 ? 'Ativar paciente' : 'Ativar pacientes'
            : activeChange?.ids.length === 1 ? 'Inativar paciente' : 'Inativar pacientes'
        }
        description={
          activeChange?.activate
            ? activeChange.ids.length === 1
              ? 'Ativar o paciente selecionado?'
              : `Ativar ${activeChange.ids.length} pacientes?`
            : activeChange?.ids.length === 1
              ? 'Inativar o paciente selecionado? O cadastro permanece na lista.'
              : `Inativar ${activeChange?.ids.length ?? 0} pacientes? O cadastro permanece na lista.`
        }
        confirmLabel={activeChange?.activate ? 'Ativar' : 'Inativar'}
        pendingLabel={activeChange?.activate ? 'Ativando...' : 'Inativando...'}
        destructive={false}
        isDeleting={setPatientsActive.isPending}
        onConfirm={() => void confirmActiveChange()}
      />

      <AdminImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Importar pacientes"
        description="Importação de pacientes legados via CSV ou XLSX. Campos obrigatórios: full_name."
        templateCsv={PATIENT_IMPORT_TEMPLATE}
        templateFilename="modelo_importacao_pacientes.csv"
        importKind="patients"
        importFn={bulkImportPatients}
        onSuccess={() => void refetch()}
      />

      <AdminImportDialog
        open={linkImportOpen}
        onOpenChange={setLinkImportOpen}
        title="Importar vínculo paciente–PP"
        description="Colunas: cpf_paciente e cpf_pp. Define o profissional responsável na ficha do paciente."
        templateCsv={PATIENT_LINK_IMPORT_TEMPLATE}
        templateFilename="modelo_vinculo_paciente_pp.csv"
        importKind="patient_links"
        importFn={bulkImportPatientLinks}
        onSuccess={() => void refetch()}
      />

      <AdminImportDialog
        open={evolutionImportOpen}
        onOpenChange={setEvolutionImportOpen}
        title="Importar evoluções históricas"
        description="Colunas: cpf_paciente, data, texto, cpf_profissional e numero_ciclo. O paciente permanece nesse número de ciclo."
        templateCsv={EVOLUTION_IMPORT_TEMPLATE}
        templateFilename="modelo_evolucoes_historicas.csv"
        importKind="evolutions"
        importFn={bulkImportHistoricalEvolutions}
        onSuccess={() => void refetch()}
      />
    </>
  )
}
