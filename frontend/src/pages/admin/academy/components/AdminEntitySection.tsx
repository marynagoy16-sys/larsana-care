import { useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface AdminEntitySectionProps {
  title: string
  description?: string
  icon?: LucideIcon
  badge?: string | number
  actions?: ReactNode
  toolbar?: ReactNode
  children: ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
  className?: string
}

export function AdminEntitySection({
  title,
  description,
  icon: Icon,
  badge,
  actions,
  toolbar,
  children,
  collapsible = false,
  defaultExpanded = true,
  className,
}: AdminEntitySectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const headerContent = (
    <div className="flex flex-1 items-center gap-2 min-w-0">
      {Icon && <Icon size={16} className="text-muted-foreground shrink-0" />}
      <div className="min-w-0">
        <h3 className="font-semibold text-sm truncate">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{description}</p>}
      </div>
      {badge != null && (
        <Badge variant="secondary" className="shrink-0">
          {badge}
        </Badge>
      )}
    </div>
  )

  return (
    <div className={cn('rounded-xl border border-border bg-card shadow-sm overflow-hidden', className)}>
      {collapsible ? (
        <button
          type="button"
          className="flex w-full items-center justify-between gap-4 px-5 py-4 border-b border-border hover:bg-muted/30 transition-colors text-left"
          onClick={() => setExpanded((v) => !v)}
        >
          {headerContent}
          <div className="flex items-center gap-2 shrink-0">
            {actions}
            <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
          </div>
        </button>
      ) : (
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-border">
          {headerContent}
          {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}

      {(!collapsible || expanded) && (
        <div className="p-4 space-y-3">
          {toolbar}
          {children}
        </div>
      )}
    </div>
  )
}
