import { Search, RefreshCw, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface CrudEntityToolbarProps {
  search?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  onRefresh?: () => void
  onAdd?: () => void
  addLabel?: string
  isRefreshing?: boolean
}

export function CrudEntityToolbar({
  search = '',
  onSearchChange,
  searchPlaceholder = 'Pesquisar...',
  onRefresh,
  onAdd,
  addLabel = 'Novo',
  isRefreshing,
}: CrudEntityToolbarProps) {
  const showSearch = onSearchChange !== undefined

  return (
    <div className="flex flex-nowrap items-center gap-1.5 sm:gap-2 min-w-0 w-full">
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

      <div className={cn('flex items-center gap-1 shrink-0', !showSearch && 'ml-auto')}>
        {onRefresh && (
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Atualizar"
            title="Atualizar"
          >
            <RefreshCw size={16} className={cn(isRefreshing && 'animate-spin')} />
          </Button>
        )}
        {onAdd && (
          <>
            <Button size="icon" className="h-9 w-9 shrink-0 lg:hidden" onClick={onAdd} aria-label={addLabel} title={addLabel}>
              <Plus size={16} />
            </Button>
            <Button size="sm" className="hidden lg:flex h-9 shrink-0" onClick={onAdd}>
              <Plus size={14} />
              {addLabel}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
