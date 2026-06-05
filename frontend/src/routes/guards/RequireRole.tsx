import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getHomePathForRole, type UserRole } from '@/types/auth'

interface RequireRoleProps {
  allowed: UserRole[]
  children: React.ReactNode
}

export function RequireRole({ allowed, children }: RequireRoleProps) {
  const { role, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!role || !allowed.includes(role)) {
    if (role) {
      return <Navigate to={getHomePathForRole(role)} replace />
    }
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
