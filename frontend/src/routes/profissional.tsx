import { lazy } from 'react'
import { Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { RequireAuth } from '@/routes/guards/RequireAuth'
import { RequireRole } from '@/routes/guards/RequireRole'
import { AppShell } from '@/components/layout/AppShell'

function ppRoute(element: React.ReactNode) {
  return (
    <RequireAuth>
      <RequireRole allowed={['pp']}>{element}</RequireRole>
    </RequireAuth>
  )
}

function lazyPP(exportName: keyof typeof import('@/pages/profissional/modulePages')) {
  return lazy(() => import('@/pages/profissional/modulePages').then((m) => ({ default: m[exportName] })))
}

const PPAgendaPage = lazyPP('PPAgendaPage')
const PPSessionDetailPage = lazyPP('PPSessionDetailPage')
const PPDemandsPage = lazyPP('PPDemandsPage')
const PPDemandDetailPage = lazy(() =>
  import('@/pages/profissional/demands/PPDemandDetailPage').then((m) => ({ default: m.PPDemandDetailPage })),
)
const PPEvolucoesPage = lazyPP('PPEvolucoesPage')
const PPEvolucaoNovaPage = lazyPP('PPEvolucaoNovaPage')
const PPRepassesPage = lazyPP('PPRepassesPage')
const PPRepasseDetailPage = lazyPP('PPRepasseDetailPage')
const PPPacientesPage = lazy(() =>
  import('@/pages/profissional/patients/PPPacientesPage').then((m) => ({ default: m.PPPacientesPage })),
)
const PPPacienteDetailPage = lazy(() =>
  import('@/pages/profissional/patients/PPPacienteDetailPage').then((m) => ({ default: m.PPPacienteDetailPage })),
)
const PPAvaliacoesPage = lazy(() =>
  import('@/pages/profissional/assessments/PPAvaliacoesPage').then((m) => ({ default: m.PPAvaliacoesPage })),
)
const PPAvaliacaoDetailPage = lazy(() =>
  import('@/pages/profissional/assessments/PPAvaliacaoDetailPage').then((m) => ({ default: m.PPAvaliacaoDetailPage })),
)
const PPCredenciamentoPage = lazyPP('PPCredenciamentoPage')
const PPPerfilPage = lazyPP('PPPerfilPage')
const PPSimuladorPage = lazyPP('PPSimuladorPage')
const PPCartaoPage = lazyPP('PPCartaoPage')
const PPNotificacoesPage = lazyPP('PPNotificacoesPage')

export const profissionalRoutes: RouteObject[] = [
  {
    path: '/profissional',
    element: ppRoute(<AppShell variant="profissional" />),
    children: [
      { index: true, element: <Navigate to="/profissional/agenda" replace /> },
      { path: 'agenda', element: ppRoute(<PPAgendaPage />) },
      { path: 'agenda/:sessaoId', element: ppRoute(<PPSessionDetailPage />) },
      { path: 'demandas', element: ppRoute(<PPDemandsPage />) },
      { path: 'demandas/:id', element: ppRoute(<PPDemandDetailPage />) },
      { path: 'evolucoes', element: ppRoute(<PPEvolucoesPage />) },
      { path: 'evolucao/nova', element: ppRoute(<PPEvolucaoNovaPage />) },
      { path: 'evolucao/:id', element: ppRoute(<PPEvolucoesPage />) },
      { path: 'pacientes', element: ppRoute(<PPPacientesPage />) },
      { path: 'pacientes/:id', element: ppRoute(<PPPacienteDetailPage />) },
      { path: 'avaliacoes', element: ppRoute(<PPAvaliacoesPage />) },
      { path: 'avaliacoes/:id', element: ppRoute(<PPAvaliacaoDetailPage />) },
      { path: 'repasses', element: ppRoute(<PPRepassesPage />) },
      { path: 'repasses/:id', element: ppRoute(<PPRepasseDetailPage />) },
      { path: 'simulador', element: ppRoute(<PPSimuladorPage />) },
      { path: 'credenciamento', element: ppRoute(<PPCredenciamentoPage />) },
      { path: 'credenciamento/contrato', element: ppRoute(<PPCredenciamentoPage />) },
      { path: 'cartao', element: ppRoute(<PPCartaoPage />) },
      { path: 'perfil', element: ppRoute(<PPPerfilPage />) },
      { path: 'notificacoes', element: ppRoute(<PPNotificacoesPage />) },
    ],
  },
]
