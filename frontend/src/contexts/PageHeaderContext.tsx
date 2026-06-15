import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'

interface PageHeaderState {
  content: ReactNode
  loading?: boolean
}

interface PageHeaderContextValue {
  header: PageHeaderState | null
  registerHeader: (state: PageHeaderState) => void
  unregisterHeader: () => void
}

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null)

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [header, setHeader] = useState<PageHeaderState | null>(null)
  const location = useLocation()

  const registerHeader = useCallback((state: PageHeaderState) => {
    setHeader(state)
  }, [])

  const unregisterHeader = useCallback(() => {
    setHeader(null)
  }, [])

  useEffect(() => {
    setHeader(null)
  }, [location.pathname])

  const value = useMemo(
    () => ({ header, registerHeader, unregisterHeader }),
    [header, registerHeader, unregisterHeader],
  )

  return (
    <PageHeaderContext.Provider value={value}>
      {children}
    </PageHeaderContext.Provider>
  )
}

export function usePageHeader() {
  const ctx = useContext(PageHeaderContext)
  if (!ctx) {
    throw new Error('usePageHeader must be used within PageHeaderProvider')
  }
  return ctx
}

export function PageHeaderRegistrar({
  children,
  loading = false,
}: {
  children: ReactNode
  loading?: boolean
}) {
  const { registerHeader, unregisterHeader } = usePageHeader()

  useLayoutEffect(() => {
    registerHeader({ content: children, loading })
  }, [children, loading, registerHeader])

  useEffect(() => {
    return unregisterHeader
  }, [unregisterHeader])

  return null
}
