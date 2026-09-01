import type { RouteObject } from 'react-router-dom'
import { lazy } from 'react'
import { GuestOnly } from '@/routes/guards/GuestOnly'
import { RequireAuth } from '@/routes/guards/RequireAuth'
import { comingSoonElement } from '@/routes/createComingSoonElement'
import { LoginPageLazy } from '@/pages/auth/LoginPageLazy'
import { StaffWebOnlyRoute } from '@/routes/guards/StaffWebOnlyRoute'

const SignupPageLazy = lazy(() =>
  import('@/pages/auth/SignupPage').then((m) => ({ default: m.SignupPage })),
)
const ForgotPasswordPageLazy = lazy(() =>
  import('@/pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
)
const ResetPasswordPageLazy = lazy(() =>
  import('@/pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
)
const PublicLegalTermPageLazy = lazy(() =>
  import('@/pages/auth/PublicLegalTermPage').then((m) => ({ default: m.PublicLegalTermPage })),
)

export const publicRoutes: RouteObject[] = [
  {
    path: '/login',
    element: (
      <GuestOnly>
        <LoginPageLazy />
      </GuestOnly>
    ),
  },
  {
    path: '/cadastro',
    element: (
      <GuestOnly>
        <SignupPageLazy />
      </GuestOnly>
    ),
  },
  {
    path: '/recuperar-senha',
    element: (
      <GuestOnly>
        <ForgotPasswordPageLazy />
      </GuestOnly>
    ),
  },
  {
    path: '/redefinir-senha',
    element: <ResetPasswordPageLazy />,
  },
  { path: '/termos-de-uso', element: <PublicLegalTermPageLazy /> },
  { path: '/politica-de-privacidade', element: <PublicLegalTermPageLazy /> },
  {
    path: '/acesso-plataforma-web',
    element: (
      <RequireAuth>
        <StaffWebOnlyRoute />
      </RequireAuth>
    ),
  },
  { path: '/aceite-termos', element: comingSoonElement() },
  { path: '/credenciamento-pendente', element: comingSoonElement() },
]
