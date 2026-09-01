import type { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface CrudModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'full'
  layout?: 'default' | 'form'
}

const sizeClass = {
  sm: 'lg:max-w-lg',
  md: 'lg:max-w-2xl',
  lg: 'lg:max-w-4xl',
  full: 'lg:max-w-[min(96vw,72rem)]',
}

export function CrudModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'sm',
  layout = 'default',
}: CrudModalProps) {
  const isFormLayout = layout === 'form'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          sizeClass[size],
          isFormLayout
            ? 'flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0'
            : size === 'full' && 'max-h-[90vh] overflow-y-auto',
        )}
      >
        <DialogHeader className={cn(isFormLayout && 'shrink-0 border-b border-border px-6 py-4')}>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className={cn(isFormLayout && 'flex min-h-0 flex-1 flex-col px-6 pb-6 pt-4')}>
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}
