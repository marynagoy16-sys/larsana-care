import { createBrowserRouter } from 'react-router-dom'
import { RoleRedirect } from '@/routes/guards/RoleRedirect'
import { NotFoundPage } from '@/pages/shared/NotFoundPage'
import { publicRoutes } from '@/routes/public'
import { adminRoutes } from '@/routes/admin'
import { profissionalRoutes } from '@/routes/profissional'
import { pacienteRoutes } from '@/routes/paciente'

export const router = createBrowserRouter([
  { path: '/', element: <RoleRedirect /> },
  ...publicRoutes,
  ...adminRoutes,
  ...profissionalRoutes,
  ...pacienteRoutes,
  { path: '*', element: <NotFoundPage /> },
])

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    window.location.reload()
  })
}
