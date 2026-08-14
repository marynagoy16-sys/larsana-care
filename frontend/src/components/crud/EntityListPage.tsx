import { useMemo, useState, useEffect, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
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
  beforeTable?: ReactNode
  searchable?: boolean
  searchPlaceholder?: string
  headerExtra?: ReactNode
  stats?: StatCardItem[]
  showStats?: boolean
  showToolbar?: boolean
  statsColumns?: 2 | 3 | 4
  pageSizeDefault?: number
  emptyMessage?: string
  emptyIcon?: LucideIcon
  exportFileName?: string
  mobileVariant?: 'default' | 'compact'
  mobileFlush?: boolean
  mobileGrouped?: boolean
  getMobileAvatarLabel?: (row: T) => string
  getMobileTags?: (row: T) => ReactNode
  showPagination?: boolean
  rowFilter?: (row: T) => boolean
  filterResetKey?: string
  getSearchText?: (row: T) => string
  onOpenFilters?: () => void
  activeFilterCount?: number
  onClearFilters?: () => void
  buildStats?: (rows: T[], filteredRows: T[]) => StatCardItem[]
  layoutClassName?: string
  tableSectionClassName?: string
  splitScrollOnMobile?: boolean
}

function filterRows<T extends Record<string, unknown>>(
  rows: T[],
  query: string,
  getSearchText?: (row: T) => string,
) {
  const q = query.trim().toLowerCase()
  if (!q) return rows
  return rows.filter((row) => {
    const haystack = getSearchText
      ? getSearchText(row)
      : Object.values(row).map((value) => String(value ?? '')).join(' ')
    return haystack.toLowerCase().includes(q)
  })
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
  beforeTable,
  searchable = true,
  searchPlaceholder,
  headerExtra,
  stats,
  showStats = true,
  showToolbar = true,
  statsColumns = 4,
  pageSizeDefault = 10,
  emptyMessage,
  emptyIcon,
  exportFileName,
  mobileVariant,
  mobileFlush,
  mobileGrouped,
  getMobileAvatarLabel,
  getMobileTags,
  showPagination = true,
  rowFilter,
  filterResetKey,
  getSearchText,
  onOpenFilters,
  activeFilterCount = 0,
  onClearFilters,
  buildStats,
  layoutClassName,
  tableSectionClassName,
  splitScrollOnMobile = false,
}: EntityListPageProps<T>) {
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(pageSizeDefault)

  useEffect(() => {
    if (filterResetKey !== undefined) setPage(0)
  }, [filterResetKey])

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
    const searched = searchable ? filterRows(allRows, search, getSearchText) : allRows
    return rowFilter ? searched.filter(rowFilter) : searched
  }, [allRows, search, searchable, rowFilter, getSearchText])

  const listTotal = filteredRows.length
  const pageData = showPagination
    ? filteredRows.slice(page * pageSize, (page + 1) * pageSize)
    : filteredRows
  const isInitialLoad = isLoading && !data
  const isTableRefreshing = isFetching && !isLoading

  const statCards = useMemo(() => {
    if (buildStats) return buildStats(allRows, filteredRows)
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
  }, [buildStats, stats, showStats, allRows, filteredRows, title, description, search, page, pageSize, pageData.length])

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
    <CrudListPageLayout
      className={cn(
        splitScrollOnMobile && 'flex flex-1 flex-col min-h-0 max-lg:h-full max-lg:overflow-hidden',
      )}
    >
      {isInitialLoad ? (
        <CrudListPageSkeleton
          showStats={showStats}
          statsCount={statsColumns}
          tableColumns={columns.length}
          toolbarActions={onCreate ? 4 : 3}
        />
      ) : (
        <CascadeReveal
          className={cn(
            'space-y-4',
            splitScrollOnMobile && 'flex flex-1 flex-col min-h-0 max-lg:space-y-0 max-lg:overflow-hidden',
            layoutClassName,
          )}
        >
          {showStats && statCards.length > 0 && (
            <CascadeItem>
              <StatsCardRow cards={statCards} columns={statsColumns} isLoading={isLoading} />
            </CascadeItem>
          )}

          {(toolbar != null || showToolbar) && (
            <CascadeItem className="overflow-visible">
              {toolbar ?? (
                <ListToolbar
                  search={searchable ? search : undefined}
                  onSearchChange={searchable ? (v) => { setSearch(v); setPage(0) } : undefined}
                  searchPlaceholder={searchPlaceholder ?? `Pesquisar em ${title.toLowerCase()}...`}
                  onOpenFilters={onOpenFilters}
                  activeFilterCount={activeFilterCount}
                  onClearFilters={onClearFilters}
                  onExport={handleExport}
                  onRefresh={() => refetch()}
                  onAdd={onCreate}
                  addLabel={createLabel}
                  isRefreshing={isFetching}
                  trailing={headerExtra}
                />
              )}
            </CascadeItem>
          )}

          {beforeTable ? (
            <CascadeItem className={cn(splitScrollOnMobile && 'shrink-0')}>{beforeTable}</CascadeItem>
          ) : null}

          <CascadeItem
            className={cn(splitScrollOnMobile && 'flex min-h-0 flex-1 flex-col overflow-hidden max-lg:min-h-0')}
          >
            <div
              className={cn(
                'transition-opacity duration-300',
                isTableRefreshing && 'opacity-50 pointer-events-none',
                tableSectionClassName,
                splitScrollOnMobile &&
                  'min-h-0 flex-1 overflow-y-auto scrollbar-sidebar max-lg:pb-2',
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
                emptyIcon={emptyIcon}
                mobileVariant={mobileVariant}
                mobileFlush={mobileFlush}
                mobileGrouped={mobileGrouped}
                getMobileAvatarLabel={getMobileAvatarLabel}
                getMobileTags={getMobileTags}
              />
            </div>
          </CascadeItem>
        </CascadeReveal>
      )}

    </CrudListPageLayout>

    {showPagination && (
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
    )}

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
