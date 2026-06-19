import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

interface ImmersiveLayoutContextValue {
  immersive: boolean
  setImmersive: (value: boolean) => void
  /** Mantém o header; trava a altura da área principal (scroll fica na página). */
  fixedMain: boolean
  setFixedMain: (value: boolean) => void
}

const ImmersiveLayoutContext = createContext<ImmersiveLayoutContextValue | null>(null)

export function ImmersiveLayoutProvider({ children }: { children: ReactNode }) {
  const [immersive, setImmersive] = useState(false)
  const [fixedMain, setFixedMain] = useState(false)
  const value = useMemo(
    () => ({ immersive, setImmersive, fixedMain, setFixedMain }),
    [immersive, fixedMain],
  )
  return <ImmersiveLayoutContext.Provider value={value}>{children}</ImmersiveLayoutContext.Provider>
}

export function useImmersiveLayout() {
  const ctx = useContext(ImmersiveLayoutContext)
  if (!ctx) throw new Error('useImmersiveLayout must be used within ImmersiveLayoutProvider')
  return ctx
}
