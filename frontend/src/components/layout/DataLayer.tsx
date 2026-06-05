import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DataLayerProps {
  children: ReactNode
  reserveBottomNav?: boolean
}

/** Área principal que estica na altura disponível (header → rodapé do shell). */
export function DataLayer({ children, reserveBottomNav }: DataLayerProps) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col min-h-0 h-full w-full overflow-hidden',
        reserveBottomNav && 'pb-20 lg:pb-0',
      )}
    >
      {children}
    </div>
  )
}
