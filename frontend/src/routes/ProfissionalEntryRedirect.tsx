import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

export function ProfissionalEntryRedirect() {
  const [target, setTarget] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return window.matchMedia('(min-width: 1024px)').matches
      ? '/profissional/agenda'
      : '/profissional/inicio'
  })

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const sync = () => setTarget(mq.matches ? '/profissional/agenda' : '/profissional/inicio')
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  if (!target) return null
  return <Navigate to={target} replace />
}
