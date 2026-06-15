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

interface PageFooterState {
  content: ReactNode
  loading?: boolean
}

interface PageFooterContextValue {
  footer: PageFooterState | null
  suppressBottomNav: boolean
  registerFooter: (state: PageFooterState) => void
  unregisterFooter: () => void
  setSuppressBottomNav: (suppress: boolean) => void
}

const PageFooterContext = createContext<PageFooterContextValue | null>(null)

export function PageFooterProvider({ children }: { children: ReactNode }) {
  const [footer, setFooter] = useState<PageFooterState | null>(null)
  const [suppressBottomNav, setSuppressBottomNav] = useState(false)
  const location = useLocation()

  const registerFooter = useCallback((state: PageFooterState) => {
    setFooter(state)
  }, [])

  const unregisterFooter = useCallback(() => {
    setFooter(null)
  }, [])

  useEffect(() => {
    setFooter(null)
    setSuppressBottomNav(false)
  }, [location.pathname])

  const value = useMemo(
    () => ({ footer, suppressBottomNav, registerFooter, unregisterFooter, setSuppressBottomNav }),
    [footer, suppressBottomNav, registerFooter, unregisterFooter],
  )

  return (
    <PageFooterContext.Provider value={value}>
      {children}
    </PageFooterContext.Provider>
  )
}

export function usePageFooter() {
  const ctx = useContext(PageFooterContext)
  if (!ctx) {
    throw new Error('usePageFooter must be used within PageFooterProvider')
  }
  return ctx
}

export function useSuppressBottomNav(suppress: boolean) {
  const { setSuppressBottomNav } = usePageFooter()

  useLayoutEffect(() => {
    setSuppressBottomNav(suppress)
    return () => setSuppressBottomNav(false)
  }, [suppress, setSuppressBottomNav])
}

export function PageFooterRegistrar({
  children,
  loading = false,
}: {
  children: ReactNode
  loading?: boolean
}) {
  const { registerFooter, unregisterFooter } = usePageFooter()

  useLayoutEffect(() => {
    registerFooter({ content: children, loading })
    return unregisterFooter
  }, [children, loading, registerFooter, unregisterFooter])

  return null
}
