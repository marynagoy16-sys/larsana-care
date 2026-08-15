import type { ReactNode } from 'react'
import { PageFooterRegistrar } from '@/contexts/PageFooterContext'

interface PageFooterProps {
  children: ReactNode
  loading?: boolean
  contentKey?: string | number
}

/** Registra paginação no rodapé do DataLayer (não renderiza na página). */
export function PageFooter({ children, loading, contentKey }: PageFooterProps) {
  return (
    <PageFooterRegistrar loading={loading} contentKey={contentKey}>
      {children}
    </PageFooterRegistrar>
  )
}
