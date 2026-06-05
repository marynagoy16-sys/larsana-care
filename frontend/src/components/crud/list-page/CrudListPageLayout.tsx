import type { ReactNode } from 'react'

interface CrudListPageLayoutProps {
  children: ReactNode
}

/** Conteúdo da listagem — scroll fica no DataLayer do AppShell. */
export function CrudListPageLayout({ children }: CrudListPageLayoutProps) {
  return <div className="min-w-0">{children}</div>
}
