import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { isNativeApp } from '@/lib/native/platform'
import { getAppHomePathForRole } from '@/lib/native/routing'
import { StaffUsesWebPage } from '@/pages/public/StaffUsesWebPage'
import { isStaffRole } from '@/types/auth'

function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

/**
 * Prevents the administrative console from mounting inside the public store app.
 * Staff see an explicit web-only message; other roles are sent to their home.
 */
export function NativeAdminGuard({ children }: { children: ReactNode }) {
  const { role, loading } = useAuth()

  if (loading) return <LoadingSpinner />

  if (!isNativeApp()) return <>{children}</>

  if (role && isStaffRole(role)) {
    return <StaffUsesWebPage />
  }

  if (role) {
    return <Navigate to={getAppHomePathForRole(role)} replace />
  }

  return <Navigate to="/login" replace />
}
