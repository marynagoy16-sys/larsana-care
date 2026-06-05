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
const PacienteCicloDetailPage = lazyPaciente('PacienteCicloDetailPage')
const PacientePagamentosPage = lazyPaciente('PacientePagamentosPage')
const PacientePagamentoDetailPage = lazyPaciente('PacientePagamentoDetailPage')
const PacientePropostaPage = lazyPaciente('PacientePropostaPage')
const PacienteDocumentosPage = lazyPaciente('PacienteDocumentosPage')
const PacienteAceitePage = lazyPaciente('PacienteAceitePage')
const PacienteNpsPage = lazyPaciente('PacienteNpsPage')
const PacienteContaPage = lazyPaciente('PacienteContaPage')
const PacienteAjudaPage = lazyPaciente('PacienteAjudaPage')

export const pacienteRoutes: RouteObject[] = [
  {
    path: '/paciente',
    element: pacienteRoute(<AppShell variant="paciente" />),
    children: [
      { index: true, element: pacienteRoute(<PacienteHomePage />) },
      { path: 'tratamento', element: pacienteRoute(<PacienteTratamentoPage />) },
      { path: 'tratamento/ciclo/:id', element: pacienteRoute(<PacienteCicloDetailPage />) },
      { path: 'pagamentos', element: pacienteRoute(<PacientePagamentosPage />) },
      { path: 'pagamentos/:id', element: pacienteRoute(<PacientePagamentoDetailPage />) },
      { path: 'proposta', element: pacienteRoute(<PacientePropostaPage />) },
      { path: 'documentos', element: pacienteRoute(<PacienteDocumentosPage />) },
      { path: 'aceite-inicial', element: pacienteRoute(<PacienteAceitePage />) },
      { path: 'nps/:cicloId', element: pacienteRoute(<PacienteNpsPage />) },
      { path: 'conta', element: pacienteRoute(<PacienteContaPage />) },
      { path: 'ajuda', element: pacienteRoute(<PacienteAjudaPage />) },
      { path: 'notificacoes', element: pacienteRoute(<PacienteHomePage />) },
    ],
  },
]
