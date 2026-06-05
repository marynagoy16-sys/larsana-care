import type { ReactNode } from 'react'

interface CrudScrollPageLayoutProps {
  children: ReactNode
}

/** Páginas de detalhe/dashboard — scroll fica no DataLayer do AppShell. */
export function CrudScrollPageLayout({ children }: CrudScrollPageLayoutProps) {
  return <div className="min-w-0">{children}</div>
}
