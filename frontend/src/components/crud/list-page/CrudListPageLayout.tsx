import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CrudListPageLayoutProps {
  children: ReactNode
  className?: string
}

/** Conteúdo da listagem — scroll fica no DataLayer do AppShell. */
export function CrudListPageLayout({ children, className }: CrudListPageLayoutProps) {
  return <div className={cn('min-w-0', className)}>{children}</div>
}
