import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

type CrudEmptyStateProps = {
  message: string
  description?: string
  icon?: LucideIcon
  className?: string
  flush?: boolean
  muted?: boolean
}

export function CrudEmptyState({
  message,
  description,
  icon: Icon = Inbox,
  className,
  flush = false,
  muted = false,
}: CrudEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center border border-dashed border-border px-5 py-8 text-center',
        flush ? 'rounded-none border-x-0 p-8' : 'rounded-xl p-8',
        muted && 'bg-muted/20',
        className,
      )}
    >
      <div
        className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground"
        aria-hidden
      >
        <Icon className="size-6" strokeWidth={1.5} />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
    </div>
  )
}
