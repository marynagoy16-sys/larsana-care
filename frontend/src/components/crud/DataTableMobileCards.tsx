import type { ReactNode } from 'react'
import { MoreVertical } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export interface MobileColumn<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
  mobilePrimary?: boolean
  mobileSubtitle?: boolean
  mobileBadge?: boolean
  mobileMeta?: boolean
  mobileHidden?: boolean
}

export interface MobileRowAction<T> {
  label: string
  onClick: (row: T) => void
  variant?: 'default' | 'destructive'
}

interface DataTableMobileCardsProps<T> {
  columns: MobileColumn<T>[]
  data: T[]
  getRowKey: (row: T) => string
  onRowClick?: (row: T) => void
  selectable?: boolean
  selectedIds?: Set<string>
  onToggle?: (id: string) => void
  rowActions?: MobileRowAction<T>[]
  getRowId?: (row: T) => string
  getAvatarLabel?: (row: T) => string
  variant?: 'default' | 'compact'
}

function resolveColumn<T>(columns: MobileColumn<T>[], flag: keyof MobileColumn<T>) {
  return columns.find((c) => c[flag] === true)
}

function getInitials(label: string) {
  return label
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export function DataTableMobileCards<T>({
  columns,
  data,
  getRowKey,
  onRowClick,
  selectable,
  selectedIds,
  onToggle,
  rowActions,
  getRowId,
  getAvatarLabel,
  variant = 'default',
}: DataTableMobileCardsProps<T>) {
  const primaryCol = resolveColumn(columns, 'mobilePrimary') ?? columns.find((c) => !c.mobileHidden) ?? columns[0]
  const subtitleCol = resolveColumn(columns, 'mobileSubtitle')
  const badgeCol = resolveColumn(columns, 'mobileBadge')
  const metaCols = columns.filter((c) => c.mobileMeta && !c.mobileHidden)

  return (
    <div className={cn('md:hidden', variant === 'compact' ? 'space-y-2' : 'space-y-2.5')}>
      {data.map((row) => {
        const rowId = getRowId?.(row) ?? getRowKey(row)
        const isSelected = selectedIds?.has(rowId)
        const avatarText = getAvatarLabel?.(row) ?? (primaryCol ? String(primaryCol.cell(row)).replace(/<[^>]*>/g, '') : '')

        if (variant === 'compact') {
          return (
            <div
              key={getRowKey(row)}
              role={onRowClick ? 'button' : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={() => onRowClick?.(row)}
              onKeyDown={(e) => {
                if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  onRowClick(row)
                }
              }}
              className={cn(
                'flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors',
                onRowClick && 'cursor-pointer active:bg-muted/40',
                isSelected ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border',
              )}
            >
              {selectable && onToggle && (
                <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                  <Checkbox checked={!!isSelected} onCheckedChange={() => onToggle(rowId)} />
                </div>
              )}

              <Avatar className="h-10 w-10 shrink-0 border border-border">
                <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                  {getInitials(avatarText)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                {primaryCol && (
                  <div className="truncate text-sm font-medium text-foreground">{primaryCol.cell(row)}</div>
                )}
                {subtitleCol && (
                  <p className="truncate text-xs text-muted-foreground">{subtitleCol.cell(row)}</p>
                )}
              </div>

              {badgeCol && (
                <div className="shrink-0 text-sm font-medium tabular-nums text-muted-foreground">
                  {badgeCol.cell(row)}
                </div>
              )}

              {rowActions && rowActions.length > 0 && (
                <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
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
                </div>
              )}
            </div>
          )
        }

        return (
          <div
            key={getRowKey(row)}
            role={onRowClick ? 'button' : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            onClick={() => onRowClick?.(row)}
            onKeyDown={(e) => {
              if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                onRowClick(row)
              }
            }}
            className={cn(
              'rounded-xl border bg-card overflow-hidden transition-colors',
              onRowClick && 'cursor-pointer active:bg-muted/40',
              isSelected ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border',
            )}
          >
            <div
              className={cn(
                'h-1 w-full',
                isSelected ? 'bg-primary' : 'bg-muted',
              )}
            />

            <div className="p-3.5 space-y-3">
              <div className="flex items-start gap-2.5">
                {selectable && onToggle && (
                  <div
                    className="pt-2"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <Checkbox checked={!!isSelected} onCheckedChange={() => onToggle(rowId)} />
                  </div>
                )}

                <Avatar className="h-10 w-10 shrink-0 border border-border">
                  <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                    {getInitials(avatarText)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {primaryCol && (
                        <div className="font-semibold text-[15px] text-foreground leading-tight truncate">
                          {primaryCol.cell(row)}
                        </div>
                      )}
                      {subtitleCol && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {subtitleCol.cell(row)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      {badgeCol && (
                        <div className="shrink-0">{badgeCol.cell(row)}</div>
                      )}
                      {rowActions && rowActions.length > 0 && (
                        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 -mr-1">
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
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {metaCols.length > 0 && (
                <div className="flex items-center gap-3 pt-2 border-t border-border/80">
                  {metaCols.map((col) => (
                    <div key={col.key} className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {col.header}
                      </p>
                      <div className="text-sm text-foreground mt-0.5 truncate tabular-nums">
                        {col.cell(row)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
