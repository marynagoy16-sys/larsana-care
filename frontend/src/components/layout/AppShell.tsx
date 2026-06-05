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
} from '@/config/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileSidebar } from '@/components/layout/MobileSidebar'
import { Header } from '@/components/layout/Header'
import { DataLayer } from '@/components/layout/DataLayer'
import { DataLayerFooter } from '@/components/layout/DataLayerFooter'
import { BottomNav } from '@/components/layout/BottomNav'
import { PageFooterProvider } from '@/contexts/PageFooterContext'
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

export function AppShell({ variant }: AppShellProps) {
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
  const showBottomNav = variant === 'profissional' || variant === 'paciente'

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
        <PageFooterProvider>
          <DataLayer reserveBottomNav={showBottomNav}>
            <div className="flex flex-1 flex-col min-h-0 min-w-0 overflow-y-auto overflow-x-hidden scrollbar-sidebar">
              <div className="shell-content-x shell-content-y-top">
                <Header
                  pageTitle={pageTitle}
                  onMenuClick={hasSidebar ? () => setSidebarOpen(true) : undefined}
                  showSearch={variant !== 'paciente'}
                  horizontalNav={variant === 'paciente' ? pacHeader : undefined}
                />
              </div>
              <main className="shell-content-x shell-content-y-bottom w-full min-w-0">
                <Suspense fallback={<PageSkeleton />}>
                  <Outlet />
                </Suspense>
              </main>
            </div>

            <DataLayerFooter />
          </DataLayer>
        </PageFooterProvider>
      </div>

      {variant === 'profissional' && <BottomNav items={profBottom} fabIndex={2} />}
      {variant === 'paciente' && <BottomNav items={pacBottom} />}
    </div>
  )
}
