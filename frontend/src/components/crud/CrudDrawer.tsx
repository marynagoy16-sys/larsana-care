import type { ReactNode } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface CrudDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg' | 'full'
}

const sizeClass = {
  md: 'w-full sm:max-w-2xl',
  lg: 'w-full sm:max-w-2xl lg:max-w-4xl',
  full: 'w-full max-w-full',
}

const sheetClass =
  'flex h-[100dvh] max-h-[100dvh] w-full flex-col gap-0 overflow-hidden p-0 border-l border-border/80 shadow-2xl'

export function CrudDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'lg',
}: CrudDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={cn(sizeClass[size], sheetClass)}>
        <SheetHeader className="shrink-0 border-b border-border px-4 pb-4 pr-10 pt-4">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        <div className="relative min-h-0 flex-1 basis-0">
          <div
            className={cn(
              'drawer-scroll absolute inset-0 overflow-y-auto overscroll-y-contain px-4 py-4',
              footer && 'pb-[calc(5.5rem+env(safe-area-inset-bottom))]',
            )}
            onTouchMove={(event) => event.stopPropagation()}
          >
            {children}
          </div>

          {footer && (
            <div className="absolute inset-x-0 bottom-0 z-10 border-t border-border bg-card/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur supports-[backdrop-filter]:bg-card/90">
              {footer}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
