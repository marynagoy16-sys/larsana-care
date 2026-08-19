import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { isNativeApp } from '@/lib/native/platform'
import { getAppHomePathForRole } from '@/lib/native/routing'
import { StaffUsesWebPage } from '@/pages/public/StaffUsesWebPage'
import { isStaffRole } from '@/types/auth'

export function StaffWebOnlyRoute() {
  const { role, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!role) return <Navigate to="/login" replace />

  if (!isStaffRole(role)) {
    return <Navigate to={getAppHomePathForRole(role)} replace />
  }

  if (!isNativeApp()) {
    return <Navigate to="/admin" replace />
  }

  return <StaffUsesWebPage />
}
