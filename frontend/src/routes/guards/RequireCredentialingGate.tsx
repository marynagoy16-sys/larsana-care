import { useQuery } from '@tanstack/react-query'
import { Navigate, useLocation } from 'react-router-dom'
import { getCurrentProfessional } from '@/services/professionals'

interface RequireCredentialingGateProps {
  children: React.ReactNode
}

/** Demandas exigem credenciamento ativo; Academy não bloqueia atendimento (transcrição 17/08/2026). */
export function RequireCredentialingGate({ children }: RequireCredentialingGateProps) {
  const location = useLocation()

  const { data: professional, isLoading } = useQuery({
    queryKey: ['pp', 'current_professional'],
    queryFn: getCurrentProfessional,
  })

  if (isLoading) return null

  if (professional && professional.credentialing_status !== 'ativo') {
    const msg = encodeURIComponent(
      'Finalize seu credenciamento para acessar as demandas. A Formação PP (Academy) aumenta sua patente, mas não impede o atendimento.',
    )
    return (
      <Navigate
        to={`/profissional/credenciamento?blocked=demands&msg=${msg}`}
        replace
        state={{ from: location }}
      />
    )
  }

  return <>{children}</>
}
