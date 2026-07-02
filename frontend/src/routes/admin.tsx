import { lazy } from 'react'
import type { ReactNode } from 'react'
import { Navigate, useParams, type RouteObject } from 'react-router-dom'
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
const PatientProntuarioPage = lazy(() => import('@/pages/admin/patients/PatientProntuarioPage').then((m) => ({ default: m.PatientProntuarioPage })))
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
const CredenciamentoPage = lazy(() =>
  import('@/pages/admin/credentialing/CredenciamentoListPage').then((m) => ({ default: m.CredenciamentoListPage })),
)
const CredenciamentoDetailPage = lazy(() =>
  import('@/pages/admin/credentialing/CredenciamentoDetailPage').then((m) => ({ default: m.CredenciamentoDetailPage })),
)
const DemandsPage = lazy(() =>
  import('@/pages/admin/demands/DemandsListPage').then((m) => ({ default: m.DemandsListPage })),
)
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
const PpPointsConfigPage = lazy(() =>
  import('@/pages/admin/config/PpPointsConfigPage').then((m) => ({ default: m.PpPointsConfigPage })),
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
const TreatmentPausesPage = lazyAdmin('TreatmentPausesPage')
const TreatmentPauseDetailPage = lazyAdmin('TreatmentPauseDetailPage')
const NpsReportPage = lazyAdmin('NpsReportPage')
const AcademyAdminDashboardPage = lazy(() =>
  import('@/pages/admin/academy/AcademyAdminDashboardPage').then((m) => ({ default: m.AcademyAdminDashboardPage })),
)
const AcademyCoursesPage = lazy(() =>
  import('@/pages/admin/academy/AcademyCoursesPage').then((m) => ({ default: m.AcademyCoursesPage })),
)
const AcademyCourseDetailPage = lazy(() =>
  import('@/pages/admin/academy/AcademyCourseDetailPage').then((m) => ({ default: m.AcademyCourseDetailPage })),
)
const AcademyEnrollmentsPage = lazy(() =>
  import('@/pages/admin/academy/AcademyEnrollmentsPage').then((m) => ({ default: m.AcademyEnrollmentsPage })),
)
const AcademyConfigPage = lazy(() =>
  import('@/pages/admin/academy/AcademyConfigPage').then((m) => ({ default: m.AcademyConfigPage })),
)
const AcademyExemptionsPage = lazy(() =>
  import('@/pages/admin/academy/AcademyExemptionsPage').then((m) => ({ default: m.AcademyExemptionsPage })),
)
const AcademyConfigHistoryPage = lazy(() =>
  import('@/pages/admin/academy/AcademyConfigHistoryPage').then((m) => ({ default: m.AcademyConfigHistoryPage })),
)
const LarsanaPillAdminPage = lazy(() =>
  import('@/pages/admin/academy/LarsanaPillAdminPage').then((m) => ({ default: m.LarsanaPillAdminPage })),
)
const LarsanaPillCategoryDetailPage = lazy(() =>
  import('@/pages/admin/academy/LarsanaPillCategoryDetailPage').then((m) => ({ default: m.LarsanaPillCategoryDetailPage })),
)

function LegacyCredenciamentoRedirect() {
  const { id } = useParams<{ id?: string }>()
  return <Navigate to={id ? `/admin/profissionais/${id}` : '/admin/profissionais'} replace />
}

export const adminRoutes: RouteObject[] = [
  {
    path: '/admin',
    element: staffRoute(<AppShell variant="admin" />),
    children: [
      { index: true, element: staffRoute(<DashboardPage />) },
      { path: 'pacientes', element: staffRoute(<PatientListPage />, operacaoRoles) },
      { path: 'pacientes/novo', element: <Navigate to="/admin/pacientes" replace /> },
      { path: 'pacientes/:id', element: staffRoute(<PatientDetailPage />, operacaoRoles) },
      { path: 'pacientes/:id/prontuario', element: staffRoute(<PatientProntuarioPage />, operacaoRoles) },
      { path: 'pacientes/:id/editar', element: staffRoute(<PatientEditPage />, operacaoRoles) },
      { path: 'avaliacoes', element: staffRoute(<AssessmentsPage />, operacaoRoles) },
      { path: 'avaliacoes/:id', element: staffRoute(<AssessmentDetailPage />, operacaoRoles) },
      { path: 'ciclos', element: staffRoute(<CyclesPage />, operacaoRoles) },
      { path: 'ciclos/novo', element: <Navigate to="/admin/ciclos" replace /> },
      { path: 'ciclos/:id', element: staffRoute(<CycleDetailPage />, operacaoRoles) },
      { path: 'pausas', element: staffRoute(<TreatmentPausesPage />, operacaoRoles) },
      { path: 'pausas/:id', element: staffRoute(<TreatmentPauseDetailPage />, operacaoRoles) },
      { path: 'prontuarios', element: staffRoute(<MedicalRecordsPage />, operacaoRoles) },
      { path: 'prontuarios/:id', element: staffRoute(<MedicalRecordPatientPage />, operacaoRoles) },
      { path: 'profissionais', element: staffRoute(<CredenciamentoPage />, operacaoRoles) },
      { path: 'profissionais/:id', element: staffRoute(<CredenciamentoDetailPage />, operacaoRoles) },
      { path: 'credenciamento', element: staffRoute(<LegacyCredenciamentoRedirect />, operacaoRoles) },
      { path: 'credenciamento/:id', element: staffRoute(<LegacyCredenciamentoRedirect />, operacaoRoles) },
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
      { path: 'config/pontos-pp', element: staffRoute(<PpPointsConfigPage />, adminOnly) },
      { path: 'config/termos', element: staffRoute(<TermsConfigPage />, adminOnly) },
      { path: 'config/contratos', element: staffRoute(<ContractsConfigPage />, adminOnly) },
      { path: 'config/regioes', element: staffRoute(<RegionsConfigPage />, operacaoRoles) },
      { path: 'config/usuarios', element: staffRoute(<UsersConfigPage />, adminOnly) },
      { path: 'config/auditoria', element: staffRoute(<AuditPage />, ['admin', 'gestao']) },
      { path: 'academy', element: staffRoute(<AcademyAdminDashboardPage />, operacaoRoles) },
      { path: 'academy/cursos', element: staffRoute(<AcademyCoursesPage />, operacaoRoles) },
      { path: 'academy/cursos/:id', element: staffRoute(<AcademyCourseDetailPage />, operacaoRoles) },
      { path: 'academy/matriculas', element: staffRoute(<AcademyEnrollmentsPage />, operacaoRoles) },
      { path: 'academy/config', element: staffRoute(<AcademyConfigPage />, adminOnly) },
      { path: 'academy/config/excecoes', element: staffRoute(<AcademyExemptionsPage />, adminOnly) },
      { path: 'academy/config/historico', element: staffRoute(<AcademyConfigHistoryPage />, adminOnly) },
      { path: 'larsanapill', element: staffRoute(<LarsanaPillAdminPage />, operacaoRoles) },
      { path: 'larsanapill/categorias/:id', element: staffRoute(<LarsanaPillCategoryDetailPage />, operacaoRoles) },
      { path: 'suporte', element: staffRoute(<SupportPage />, adminOnly) },
      { path: 'configuracoes', element: staffRoute(<SettingsPage />) },
    ],
  },
]
