import { lazy } from 'react'
import type { ReactNode } from 'react'
import type { RouteObject } from 'react-router-dom'
import { RequireAuth } from '@/routes/guards/RequireAuth'
import { RequireRole } from '@/routes/guards/RequireRole'
import { AppShell } from '@/components/layout/AppShell'
import type { UserRole } from '@/types/auth'

const staffRoles: UserRole[] = ['admin', 'financeiro', 'gestao']
const operacaoRoles: UserRole[] = ['admin', 'gestao']
const financeiroRoles: UserRole[] = ['admin', 'financeiro']
const adminOnly: UserRole[] = ['admin']

function staffRoute(children: ReactNode, allowed: UserRole[] = staffRoles) {
  return (
    <RequireAuth>
      <RequireRole allowed={allowed}>{children}</RequireRole>
    </RequireAuth>
  )
}

const PatientListPage = lazy(() => import('@/pages/admin/patients/PatientListPage').then((m) => ({ default: m.PatientListPage })))
const PatientDetailPage = lazy(() => import('@/pages/admin/patients/PatientDetailPage').then((m) => ({ default: m.PatientDetailPage })))
const PatientEditPage = lazy(() => import('@/pages/admin/patients/PatientEditPage').then((m) => ({ default: m.PatientEditPage })))
const ProfessionalsPage = lazy(() => import('@/pages/admin/ProfessionalsPage').then((m) => ({ default: m.ProfessionalsPage })))
function lazyAdmin(exportName: keyof typeof import('@/pages/admin/modulePages')) {
  return lazy(() => import('@/pages/admin/modulePages').then((m) => ({ default: m[exportName] })))
}

const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const AssessmentsPage = lazyAdmin('AssessmentsPage')
const AssessmentDetailPage = lazyAdmin('AssessmentDetailPage')
const CyclesPage = lazyAdmin('CyclesPage')
const CycleDetailPage = lazy(() => import('@/pages/admin/cycles/CycleDetailPage').then((m) => ({ default: m.CycleDetailPage })))
const DemandDetailPage = lazy(() => import('@/pages/admin/demands/DemandDetailPage').then((m) => ({ default: m.DemandDetailPage })))
const MedicalRecordsPage = lazyAdmin('MedicalRecordsPage')
const MedicalRecordPatientPage = lazyAdmin('MedicalRecordPatientPage')
const CredenciamentoPage = lazyAdmin('CredenciamentoPage')
const CredenciamentoDetailPage = lazyAdmin('CredenciamentoDetailPage')
const DemandsPage = lazyAdmin('DemandsPage')
const ChargesPage = lazyAdmin('ChargesPage')
const ChargeDetailPage = lazyAdmin('ChargeDetailPage')
const TransfersPage = lazyAdmin('TransfersPage')
const TransferDetailPage = lazyAdmin('TransferDetailPage')
const CaixaPage = lazyAdmin('CaixaPage')
const DelumaExportPage = lazyAdmin('DelumaExportPage')
const ReportsHubPage = lazyAdmin('ReportsHubPage')
const FaturamentoReportPage = lazyAdmin('FaturamentoReportPage')
const ConversaoReportPage = lazyAdmin('ConversaoReportPage')
const HorasCrefitoReportPage = lazyAdmin('HorasCrefitoReportPage')
const RepassesAgingReportPage = lazyAdmin('RepassesAgingReportPage')
const RegionsConfigPage = lazy(() =>
  import('@/pages/admin/regions/RegionsConfigPage').then((m) => ({ default: m.RegionsConfigPage })),
)
const PricingConfigPage = lazy(() =>
  import('@/pages/admin/pricing/PricingConfigPage').then((m) => ({ default: m.PricingConfigPage })),
)
const TermsConfigPage = lazyAdmin('TermsConfigPage')
const ContractsConfigPage = lazyAdmin('ContractsConfigPage')
const UsersConfigPage = lazyAdmin('UsersConfigPage')
const AuditPage = lazyAdmin('AuditPage')
const SupportPage = lazyAdmin('SupportPage')
const SettingsPage = lazyAdmin('SettingsPage')
const ProfessionalDetailPage = lazyAdmin('ProfessionalDetailPage')
const TreatmentPausesPage = lazyAdmin('TreatmentPausesPage')
const NpsReportPage = lazyAdmin('NpsReportPage')

export const adminRoutes: RouteObject[] = [
  {
    path: '/admin',
    element: staffRoute(<AppShell variant="admin" />),
    children: [
      { index: true, element: staffRoute(<DashboardPage />) },
      { path: 'pacientes', element: staffRoute(<PatientListPage />, operacaoRoles) },
      { path: 'pacientes/novo', element: staffRoute(<PatientListPage />, operacaoRoles) },
      { path: 'pacientes/:id', element: staffRoute(<PatientDetailPage />, operacaoRoles) },
      { path: 'pacientes/:id/editar', element: staffRoute(<PatientEditPage />, operacaoRoles) },
      { path: 'avaliacoes', element: staffRoute(<AssessmentsPage />, operacaoRoles) },
      { path: 'avaliacoes/:id', element: staffRoute(<AssessmentDetailPage />, operacaoRoles) },
      { path: 'ciclos', element: staffRoute(<CyclesPage />, operacaoRoles) },
      { path: 'ciclos/novo', element: staffRoute(<CyclesPage />, operacaoRoles) },
      { path: 'ciclos/:id', element: staffRoute(<CycleDetailPage />, operacaoRoles) },
      { path: 'pausas', element: staffRoute(<TreatmentPausesPage />, operacaoRoles) },
      { path: 'prontuarios', element: staffRoute(<MedicalRecordsPage />, operacaoRoles) },
      { path: 'prontuarios/:pacienteId', element: staffRoute(<MedicalRecordPatientPage />, operacaoRoles) },
      { path: 'profissionais', element: staffRoute(<ProfessionalsPage />, operacaoRoles) },
      { path: 'profissionais/:id', element: staffRoute(<ProfessionalDetailPage />, operacaoRoles) },
      { path: 'credenciamento', element: staffRoute(<CredenciamentoPage />, operacaoRoles) },
      { path: 'credenciamento/:id', element: staffRoute(<CredenciamentoDetailPage />, operacaoRoles) },
      { path: 'demandas', element: staffRoute(<DemandsPage />, operacaoRoles) },
      { path: 'demandas/:id', element: staffRoute(<DemandDetailPage />, operacaoRoles) },
      { path: 'cobrancas', element: staffRoute(<ChargesPage />, financeiroRoles) },
      { path: 'cobrancas/:id', element: staffRoute(<ChargeDetailPage />, financeiroRoles) },
      { path: 'repasses', element: staffRoute(<TransfersPage />, financeiroRoles) },
      { path: 'repasses/:id', element: staffRoute(<TransferDetailPage />, financeiroRoles) },
      { path: 'caixa', element: staffRoute(<CaixaPage />, financeiroRoles) },
      { path: 'exportacao-deluma', element: staffRoute(<DelumaExportPage />, financeiroRoles) },
      { path: 'relatorios', element: staffRoute(<ReportsHubPage />) },
      { path: 'relatorios/faturamento', element: staffRoute(<FaturamentoReportPage />, financeiroRoles) },
      { path: 'relatorios/conversao', element: staffRoute(<ConversaoReportPage />, operacaoRoles) },
      { path: 'relatorios/horas-crefito', element: staffRoute(<HorasCrefitoReportPage />, operacaoRoles) },
      { path: 'relatorios/nps', element: staffRoute(<NpsReportPage />, operacaoRoles) },
      { path: 'relatorios/repasses-aging', element: staffRoute(<RepassesAgingReportPage />, financeiroRoles) },
      { path: 'config/precos', element: staffRoute(<PricingConfigPage />, adminOnly) },
      { path: 'config/termos', element: staffRoute(<TermsConfigPage />, adminOnly) },
      { path: 'config/contratos', element: staffRoute(<ContractsConfigPage />, adminOnly) },
      { path: 'config/regioes', element: staffRoute(<RegionsConfigPage />, operacaoRoles) },
      { path: 'config/usuarios', element: staffRoute(<UsersConfigPage />, adminOnly) },
      { path: 'config/auditoria', element: staffRoute(<AuditPage />, ['admin', 'gestao']) },
      { path: 'suporte', element: staffRoute(<SupportPage />, adminOnly) },
      { path: 'configuracoes', element: staffRoute(<SettingsPage />) },
    ],
  },
]
