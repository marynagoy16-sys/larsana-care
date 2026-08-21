import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

export function ProfissionalEntryRedirect() {
  const [target, setTarget] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return window.matchMedia('(min-width: 1024px)').matches
      ? '/profissional/demandas'
      : '/profissional/demandas'
  })

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const sync = () => setTarget('/profissional/demandas')
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  if (!target) return null
  return <Navigate to={target} replace />
}
