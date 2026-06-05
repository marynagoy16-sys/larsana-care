import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, Loader2, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { SearchOption } from '@/services/entitySearch'
import { cn } from '@/lib/utils'

export interface SearchComboboxProps {
  value?: string
  onValueChange: (value: string) => void
  onSearch: (query: string) => Promise<SearchOption[]>
  resolveOption?: (id: string) => Promise<SearchOption | null>
  placeholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  id?: string
}

export function SearchCombobox({
  value,
  onValueChange,
  onSearch,
  resolveOption,
  placeholder = 'Buscar…',
  emptyMessage = 'Nenhum resultado encontrado',
  disabled,
  className,
  id: idProp,
}: SearchComboboxProps) {
  const autoId = useId()
  const inputId = idProp ?? autoId
  const listboxId = `${inputId}-listbox`

  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<SearchOption[]>([])
  const [selected, setSelected] = useState<SearchOption | null>(null)
  const [loading, setLoading] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(0)

  const loadOptions = useCallback(
    async (searchQuery: string) => {
      setLoading(true)
      try {
        const results = await onSearch(searchQuery)
        setOptions(results)
        setHighlightIndex(0)
      } finally {
        setLoading(false)
      }
    },
    [onSearch],
  )

  useEffect(() => {
    if (!value) {
      setSelected(null)
      return
    }
    if (selected?.id === value) return

    let cancelled = false
    ;(async () => {
      if (resolveOption) {
        const resolved = await resolveOption(value)
        if (!cancelled && resolved) setSelected(resolved)
      } else {
        const match = options.find((o) => o.id === value)
        if (!cancelled && match) setSelected(match)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [value, resolveOption, selected?.id, options])

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      void loadOptions(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, open, loadOptions])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectOption = (option: SearchOption) => {
    setSelected(option)
    onValueChange(option.id)
    setQuery('')
    setOpen(false)
  }

  const clearSelection = () => {
    setSelected(null)
    onValueChange('')
    setQuery('')
    setOpen(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((i) => Math.min(i + 1, options.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && open && options[highlightIndex]) {
      e.preventDefault()
      selectOption(options[highlightIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {selected && !open ? (
        <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 min-h-10">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selected.label}</p>
            {selected.subtitle && (
              <p className="text-xs text-muted-foreground truncate">{selected.subtitle}</p>
            )}
          </div>
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={clearSelection}
              aria-label="Limpar seleção"
            >
              <X size={14} />
            </Button>
          )}
        </div>
      ) : (
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            id={inputId}
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="pl-9 pr-9"
            autoComplete="off"
          />
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
        </div>
      )}

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-md border border-border bg-popover shadow-md py-1"
        >
          {loading ? (
            <li className="flex items-center justify-center gap-2 px-3 py-4 text-sm text-muted-foreground">
              <Loader2 size={16} className="animate-spin" />
              Buscando…
            </li>
          ) : options.length === 0 ? (
            <li className="px-3 py-4 text-sm text-muted-foreground text-center">{emptyMessage}</li>
          ) : (
            options.map((option, index) => (
              <li
                key={option.id}
                role="option"
                aria-selected={value === option.id}
                className={cn(
                  'cursor-pointer px-3 py-2 text-sm transition-colors',
                  index === highlightIndex && 'bg-accent text-accent-foreground',
                  value === option.id && 'font-medium',
                )}
                onMouseEnter={() => setHighlightIndex(index)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  selectOption(option)
                }}
              >
                <p className="font-medium truncate">{option.label}</p>
                {option.subtitle && (
                  <p className="text-xs text-muted-foreground truncate">{option.subtitle}</p>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
