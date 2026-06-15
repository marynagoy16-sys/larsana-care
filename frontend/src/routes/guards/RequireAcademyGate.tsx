import { useQuery } from '@tanstack/react-query'
import { Navigate, useLocation } from 'react-router-dom'
import { checkPpPassesGate, getAcademySettings, getDemandsGateRule } from '@/services/academy'

interface RequireAcademyGateProps {
  gateTarget: 'demands'
  children: React.ReactNode
}

export function RequireAcademyGate({ gateTarget, children }: RequireAcademyGateProps) {
  const location = useLocation()

  const { data: passes, isLoading } = useQuery({
    queryKey: ['pp', 'academy', 'gate', gateTarget],
    queryFn: () => checkPpPassesGate(gateTarget),
  })

  const { data: settings } = useQuery({
    queryKey: ['academy', 'settings'],
    queryFn: getAcademySettings,
  })

  const { data: rule } = useQuery({
    queryKey: ['academy', 'gate-rules', gateTarget],
    queryFn: getDemandsGateRule,
    enabled: gateTarget === 'demands',
  })

  if (isLoading) return null

  if (settings?.gates_master_enabled && passes === false) {
    const msg = encodeURIComponent(rule?.block_message ?? 'Conclua a Formação PP na Academy.')
    return <Navigate to={`/profissional/academy?blocked=${gateTarget}&msg=${msg}`} replace state={{ from: location }} />
  }

  return <>{children}</>
}
