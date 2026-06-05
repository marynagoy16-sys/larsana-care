import type { ReactNode } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'

interface CrudDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
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
  size = 'lg',
}: CrudDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={sizeClass[size]}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-6">{children}</div>
      </SheetContent>
    </Sheet>
  )
}
