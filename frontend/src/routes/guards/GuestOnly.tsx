import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getAppHomePathForRole } from '@/lib/native/routing'

export function GuestOnly({ children }: { children: React.ReactNode }) {
  const { session, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (session && role) {
    return <Navigate to={getAppHomePathForRole(role)} replace />
  }

  return <>{children}</>
}
