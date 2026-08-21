import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { syncBottomNavCollapsedDataset } from '@/lib/bottomNavCollapse'
import { useLocation } from 'react-router-dom'

interface PageFooterState {
  content: ReactNode
  loading?: boolean
  contentKey?: string | number
}

interface PageFooterContextValue {
  footer: PageFooterState | null
  suppressBottomNav: boolean
  bottomNavCollapsed: boolean
  registerFooter: (state: PageFooterState) => void
  unregisterFooter: () => void
  setSuppressBottomNav: (suppress: boolean) => void
  setBottomNavCollapsed: (collapsed: boolean) => void
}

const PageFooterContext = createContext<PageFooterContextValue | null>(null)

export function PageFooterProvider({ children }: { children: ReactNode }) {
  const [footer, setFooter] = useState<PageFooterState | null>(null)
  const [suppressBottomNav, setSuppressBottomNavState] = useState(false)
  const [bottomNavCollapsed, setBottomNavCollapsedState] = useState(false)
  const location = useLocation()

  const setSuppressBottomNav = useCallback((suppress: boolean) => {
    setSuppressBottomNavState((current) => (current === suppress ? current : suppress))
  }, [])

  const setBottomNavCollapsed = useCallback((collapsed: boolean) => {
    setBottomNavCollapsedState((current) => (current === collapsed ? current : collapsed))
  }, [])

  const registerFooter = useCallback((state: PageFooterState) => {
    setFooter((current) => {
      if (
        current?.contentKey === state.contentKey &&
        current?.loading === state.loading
      ) {
        return current
      }
      return state
    })
  }, [])

  const unregisterFooter = useCallback(() => {
    setFooter(null)
  }, [])

  useEffect(() => {
    setFooter(null)
    setSuppressBottomNav(false)
    setBottomNavCollapsed(false)
    syncBottomNavCollapsedDataset(false)
  }, [location.pathname, setBottomNavCollapsed, setSuppressBottomNav])

  const value = useMemo(
    () => ({
      footer,
      suppressBottomNav,
      bottomNavCollapsed,
      registerFooter,
      unregisterFooter,
      setSuppressBottomNav,
      setBottomNavCollapsed,
    }),
    [footer, suppressBottomNav, bottomNavCollapsed, registerFooter, unregisterFooter, setSuppressBottomNav, setBottomNavCollapsed],
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
    return () => {
      setSuppressBottomNav(false)
    }
  }, [suppress, setSuppressBottomNav])
}

export function PageFooterRegistrar({
  children,
  loading = false,
  contentKey,
}: {
  children: ReactNode
  loading?: boolean
  contentKey?: string | number
}) {
  const { registerFooter, unregisterFooter } = usePageFooter()
  const childrenRef = useRef(children)

  useLayoutEffect(() => {
    childrenRef.current = children
  })

  useLayoutEffect(() => {
    return unregisterFooter
  }, [unregisterFooter])

  useLayoutEffect(() => {
    registerFooter({
      content: childrenRef.current,
      loading,
      contentKey,
    })
  }, [contentKey, loading, registerFooter])

  return null
}
