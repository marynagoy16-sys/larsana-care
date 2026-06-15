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
      <SheetContent side="right" className={cn(sizeClass[size], 'gap-0 overflow-hidden p-0')}>
        <div className="flex h-full min-h-0 flex-col">
          <SheetHeader className="shrink-0 border-b border-border pb-4 pr-10">
            <SheetTitle>{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>

          <div className="relative min-h-0 flex-1">
            <div className="drawer-scroll absolute inset-0 px-4 py-4">{children}</div>
          </div>

          {footer && (
            <div className="shrink-0 border-t border-border bg-card px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
              {footer}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
