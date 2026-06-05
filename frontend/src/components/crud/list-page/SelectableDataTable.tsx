import type { ReactNode } from 'react'
import { MoreVertical, ArrowUpDown } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { DataTableMobileCards } from '@/components/crud/DataTableMobileCards'
import { CrudTableSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { cn } from '@/lib/utils'

export interface SelectableColumn<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
  className?: string
  sortable?: boolean
  mobilePrimary?: boolean
  mobileSubtitle?: boolean
  mobileBadge?: boolean
  mobileMeta?: boolean
  mobileHidden?: boolean
}

export interface RowAction<T> {
  label: string
  onClick: (row: T) => void
  variant?: 'default' | 'destructive'
}

interface SelectableDataTableProps<T extends { id: string }> {
  columns: SelectableColumn<T>[]
  data: T[]
  isLoading?: boolean
  emptyMessage?: string
  selectedIds: Set<string>
  onSelectionChange: (ids: Set<string>) => void
  onRowClick?: (row: T) => void
  rowActions?: RowAction<T>[]
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (key: string) => void
  getAvatarLabel?: (row: T) => string
}

export function SelectableDataTable<T extends { id: string }>({
  columns,
  data,
  isLoading,
  emptyMessage = 'Nenhum registro encontrado.',
  selectedIds,
  onSelectionChange,
  onRowClick,
  rowActions,
  sortBy,
  sortDir,
  onSort,
  getAvatarLabel,
}: SelectableDataTableProps<T>) {
  const allSelected = data.length > 0 && data.every((r) => selectedIds.has(r.id))
  const someSelected = data.some((r) => selectedIds.has(r.id)) && !allSelected

  const toggleAll = () => {
    if (allSelected) {
      const next = new Set(selectedIds)
      data.forEach((r) => next.delete(r.id))
      onSelectionChange(next)
    } else {
      const next = new Set(selectedIds)
      data.forEach((r) => next.add(r.id))
      onSelectionChange(next)
    }
  }

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onSelectionChange(next)
  }

  if (isLoading) {
    return <CrudTableSkeleton variant="rich" columns={columns.length} />
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
        getRowKey={(row) => row.id}
        getRowId={(row) => row.id}
        onRowClick={onRowClick}
        selectable
        selectedIds={selectedIds}
        onToggle={toggleOne}
        rowActions={rowActions}
        getAvatarLabel={getAvatarLabel}
      />

      <div className="hidden md:block rounded-xl border border-border overflow-hidden min-w-0">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                onCheckedChange={toggleAll}
              />
            </TableHead>
            {columns.map((col) => (
              <TableHead key={col.key} className={col.className}>
                {col.sortable && onSort ? (
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-foreground"
                    onClick={() => onSort(col.key)}
                  >
                    {col.header}
                    <ArrowUpDown
                      size={12}
                      className={cn(sortBy === col.key && 'text-primary', sortDir === 'desc' && sortBy === col.key && 'rotate-180')}
                    />
                  </button>
                ) : (
                  col.header
                )}
              </TableHead>
            ))}
            {rowActions && rowActions.length > 0 && <TableHead className="w-10" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => {
            const isSelected = selectedIds.has(row.id)
            return (
              <TableRow
                key={row.id}
                className={cn(
                  onRowClick && 'cursor-pointer',
                  isSelected && 'bg-primary/5 shadow-[inset_2px_0_0_0_hsl(var(--primary))]',
                  !isSelected && idx % 2 === 1 && 'bg-muted/20',
                )}
                onClick={() => onRowClick?.(row)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={isSelected} onCheckedChange={() => toggleOne(row.id)} />
                </TableCell>
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.cell(row)}
                  </TableCell>
                ))}
                {rowActions && rowActions.length > 0 && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {rowActions.map((action) => (
                          <DropdownMenuItem
                            key={action.label}
                            className={action.variant === 'destructive' ? 'text-destructive focus:text-destructive' : undefined}
                            onClick={() => action.onClick(row)}
                          >
                            {action.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      </div>
    </>
  )
}
