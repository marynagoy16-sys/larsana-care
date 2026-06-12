import type { ReactNode } from 'react'
import { PageHeaderRegistrar } from '@/contexts/PageHeaderContext'

interface PageHeaderProps {
  children: ReactNode
  loading?: boolean
}

/** Registra conteúdo customizado no header do AppShell (não renderiza na página). */
export function PageHeader({ children, loading }: PageHeaderProps) {
  return (
    <PageHeaderRegistrar loading={loading}>
      {children}
    </PageHeaderRegistrar>
  )
}
