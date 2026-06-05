import type { ReactNode } from 'react'
import { PageFooterRegistrar } from '@/contexts/PageFooterContext'

interface PageFooterProps {
  children: ReactNode
  loading?: boolean
}

/** Registra paginação no rodapé do DataLayer (não renderiza na página). */
export function PageFooter({ children, loading }: PageFooterProps) {
  return (
    <PageFooterRegistrar loading={loading}>
      {children}
    </PageFooterRegistrar>
  )
}
