import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { RequireAuth } from '@/routes/guards/RequireAuth'
import { RequireRole } from '@/routes/guards/RequireRole'
import { AppShell } from '@/components/layout/AppShell'

function pacienteRoute(element: React.ReactNode) {
  return (
    <RequireAuth>
      <RequireRole allowed={['paciente']}>{element}</RequireRole>
    </RequireAuth>
  )
}

function lazyPaciente(exportName: keyof typeof import('@/pages/paciente/modulePages')) {
  return lazy(() => import('@/pages/paciente/modulePages').then((m) => ({ default: m[exportName] })))
}

const PacienteHomePage = lazyPaciente('PacienteHomePage')
const PacienteTratamentoPage = lazyPaciente('PacienteTratamentoPage')
const PacienteSolicitarPage = lazy(() =>
  import('@/pages/paciente/PacienteSolicitarPage').then((m) => ({ default: m.PacienteSolicitarPage })),
)
const PacienteCicloDetailPage = lazyPaciente('PacienteCicloDetailPage')
const PacientePagamentosPage = lazyPaciente('PacientePagamentosPage')
const PacientePagamentoDetailPage = lazyPaciente('PacientePagamentoDetailPage')
const PacientePropostaPage = lazyPaciente('PacientePropostaPage')
const PacienteDocumentosPage = lazyPaciente('PacienteDocumentosPage')
const PacienteAceitePage = lazyPaciente('PacienteAceitePage')
const PacienteNpsPage = lazyPaciente('PacienteNpsPage')
const PacienteContaPage = lazyPaciente('PacienteContaPage')
const PacienteAparenciaPage = lazyPaciente('PacienteAparenciaPage')
const PacientePerfilPage = lazyPaciente('PacientePerfilPage')
const PacienteNotificacoesPage = lazyPaciente('PacienteNotificacoesPage')
const PacienteTermosPage = lazyPaciente('PacienteTermosPage')
const PacienteTermoDetailPage = lazyPaciente('PacienteTermoDetailPage')
const PacienteAjudaPage = lazyPaciente('PacienteAjudaPage')
const LarsanaPillHubPage = lazy(() => import('@/pages/paciente/larsanapill/LarsanaPillHubPage').then((m) => ({ default: m.LarsanaPillHubPage })))
const LarsanaPillCategoryPage = lazy(() =>
  import('@/pages/paciente/larsanapill/LarsanaPillCategoryPage').then((m) => ({ default: m.LarsanaPillCategoryPage })),
)
const LarsanaPillContentPage = lazy(() =>
  import('@/pages/paciente/larsanapill/LarsanaPillContentPage').then((m) => ({ default: m.LarsanaPillContentPage })),
)
const LarsanaPillContentRedirectPage = lazy(() =>
  import('@/pages/paciente/larsanapill/LarsanaPillContentRedirectPage').then((m) => ({
    default: m.LarsanaPillContentRedirectPage,
  })),
)
const WeeklyPlanSalesPage = lazy(() =>
  import('@/pages/paciente/larsanapill/WeeklyPlanSalesPage').then((m) => ({ default: m.WeeklyPlanSalesPage })),
)
const WeeklyPlanPlayerPage = lazy(() =>
  import('@/pages/paciente/larsanapill/WeeklyPlanPlayerPage').then((m) => ({ default: m.WeeklyPlanPlayerPage })),
)

export const pacienteRoutes: RouteObject[] = [
  {
    path: '/paciente',
    element: pacienteRoute(<AppShell variant="paciente" />),
    children: [
      { index: true, element: pacienteRoute(<PacienteHomePage />) },
      { path: 'solicitar', element: pacienteRoute(<PacienteSolicitarPage />) },
      { path: 'tratamento', element: pacienteRoute(<PacienteTratamentoPage />) },
      { path: 'tratamento/ciclo/:id', element: pacienteRoute(<PacienteCicloDetailPage />) },
      { path: 'pagamentos', element: pacienteRoute(<PacientePagamentosPage />) },
      { path: 'pagamentos/:id', element: pacienteRoute(<PacientePagamentoDetailPage />) },
      { path: 'proposta', element: pacienteRoute(<PacientePropostaPage />) },
      { path: 'documentos', element: pacienteRoute(<PacienteDocumentosPage />) },
      { path: 'aceite-inicial', element: pacienteRoute(<PacienteAceitePage />) },
      { path: 'nps/:cicloId', element: pacienteRoute(<PacienteNpsPage />) },
      { path: 'conta', element: pacienteRoute(<PacienteContaPage />) },
      { path: 'conta/aparencia', element: pacienteRoute(<PacienteAparenciaPage />) },
      { path: 'conta/perfil', element: pacienteRoute(<PacientePerfilPage />) },
      { path: 'termos', element: pacienteRoute(<PacienteTermosPage />) },
      { path: 'termos/:id', element: pacienteRoute(<PacienteTermoDetailPage />) },
      { path: 'ajuda', element: pacienteRoute(<PacienteAjudaPage />) },
      { path: 'larsanapill', element: pacienteRoute(<LarsanaPillHubPage />) },
      { path: 'larsanapill/categoria/:slug', element: pacienteRoute(<LarsanaPillCategoryPage />) },
      { path: 'larsanapill/planos/:slug', element: pacienteRoute(<WeeklyPlanSalesPage />) },
      { path: 'larsanapill/planos/:slug/dia/:dayIndex', element: pacienteRoute(<WeeklyPlanPlayerPage />) },
      { path: 'larsanapill/categoria/:slug/conteudo/:id', element: pacienteRoute(<LarsanaPillContentPage />) },
      { path: 'larsanapill/conteudo/:id', element: pacienteRoute(<LarsanaPillContentRedirectPage />) },
      { path: 'notificacoes', element: pacienteRoute(<PacienteNotificacoesPage />) },
    ],
  },
]
