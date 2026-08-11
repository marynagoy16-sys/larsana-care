import type { ReactNode } from 'react'

interface DataLayerProps {
  children: ReactNode
  /** @deprecated Reservado para compatibilidade; o scroll passa por trás da bottom nav. */
  reserveBottomNav?: boolean
}

/** Área principal que estica na altura disponível (header → rodapé do shell). */
export function DataLayer({ children }: DataLayerProps) {
  return (
    <div className="flex flex-1 flex-col min-h-0 h-full w-full overflow-hidden">
      {children}
    </div>
  )
}
