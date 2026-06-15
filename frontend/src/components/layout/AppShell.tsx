import { Suspense, useState } from 'react'
import { useSidebarCollapsed } from '@/hooks/useSidebarCollapsed'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  adminNavSections,
  adminNavTopItems,
  filterNavByRole,
  filterNavItems,
  getPageTitle,
  pacienteBottomNav,
  pacienteHeaderNav,
  profissionalBottomNav,
  profissionalNavSections,
  type NavItem,
} from '@/config/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileSidebar } from '@/components/layout/MobileSidebar'
import { Header } from '@/components/layout/Header'
import { DataLayer } from '@/components/layout/DataLayer'
import { DataLayerFooter } from '@/components/layout/DataLayerFooter'
import { ShellBottomNav } from '@/components/layout/ShellBottomNav'
import { PageFooterProvider, usePageFooter } from '@/contexts/PageFooterContext'
import { PageHeaderProvider } from '@/contexts/PageHeaderContext'
import { ImmersiveLayoutProvider, useImmersiveLayout } from '@/contexts/ImmersiveLayoutContext'
import type { UserRole } from '@/types/auth'

export type LayoutVariant = 'admin' | 'profissional' | 'paciente'

interface AppShellProps {
  variant: LayoutVariant
}

const subtitles: Record<LayoutVariant, string> = {
  admin: 'Admin',
  profissional: 'Profissional',
  paciente: 'Paciente',
}

function AppShellContent({
  variant,
  hasSidebar,
  pageTitle,
  setSidebarOpen,
  profBottom,
  pacBottom,
  pacHeader,
  showBottomNav,
}: {
  variant: LayoutVariant
  hasSidebar: boolean
  pageTitle: string
  setSidebarOpen: (open: boolean) => void
  profBottom: NavItem[]
  pacBottom: NavItem[]
  pacHeader: NavItem[]
  showBottomNav: boolean
}) {
  const { suppressBottomNav } = usePageFooter()
  const { immersive } = useImmersiveLayout()
  const showNav = showBottomNav && !suppressBottomNav

  return (
    <>
      <DataLayer reserveBottomNav={showNav}>
        <div
          className={
            immersive
              ? 'flex flex-1 flex-col min-h-0 min-w-0 overflow-hidden'
              : 'flex flex-1 flex-col min-h-0 min-w-0 overflow-y-auto overflow-x-hidden scrollbar-sidebar'
          }
        >
          {!immersive && (
            <div className="shell-content-x shell-content-y-top">
              <Header
                pageTitle={pageTitle}
                onMenuClick={hasSidebar ? () => setSidebarOpen(true) : undefined}
                showSearch={variant !== 'paciente'}
                horizontalNav={variant === 'paciente' ? pacHeader : undefined}
              />
            </div>
          )}
          <main
            className={
              immersive
                ? 'flex flex-1 flex-col min-h-0 min-w-0 overflow-hidden'
                : 'shell-content-x shell-content-y-bottom w-full min-w-0'
            }
          >
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </main>
        </div>

        <DataLayerFooter />
      </DataLayer>

      {variant === 'profissional' && showNav && <ShellBottomNav items={profBottom} fabIndex={2} />}
      {variant === 'paciente' && showNav && <ShellBottomNav items={pacBottom} />}
    </>
  )
}

export function AppShell({ variant }: AppShellProps) {
  return (
    <ImmersiveLayoutProvider>
      <AppShellInner variant={variant} />
    </ImmersiveLayoutProvider>
  )
}

function AppShellInner({ variant }: AppShellProps) {
  const { immersive } = useImmersiveLayout()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { collapsed: sidebarCollapsed, toggle: toggleSidebarCollapse } = useSidebarCollapsed()
  const { role } = useAuth()
  const location = useLocation()
  const pageTitle = getPageTitle(location.pathname)

  const userRole = role as UserRole

  const adminSections = filterNavByRole(adminNavSections, userRole)
  const adminTopItems = filterNavItems(adminNavTopItems, userRole)
  const profSections = filterNavByRole(profissionalNavSections, userRole)
  const pacHeader = filterNavItems(pacienteHeaderNav, userRole)
  const profBottom = filterNavItems(profissionalBottomNav, userRole)
  const pacBottom = filterNavItems(pacienteBottomNav, userRole)

  const hasSidebar = variant === 'admin' || variant === 'profissional'
  const sections = variant === 'admin' ? adminSections : profSections
  const topItems = variant === 'admin' ? adminTopItems : undefined
  const showBottomNav = (variant === 'profissional' || variant === 'paciente') && !immersive

  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-background">
      {hasSidebar && (
        <>
          <Sidebar
            sections={sections}
            topItems={topItems}
            subtitle={subtitles[variant]}
            collapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebarCollapse}
          />
          <MobileSidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            sections={sections}
            topItems={topItems}
            subtitle={subtitles[variant]}
          />
        </>
      )}

      <div className="flex flex-1 flex-col min-h-0 min-w-0 overflow-hidden">
        <PageHeaderProvider>
          <PageFooterProvider>
            <AppShellContent
              variant={variant}
              hasSidebar={hasSidebar}
              pageTitle={pageTitle}
              setSidebarOpen={setSidebarOpen}
              profBottom={profBottom}
              pacBottom={pacBottom}
              pacHeader={pacHeader}
              showBottomNav={showBottomNav}
            />
          </PageFooterProvider>
        </PageHeaderProvider>
      </div>
    </div>
  )
}
