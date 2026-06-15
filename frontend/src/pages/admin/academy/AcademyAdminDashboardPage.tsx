import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { GraduationCap, Pill, Settings, Users, BookOpen, ChevronRight } from 'lucide-react'
import { AnalyticsStatCard } from '@/components/dashboard/AnalyticsStatCard'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { DashboardPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getAcademySettings } from '@/services/academy'
import { academyAdminKeys, getAcademyDashboardStats } from '@/services/academyAdmin'
import { GATE_PRESET_LABELS } from '@/types/academy'

const SHORTCUTS = [
  { label: 'Cursos', description: 'Gerenciar formação PP', href: '/admin/academy/cursos', icon: BookOpen },
  { label: 'Matrículas', description: 'Progresso dos profissionais', href: '/admin/academy/matriculas', icon: Users },
  { label: 'LarsanaPill', description: 'Conteúdos PHIL para pacientes', href: '/admin/larsanapill', icon: Pill },
  { label: 'Configuração gates', description: 'Presets e regras operacionais', href: '/admin/academy/config', icon: Settings },
]

export function AcademyAdminDashboardPage() {
  const navigate = useNavigate()

  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ['admin', 'academy', 'settings'],
    queryFn: getAcademySettings,
  })

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: academyAdminKeys.dashboard,
    queryFn: getAcademyDashboardStats,
  })

  if (loadingSettings || loadingStats) return <DashboardPageSkeleton />

  const completionRate =
    stats && stats.enrollments > 0 ? Math.round((stats.completed / stats.enrollments) * 100) : 0

  return (
    <>
      <PageHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap min-w-0 flex-1">
          <div className="min-w-0">
            <h1 className="font-display font-bold text-xl lg:text-2xl leading-tight tracking-tight">Academy</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {settings
                ? `Preset ativo: ${GATE_PRESET_LABELS[settings.active_preset]}`
                : 'Gestão de formação e conteúdos educacionais'}
            </p>
          </div>
          <Button variant="outline" size="sm" className="rounded-full shrink-0" onClick={() => navigate('/admin/academy/config')}>
            <Settings className="mr-1 h-4 w-4" /> Configurar gates
          </Button>
        </div>
      </PageHeader>

      <CrudScrollPageLayout>
        <CascadeReveal className="space-y-4">
          <CascadeItem>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AnalyticsStatCard
              label="Cursos"
              icon={GraduationCap}
              value={stats?.courses ?? 0}
              showLinkIcon={false}
            />
            <AnalyticsStatCard
              label="Matrículas"
              icon={Users}
              value={stats?.enrollments ?? 0}
              showLinkIcon={false}
            />
            <AnalyticsStatCard
              label="Taxa de conclusão"
              icon={BookOpen}
              value={`${completionRate}%`}
              showLinkIcon={false}
              footer={
                <p className="text-xs text-muted-foreground">
                  {stats?.completed ?? 0} concluídas de {stats?.enrollments ?? 0}
                </p>
              }
            />
            <AnalyticsStatCard
              label="Categorias PHIL"
              icon={Pill}
              value={stats?.categories ?? 0}
              showLinkIcon={false}
            />
          </div>
        </CascadeItem>

        <CascadeItem>
          <div className="grid gap-3 sm:grid-cols-2">
            {SHORTCUTS.map((item) => (
              <Card
                key={item.href}
                className="cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
                onClick={() => navigate(item.href)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CascadeItem>
      </CascadeReveal>
    </CrudScrollPageLayout>
    </>
  )
}
