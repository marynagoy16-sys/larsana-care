import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Toggle } from '@/components/ui/toggle'
import { cn } from '@/lib/utils'

export interface ContentFilterOption {
  id: string
  label: string
}

interface ContentFloatingToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters?: ContentFilterOption[]
  activeFilter?: string | null
  onFilterChange?: (id: string | null) => void
}

export function ContentFloatingToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Buscar conteúdos…',
  filters = [],
  activeFilter = null,
  onFilterChange,
}: ContentFloatingToolbarProps) {
  return (
    <div
      className={cn(
        'fixed left-1/2 z-50 flex w-[min(100%-1.5rem,56rem)] -translate-x-1/2 flex-col gap-2 rounded-2xl border border-border/50 bg-muted/90 px-3 py-2.5 shadow-md backdrop-blur-md',
        'bottom-[4.75rem] lg:bottom-6 sm:flex-row sm:items-center sm:justify-between',
      )}
    >
      <div className="relative w-full shrink-0 sm:max-w-[17rem] lg:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-9 rounded-full border-border/60 bg-background/80 pl-9 text-sm"
        />
      </div>
      {filters.length > 0 && onFilterChange && (
        <div className="flex flex-wrap gap-1.5">
          {filters.map((filter) => (
            <Toggle
              key={filter.id}
              size="sm"
              variant="outline"
              pressed={activeFilter === filter.id}
              onPressedChange={(pressed) => onFilterChange(pressed ? filter.id : null)}
              className="h-8 rounded-full px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {filter.label}
            </Toggle>
          ))}
        </div>
      )}
    </div>
  )
}
