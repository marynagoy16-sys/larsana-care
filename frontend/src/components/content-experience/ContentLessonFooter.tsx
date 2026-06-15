import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FlatContentItem } from '@/types/academy'
import { cn } from '@/lib/utils'

interface ContentLessonFooterProps {
  activeIndex: number
  total: number
  prev: FlatContentItem | null
  next: FlatContentItem | null
  onPrev: () => void
  onNext: () => void
  isLoading?: boolean
}

export function ContentLessonFooter({
  activeIndex,
  total,
  prev,
  next,
  onPrev,
  onNext,
  isLoading = false,
}: ContentLessonFooterProps) {
  return (
    <footer
      className={cn(
        'content-fixed-footer shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80',
        'max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-40 lg:sticky lg:bottom-0',
      )}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-6">
        <Button
          variant="outline"
          size="sm"
          disabled={!prev || isLoading}
          onClick={onPrev}
          className="max-w-[40%] justify-start"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" />
          <span className="ml-1 hidden truncate sm:inline">{prev ? prev.title : 'Anterior'}</span>
          <span className="ml-1 sm:hidden">Anterior</span>
        </Button>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {total > 0 ? `${activeIndex + 1} / ${total}` : '—'}
        </span>
        <Button
          size="sm"
          disabled={!next || isLoading}
          onClick={onNext}
          className="max-w-[40%] justify-end"
        >
          <span className="mr-1 hidden truncate sm:inline">{next ? next.title : 'Próxima'}</span>
          <span className="mr-1 sm:hidden">Próxima</span>
          <ChevronRight className="h-4 w-4 shrink-0" />
        </Button>
      </div>
    </footer>
  )
}
