import { lazy, Suspense } from 'react'
import { PageSkeleton } from '@/components/shared/PageSkeleton'

const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })))

export function LoginPageLazy() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <LoginPage />
    </Suspense>
  )
}
