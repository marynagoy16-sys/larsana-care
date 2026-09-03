import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { RequireAuth } from '@/routes/guards/RequireAuth'
import { RequireRole } from '@/routes/guards/RequireRole'
import { RequireCredentialingGate } from '@/routes/guards/RequireCredentialingGate'
import { ProfissionalEntryRedirect } from '@/routes/ProfissionalEntryRedirect'
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
const PPHomePage = lazyPP('PPHomePage')
const PPSessionDetailPage = lazyPP('PPSessionDetailPage')
const PPDemandsPage = lazyPP('PPDemandsPage')
const PPDemandDetailPage = lazy(() =>
  import('@/pages/profissional/demands/PPDemandDetailPage').then((m) => ({ default: m.PPDemandDetailPage })),
)
const PPDemandSchedulePage = lazy(() =>
  import('@/pages/profissional/demands/PPDemandSchedulePage').then((m) => ({ default: m.PPDemandSchedulePage })),
)
const PPEvolucaoPage = lazy(() =>
  import('@/pages/profissional/evolution/PPEvolucaoPage').then((m) => ({ default: m.PPEvolucaoPage })),
)
const PPEvolucoesPage = lazyPP('PPEvolucoesPage')
const PPEvolucaoNovaPage = lazyPP('PPEvolucaoNovaPage')
const PPRepassesPage = lazy(() =>
  import('@/pages/profissional/account/PPRepassesPage').then((m) => ({ default: m.PPRepassesPage })),
)
const PPRepasseDetailPage = lazy(() =>
  import('@/pages/profissional/account/PPRepasseDetailPage').then((m) => ({ default: m.PPRepasseDetailPage })),
)
const PPSubRepasseDetailPage = lazy(() =>
  import('@/pages/profissional/account/PPSubRepasseDetailPage').then((m) => ({
    default: m.PPSubRepasseDetailPage,
  })),
)
const PPPacientesPage = lazy(() =>
  import('@/pages/profissional/patients/PPPacientesPage').then((m) => ({ default: m.PPPacientesPage })),
)
const PPPacienteDetailPage = lazy(() =>
  import('@/pages/profissional/patients/PPPacienteDetailPage').then((m) => ({ default: m.PPPacienteDetailPage })),
)
const PPPacienteAssessmentPage = lazy(() =>
  import('@/pages/profissional/patients/PPPacienteAssessmentPage').then((m) => ({ default: m.PPPacienteAssessmentPage })),
)
const PPAvaliacoesPage = lazy(() =>
  import('@/pages/profissional/assessments/PPAvaliacoesPage').then((m) => ({ default: m.PPAvaliacoesPage })),
)
const PPAvaliacaoDetailPage = lazy(() =>
  import('@/pages/profissional/assessments/PPAvaliacaoDetailPage').then((m) => ({ default: m.PPAvaliacaoDetailPage })),
)
const PPContaPage = lazyPP('PPContaPage')
const PPAparenciaPage = lazyPP('PPAparenciaPage')
const PPCredenciamentoPage = lazyPP('PPCredenciamentoPage')
const PPNotificacoesPage = lazy(() =>
  import('@/pages/profissional/account/PPNotificacoesPage').then((m) => ({ default: m.PPNotificacoesPage })),
)
const PPSimuladorPage = lazy(() =>
  import('@/pages/profissional/account/PPSimuladorPage').then((m) => ({ default: m.PPSimuladorPage })),
)
const PPCartaoPage = lazy(() =>
  import('@/pages/profissional/account/PPCartaoPage').then((m) => ({ default: m.PPCartaoPage })),
)
const PPPerfilPage = lazy(() =>
  import('@/pages/profissional/account/PPPerfilPage').then((m) => ({ default: m.PPPerfilPage })),
)
const PPLegalDocumentsPage = lazy(() =>
  import('@/pages/profissional/account/PPLegalDocumentsPage').then((m) => ({
    default: m.PPLegalDocumentsPage,
  })),
)
const PPLegalDocumentDetailPage = lazy(() =>
  import('@/pages/profissional/account/PPLegalDocumentsPage').then((m) => ({
    default: m.PPLegalDocumentDetailPage,
  })),
)
import { AcademyLessonPage } from '@/pages/profissional/academy/AcademyLessonPage'
const AcademyHubPage = lazy(() => import('@/pages/profissional/academy/AcademyHubPage').then((m) => ({ default: m.AcademyHubPage })))
const AcademyModulePage = lazy(() => import('@/pages/profissional/academy/AcademyModulePage').then((m) => ({ default: m.AcademyModulePage })))
const AcademyCertificatesPage = lazy(() =>
  import('@/pages/profissional/academy/AcademyCertificatesPage').then((m) => ({ default: m.AcademyCertificatesPage })),
)

export const profissionalRoutes: RouteObject[] = [
  {
    path: '/profissional',
    element: ppRoute(<AppShell variant="profissional" />),
    children: [
      { index: true, element: <ProfissionalEntryRedirect /> },
      { path: 'inicio', element: ppRoute(<PPHomePage />) },
      { path: 'evolucao', element: ppRoute(<PPEvolucaoPage />) },
      { path: 'agenda', element: ppRoute(<PPAgendaPage />) },
      { path: 'agenda/:id', element: ppRoute(<PPSessionDetailPage />) },
      { path: 'demandas', element: ppRoute(<PPDemandsPage />) },
      { path: 'demandas/:id', element: ppRoute(<PPDemandDetailPage />) },
      { path: 'demandas/:id/agendar', element: ppRoute(<RequireCredentialingGate><PPDemandSchedulePage /></RequireCredentialingGate>) },
      { path: 'evolucoes', element: ppRoute(<PPEvolucoesPage />) },
      { path: 'evolucao/nova', element: ppRoute(<PPEvolucaoNovaPage />) },
      { path: 'evolucao/:id', element: ppRoute(<PPEvolucoesPage />) },
      { path: 'pacientes', element: ppRoute(<PPPacientesPage />) },
      { path: 'pacientes/:id', element: ppRoute(<PPPacienteDetailPage />) },
      { path: 'pacientes/:id/avaliacao', element: ppRoute(<PPPacienteAssessmentPage />) },
      { path: 'avaliacoes', element: ppRoute(<PPAvaliacoesPage />) },
      { path: 'avaliacoes/:id', element: ppRoute(<PPAvaliacaoDetailPage />) },
      { path: 'repasses', element: ppRoute(<PPRepassesPage />) },
      { path: 'repasses/sub/:id', element: ppRoute(<PPSubRepasseDetailPage />) },
      { path: 'repasses/:id', element: ppRoute(<PPRepasseDetailPage />) },
      { path: 'conta', element: ppRoute(<PPContaPage />) },
      { path: 'conta/aparencia', element: ppRoute(<PPAparenciaPage />) },
      { path: 'simulador', element: ppRoute(<PPSimuladorPage />) },
      { path: 'credenciamento', element: ppRoute(<PPCredenciamentoPage />) },
      { path: 'credenciamento/contrato', element: ppRoute(<PPCredenciamentoPage />) },
      { path: 'cartao', element: ppRoute(<PPCartaoPage />) },
      { path: 'perfil', element: ppRoute(<PPPerfilPage />) },
      { path: 'documentos', element: ppRoute(<PPLegalDocumentsPage />) },
      { path: 'documentos/:id', element: ppRoute(<PPLegalDocumentDetailPage />) },
      { path: 'notificacoes', element: ppRoute(<PPNotificacoesPage />) },
      { path: 'academy', element: ppRoute(<AcademyHubPage />) },
      { path: 'academy/modulos/:moduleId', element: ppRoute(<AcademyModulePage />) },
      { path: 'academy/aulas/:lessonId', element: ppRoute(<AcademyLessonPage />) },
      { path: 'academy/certificados', element: ppRoute(<AcademyCertificatesPage />) },
    ],
  },
]
