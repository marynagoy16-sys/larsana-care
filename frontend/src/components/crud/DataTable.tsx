import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataTableMobileCards } from '@/components/crud/DataTableMobileCards'
import { CrudEmptyState } from '@/components/crud/CrudEmptyState'
import { CrudTableSkeleton } from '@/components/crud/list-page/CrudListSkeleton'

export interface DataTableColumn<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
  className?: string
  mobilePrimary?: boolean
  mobileSubtitle?: boolean
  mobileBadge?: boolean
  mobileMeta?: boolean
  mobileHidden?: boolean
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: DataTableColumn<T>[]
  data: T[]
  isLoading?: boolean
  emptyMessage?: string
  emptyIcon?: LucideIcon
  onRowClick?: (row: T) => void
  getRowKey: (row: T) => string
  mobileVariant?: 'default' | 'compact'
  mobileFlush?: boolean
  mobileGrouped?: boolean
  getMobileAvatarLabel?: (row: T) => string
  getMobileTags?: (row: T) => ReactNode
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  isLoading,
  emptyMessage = 'Nenhum registro encontrado.',
  emptyIcon,
  onRowClick,
  getRowKey,
  mobileVariant = 'default',
  mobileFlush = false,
  mobileGrouped = false,
  getMobileAvatarLabel,
  getMobileTags,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <CrudTableSkeleton
        columns={columns.length}
        variant={mobileVariant === 'compact' ? 'compact' : 'default'}
        flush={mobileFlush}
        rows={mobileVariant === 'compact' ? 8 : 5}
      />
    )
  }

  if (data.length === 0) {
    return (
      <CrudEmptyState
        message={emptyMessage}
        icon={emptyIcon}
        flush={mobileFlush}
      />
    )
  }

  return (
    <>
      <DataTableMobileCards
        columns={columns}
        data={data}
        getRowKey={getRowKey}
        onRowClick={onRowClick}
        variant={mobileVariant}
        flush={mobileFlush}
        grouped={mobileGrouped}
        getAvatarLabel={getMobileAvatarLabel}
        getTags={getMobileTags}
      />

      <div className="hidden md:block rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={getRowKey(row)}
                className={onRowClick ? 'cursor-pointer' : undefined}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
