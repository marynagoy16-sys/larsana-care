import type { ReactNode } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataTableMobileCards } from '@/components/crud/DataTableMobileCards'
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
  onRowClick?: (row: T) => void
  getRowKey: (row: T) => string
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  isLoading,
  emptyMessage = 'Nenhum registro encontrado.',
  onRowClick,
  getRowKey,
}: DataTableProps<T>) {
  if (isLoading) {
    return <CrudTableSkeleton columns={columns.length} />
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <>
      <DataTableMobileCards
        columns={columns}
        data={data}
        getRowKey={getRowKey}
        onRowClick={onRowClick}
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
