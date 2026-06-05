import type { ReactNode } from 'react'
import { Search, Filter, Upload, Download, RefreshCw, Settings, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface ListToolbarProps {
  search?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  activeFilterCount?: number
  onOpenFilters?: () => void
  onClearFilters?: () => void
  onImport?: () => void
  onExport?: () => void
  onRefresh?: () => void
  onSettings?: () => void
  onAdd?: () => void
  addLabel?: string
  importDisabled?: boolean
  isRefreshing?: boolean
  trailing?: ReactNode
}

function IconAction({
  label,
  onClick,
  disabled,
  children,
  variant = 'outline',
  className,
}: {
  label: string
  onClick?: () => void
  disabled?: boolean
  children: ReactNode
  variant?: 'outline' | 'default'
  className?: string
}) {
  return (
    <Button
      variant={variant}
      size="icon"
      className={cn('h-9 w-9 shrink-0', className)}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {children}
    </Button>
  )
}

export function ListToolbar({
  search = '',
  onSearchChange,
  searchPlaceholder = 'Pesquisar',
  activeFilterCount = 0,
  onOpenFilters,
  onClearFilters,
  onImport,
  onExport,
  onRefresh,
  onSettings,
  onAdd,
  addLabel = 'Adicionar',
  importDisabled = true,
  isRefreshing,
  trailing,
}: ListToolbarProps) {
  const showSearch = onSearchChange !== undefined

  return (
    <div className="flex flex-nowrap items-center gap-2 min-w-0 w-full">
      <div className={cn('flex min-w-0 items-center gap-1.5 sm:gap-2', showSearch ? 'flex-1' : 'flex-1 sm:flex-none')}>
        {showSearch && (
        <div className="relative flex-1 min-w-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={searchPlaceholder}
            className="pl-9 h-9 w-full"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        )}

        {onOpenFilters && (
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0 relative"
            onClick={onOpenFilters}
            aria-label="Filtros"
            title="Filtros"
          >
            <Filter size={16} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        )}

        {activeFilterCount > 0 && onClearFilters && (
          <button type="button" className="hidden xl:inline text-xs text-muted-foreground hover:text-foreground shrink-0 whitespace-nowrap" onClick={onClearFilters}>
            Limpar
          </button>
        )}
      </div>

      <div className={cn('flex shrink-0 items-center gap-1', !showSearch && 'ml-auto')}>
        {onImport && (
          <>
            <IconAction label="Importar" onClick={onImport} disabled={importDisabled} className="lg:hidden">
              <Upload size={16} />
            </IconAction>
            <Button variant="outline" size="sm" className="hidden lg:inline-flex h-9 shrink-0 whitespace-nowrap" disabled={importDisabled} onClick={onImport} title="Em breve">
              <Upload size={14} />
              Importar
            </Button>
          </>
        )}
        {onExport && (
          <>
            <IconAction label="Exportar" onClick={onExport} className="lg:hidden">
              <Download size={16} />
            </IconAction>
            <Button variant="outline" size="sm" className="hidden lg:inline-flex h-9 shrink-0 whitespace-nowrap" onClick={onExport}>
              <Download size={14} />
              Exportar
            </Button>
          </>
        )}
        {onRefresh && (
          <IconAction label="Atualizar" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw size={16} className={cn(isRefreshing && 'animate-spin')} />
          </IconAction>
        )}
        {onSettings && (
          <IconAction label="Configurações" onClick={onSettings}>
            <Settings size={16} />
          </IconAction>
        )}
        {trailing}
        {onAdd && (
          <>
            <IconAction label={addLabel} onClick={onAdd} variant="default" className="lg:hidden">
              <Plus size={16} />
            </IconAction>
            <Button size="sm" className="hidden lg:inline-flex h-9 shrink-0 whitespace-nowrap" onClick={onAdd}>
              <Plus size={14} />
              {addLabel}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
