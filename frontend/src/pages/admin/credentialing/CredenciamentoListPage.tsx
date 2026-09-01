import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { EntityListPage } from '@/components/crud/EntityListPage'
import { AdminImportDialog } from '@/components/admin/import/AdminImportDialog'
import { CredentialingFilterPanel } from '@/components/crud/list-page/CredentialingFilterPanel'
import type { DataTableColumn } from '@/components/crud/DataTable'
import { Badge } from '@/components/ui/badge'
import { buildCredentialingStatCards } from '@/lib/credentialingListStats'
import {
  countActiveCredentialingFilters,
  emptyCredentialingFilters,
  matchesCredentialingFilters,
  type CredentialingListFilters,
} from '@/lib/credentialingFilters'
import { formatCpf, formatDateTime } from '@/lib/formatters'
import {
  councilTypeLabels,
  credentialingStatusLabels,
  ppClassLabels,
  professionTypeLabels,
} from '@/constants/labels'
import {
  adminCredentialingQueryKeys,
  listCredentialingProfessionals,
  type CredentialingListItem,
} from '@/services/adminCredentialing'
import {
  bulkImportProfessionals,
  PROFESSIONAL_IMPORT_TEMPLATE,
} from '@/services/bulkImport'
import { cn } from '@/lib/utils'

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'ativo':
      return 'bg-primary/10 text-primary border-primary/20'
    case 'aguardando_aprovacao':
      return 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20'
    case 'rascunho':
    case 'documentos_pendentes':
    case 'termos_pendentes':
    case 'contrato_pendente':
      return 'bg-sky-500/10 text-sky-800 dark:text-sky-300 border-sky-500/20'
    case 'inativo':
    case 'descredenciado':
      return 'bg-muted text-muted-foreground border-border'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

const columns: DataTableColumn<CredentialingListItem>[] = [
  {
    key: 'name',
    header: 'Profissional',
    mobilePrimary: true,
    cell: (r) => <span className="font-medium">{r.full_name}</span>,
  },
  {
    key: 'profession',
    header: 'Profissão',
    cell: (r) => professionTypeLabels[r.profession] ?? r.profession,
  },
  {
    key: 'class',
    header: 'Classe',
    cell: (r) => ppClassLabels[r.pp_class] ?? r.pp_class,
  },
  {
    key: 'cpf',
    header: 'CPF/CNPJ',
    mobileHidden: true,
    cell: (r) => (r.cpf_cnpj ? formatCpf(r.cpf_cnpj) : '—'),
  },
  {
    key: 'council',
    header: 'Conselho',
    mobileHidden: true,
    cell: (r) => {
      if (!r.council_registration) return '—'
      const label = r.council_type ? councilTypeLabels[r.council_type] ?? r.council_type : ''
      return label ? `${label} ${r.council_registration}` : r.council_registration
    },
  },
  {
    key: 'status',
    header: 'Status',
    mobileBadge: true,
    cell: (r) => (
      <Badge variant="outline" className={cn('font-normal', statusBadgeClass(r.credentialing_status))}>
        {credentialingStatusLabels[r.credentialing_status] ?? r.credentialing_status}
      </Badge>
    ),
  },
  {
    key: 'updated',
    header: 'Atualizado',
    mobileMeta: true,
    cell: (r) => formatDateTime(r.updated_at),
  },
]

export function CredenciamentoListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<CredentialingListFilters>(emptyCredentialingFilters)
  const [filterOpen, setFilterOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const activeFilterCount = countActiveCredentialingFilters(filters)
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters])

  const rowFilter = useMemo(
    () => (row: CredentialingListItem) => matchesCredentialingFilters(row, filters),
    [filters],
  )

  const buildStats = useMemo(
    () => (_rows: CredentialingListItem[], filteredRows: CredentialingListItem[]) =>
      buildCredentialingStatCards(filteredRows),
    [],
  )

  return (
    <>
      <EntityListPage
        title="Profissionais"
        description="Parceiros credenciados e fila de onboarding"
        queryKey={adminCredentialingQueryKeys.list}
        queryFn={() => listCredentialingProfessionals()}
        onRowClick={(r) => navigate(`/admin/profissionais/${r.id}`)}
        columns={columns}
        buildStats={buildStats}
        searchPlaceholder="Pesquisar por nome, e-mail ou CPF..."
        rowFilter={rowFilter}
        filterResetKey={filtersKey}
        onOpenFilters={() => setFilterOpen(true)}
        activeFilterCount={activeFilterCount}
        onClearFilters={() => setFilters(emptyCredentialingFilters)}
        onImport={() => setImportOpen(true)}
        importDisabled={false}
      />
      <CredentialingFilterPanel
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onApply={setFilters}
      />
      <AdminImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Importar profissionais"
        description="Importação de PPs legados via CSV ou XLSX. Preencha asaas_wallet_id quando houver carteira Asaas."
        templateCsv={PROFESSIONAL_IMPORT_TEMPLATE}
        templateFilename="modelo_importacao_profissionais.csv"
        importKind="professionals"
        importFn={bulkImportProfessionals}
        onSuccess={() => void queryClient.invalidateQueries({ queryKey: adminCredentialingQueryKeys.list })}
      />
    </>
  )
}
