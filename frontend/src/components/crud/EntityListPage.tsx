import { useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DataTable, type DataTableColumn } from '@/components/crud/DataTable'
import { DeleteConfirmDialog } from '@/components/crud/DeleteConfirmDialog'
import { CrudListPageLayout } from '@/components/crud/list-page/CrudListPageLayout'
import { PageFooter } from '@/components/layout/PageFooter'
import { ListToolbar } from '@/components/crud/list-page/ListToolbar'
import { StatsCardRow, type StatCardItem } from '@/components/crud/list-page/StatsCardRow'
import {
  CrudListPageSkeleton,
  PaginationSkeleton,
} from '@/components/crud/list-page/CrudListSkeleton'
import { TablePagination } from '@/components/crud/list-page/TablePagination'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { useQuery } from '@tanstack/react-query'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import { buildEntityListStats } from '@/lib/buildEntityListStats'
import { exportToCsv } from '@/lib/exportCsv'
import { cn } from '@/lib/utils'

interface EntityListPageProps<T extends Record<string, unknown> & { id: string }> {
  title: string
  description?: string
  queryKey: readonly unknown[]
  queryFn: () => Promise<{ data: T[]; count: number }>
  columns: DataTableColumn<T>[]
  onCreate?: () => void
  createLabel?: string
  onRowClick?: (row: T) => void
  canDelete?: boolean
  onDelete?: (id: string) => Promise<void>
  deleteQueryKey?: readonly unknown[]
  toolbar?: ReactNode
  searchable?: boolean
  searchPlaceholder?: string
  headerExtra?: ReactNode
  stats?: StatCardItem[]
  showStats?: boolean
  statsColumns?: 2 | 3 | 4
  pageSizeDefault?: number
  emptyMessage?: string
  exportFileName?: string
}

function filterRows<T extends Record<string, unknown>>(rows: T[], query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return rows
  return rows.filter((row) =>
    Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(q)),
  )
}

export function EntityListPage<T extends Record<string, unknown> & { id: string }>({
  title,
  description,
  queryKey,
  queryFn,
  columns,
  onCreate,
  createLabel = 'Adicionar',
  onRowClick,
  canDelete,
  onDelete,
  deleteQueryKey,
  toolbar,
  searchable = true,
  searchPlaceholder,
  headerExtra,
  stats,
  showStats = true,
  statsColumns = 4,
  pageSizeDefault = 10,
  emptyMessage,
  exportFileName,
}: EntityListPageProps<T>) {
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(pageSizeDefault)

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey,
    queryFn,
    placeholderData: (previous) => previous,
  })

  const deleteMutation = useCrudMutation({
    mutationFn: (id: string) => onDelete!(id).then(() => id),
    queryKey: deleteQueryKey ?? queryKey,
    successMessage: 'Excluído com sucesso',
    onSuccess: () => setDeleteTarget(null),
  })

  const allRows = data?.data ?? []
  const filteredRows = useMemo(() => {
    return searchable ? filterRows(allRows, search) : allRows
  }, [allRows, search, searchable])

  const listTotal = filteredRows.length
  const pageData = filteredRows.slice(page * pageSize, (page + 1) * pageSize)
  const isInitialLoad = isLoading && !data
  const isTableRefreshing = isFetching && !isLoading

  const statCards = useMemo(() => {
    if (stats) return stats
    if (!showStats) return []
    const cards = buildEntityListStats(allRows, filteredRows, {
      title,
      search,
      page,
      pageSize,
      pageCount: pageData.length,
    })
    if (description && cards.length > 0) {
      return [{ ...cards[0], footer: description }, ...cards.slice(1)]
    }
    return cards
  }, [stats, showStats, allRows, filteredRows, title, description, search, page, pageSize, pageData.length])

  const csvColumns = useMemo(
    () =>
      columns
        .filter((col) => col.key !== 'delete')
        .map((col) => ({
          header: col.header,
          value: (row: T) => {
            const rendered = col.cell(row)
            if (typeof rendered === 'string' || typeof rendered === 'number') return String(rendered)
            const raw = row[col.key]
            return raw != null ? String(raw) : ''
          },
        })),
    [columns],
  )

  const handleExport = () => {
    if (pageData.length === 0) {
      toast.error('Nenhum registro para exportar')
      return
    }
    const slug = exportFileName ?? title.toLowerCase().replace(/\s+/g, '-')
    exportToCsv(`${slug}-pagina-${page + 1}.csv`, pageData, csvColumns)
    toast.success('Exportação da página atual concluída')
  }

  const allColumns = canDelete && onDelete
    ? [
        ...columns,
        {
          key: 'delete',
          header: '',
          className: 'w-12',
          mobileHidden: true,
          cell: (row: T) => (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                setDeleteTarget(row)
              }}
            >
              Excluir
            </Button>
          ),
        } satisfies DataTableColumn<T>,
      ]
    : columns

  const primaryCol = columns.find((c) => c.mobilePrimary) ?? columns[0]

  return (
    <>
    <CrudListPageLayout>
      {isInitialLoad ? (
        <CrudListPageSkeleton
          showStats={showStats}
          statsCount={statsColumns}
          tableColumns={columns.length}
          toolbarActions={onCreate ? 4 : 3}
        />
      ) : (
        <CascadeReveal className="space-y-4">
          {showStats && statCards.length > 0 && (
            <CascadeItem>
              <StatsCardRow cards={statCards} columns={statsColumns} isLoading={isLoading} />
            </CascadeItem>
          )}

          <CascadeItem>
            {toolbar ?? (
              <ListToolbar
                search={searchable ? search : undefined}
                onSearchChange={searchable ? (v) => { setSearch(v); setPage(0) } : undefined}
                searchPlaceholder={searchPlaceholder ?? `Pesquisar em ${title.toLowerCase()}...`}
                onExport={handleExport}
                onRefresh={() => refetch()}
                onAdd={onCreate}
                addLabel={createLabel}
                isRefreshing={isFetching}
                trailing={headerExtra}
              />
            )}
          </CascadeItem>

          <CascadeItem>
            <div
              className={cn(
                'transition-opacity duration-300',
                isTableRefreshing && 'opacity-50 pointer-events-none',
              )}
            >
              <DataTable
                isLoading={isLoading && pageData.length === 0}
                data={pageData}
                getRowKey={(r) => r.id}
                onRowClick={onRowClick}
                columns={allColumns.map((col) => ({
                  ...col,
                  mobilePrimary: col.key === primaryCol?.key,
                }))}
                emptyMessage={emptyMessage}
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
          onPageSizeChange={(size) => { setPageSize(size); setPage(0) }}
          stickyFooter
        />
      )}
    </PageFooter>

      {canDelete && onDelete && (
        <DeleteConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          description="Esta ação não pode ser desfeita."
          isDeleting={deleteMutation.isPending}
          onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        />
      )}
    </>
  )
}
