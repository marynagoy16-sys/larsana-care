import type { RouteObject } from 'react-router-dom'
import { lazy } from 'react'
import { GuestOnly } from '@/routes/guards/GuestOnly'
import { comingSoonElement } from '@/routes/createComingSoonElement'
import { LoginPageLazy } from '@/pages/auth/LoginPageLazy'

const SignupPageLazy = lazy(() =>
  import('@/pages/auth/SignupPage').then((m) => ({ default: m.SignupPage })),
)
const ForgotPasswordPageLazy = lazy(() =>
  import('@/pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
)
const ResetPasswordPageLazy = lazy(() =>
  import('@/pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
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
  { path: '/aceite-termos', element: comingSoonElement() },
  { path: '/credenciamento-pendente', element: comingSoonElement() },
]
