import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface TablePaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
  stickyFooter?: boolean
}

export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  stickyFooter,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : page * pageSize + 1
  const to = Math.min((page + 1) * pageSize, total)

  const pages = buildPageNumbers(page, totalPages)

  return (
    <div
      className={cn(
        'flex flex-nowrap items-center justify-between gap-2 min-w-0 text-sm',
        !stickyFooter && 'pt-4 border-t border-border',
      )}
    >
      <p className="text-muted-foreground shrink-0 tabular-nums whitespace-nowrap">
        {from}–{to} de {total}
      </p>

      <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
        <SelectTrigger className="h-8 w-[70px] shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {pageSizeOptions.map((s) => (
            <SelectItem key={s} value={String(s)}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft size={14} />
        </Button>

        <div className="hidden md:flex items-center gap-0.5">
          {pages.map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground">…</span>
            ) : (
              <Button
                key={p}
                variant="outline"
                size="sm"
                className={cn('h-8 w-8 shrink-0', page === p && 'border-primary font-semibold')}
                onClick={() => onPageChange(p as number)}
              >
                {(p as number) + 1}
              </Button>
            ),
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          aria-label="Próxima página"
        >
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  )
}

function buildPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)
  const pages: (number | '...')[] = [0]
  if (current > 2) pages.push('...')
  for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) {
    pages.push(i)
  }
  if (current < total - 3) pages.push('...')
  if (total > 1) pages.push(total - 1)
  return pages
}
