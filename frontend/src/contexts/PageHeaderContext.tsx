import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

interface PageHeaderState {
  content: ReactNode
  loading?: boolean
}

interface PageHeaderContextValue {
  header: PageHeaderState | null
  registerHeader: (id: number, state: PageHeaderState) => void
  unregisterHeader: (id: number) => void
}

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null)

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [header, setHeader] = useState<PageHeaderState | null>(null)
  const activeRegistrationRef = useRef(0)

  const registerHeader = useCallback((id: number, state: PageHeaderState) => {
    activeRegistrationRef.current = id
    setHeader(state)
  }, [])

  const unregisterHeader = useCallback((id: number) => {
    if (activeRegistrationRef.current !== id) return
    activeRegistrationRef.current = 0
    setHeader(null)
  }, [])

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

let nextRegistrationId = 0

export function PageHeaderRegistrar({
  children,
  loading = false,
}: {
  children: ReactNode
  loading?: boolean
}) {
  const { registerHeader, unregisterHeader } = usePageHeader()
  const registrationIdRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    const id = ++nextRegistrationId
    registrationIdRef.current = id
    registerHeader(id, { content: children, loading })

    return () => {
      unregisterHeader(id)
    }
  }, [children, loading, registerHeader, unregisterHeader])

  return null
}
