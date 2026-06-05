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
  registerFooter: (state: PageFooterState) => void
  unregisterFooter: () => void
}

const PageFooterContext = createContext<PageFooterContextValue | null>(null)

export function PageFooterProvider({ children }: { children: ReactNode }) {
  const [footer, setFooter] = useState<PageFooterState | null>(null)
  const location = useLocation()

  const registerFooter = useCallback((state: PageFooterState) => {
    setFooter(state)
  }, [])

  const unregisterFooter = useCallback(() => {
    setFooter(null)
  }, [])

  useEffect(() => {
    setFooter(null)
  }, [location.pathname])

  const value = useMemo(
    () => ({ footer, registerFooter, unregisterFooter }),
    [footer, registerFooter, unregisterFooter],
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
