import type { RouteObject } from 'react-router-dom'
import { lazy } from 'react'
import { GuestOnly } from '@/routes/guards/GuestOnly'
import { comingSoonElement } from '@/routes/createComingSoonElement'
import { LoginPageLazy } from '@/pages/auth/LoginPageLazy'

const SignupPageLazy = lazy(() =>
  import('@/pages/auth/SignupPage').then((m) => ({ default: m.SignupPage })),
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
  { path: '/recuperar-senha', element: comingSoonElement() },
  { path: '/redefinir-senha/:token', element: comingSoonElement() },
  { path: '/aceite-termos', element: comingSoonElement() },
  { path: '/credenciamento-pendente', element: comingSoonElement() },
]
