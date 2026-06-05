import type { RouteObject } from 'react-router-dom'
import { GuestOnly } from '@/routes/guards/GuestOnly'
import { comingSoonElement } from '@/routes/createComingSoonElement'
import { LoginPageLazy } from '@/pages/auth/LoginPageLazy'

export const publicRoutes: RouteObject[] = [
  {
    path: '/login',
    element: (
      <GuestOnly>
        <LoginPageLazy />
      </GuestOnly>
    ),
  },
  { path: '/recuperar-senha', element: comingSoonElement() },
  { path: '/redefinir-senha/:token', element: comingSoonElement() },
  { path: '/aceite-termos', element: comingSoonElement() },
  { path: '/credenciamento-pendente', element: comingSoonElement() },
]
