import { Suspense, useEffect, useRef, useState } from 'react'
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
  pacienteNavSections,
  profissionalBottomNav,
  profissionalNavSections,
  shouldHideShellHeader,
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
import { useBottomNavAutoHide } from '@/hooks/useBottomNavAutoHide'
import type { UserRole } from '@/types/auth'
import { cn } from '@/lib/utils'

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
  hasMobileDrawer,
  pageTitle,
  setSidebarOpen,
  profBottom,
  pacBottom,
  showBottomNav,
}: {
  variant: LayoutVariant
  hasMobileDrawer: boolean
  pageTitle: string
  setSidebarOpen: (open: boolean) => void
  profBottom: NavItem[]
  pacBottom: NavItem[]
  showBottomNav: boolean
}) {
  const { suppressBottomNav } = usePageFooter()
  const { immersive, fixedMain } = useImmersiveLayout()
  const location = useLocation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 1023px)').matches : false,
  )
  const hideShellHeader =
    !immersive && isMobile && shouldHideShellHeader(location.pathname, variant)
  const showNav = showBottomNav && !suppressBottomNav
  const lockScroll = immersive || fixedMain

  const showMobileHeader = !immersive && !hideShellHeader && isMobile

  useBottomNavAutoHide(scrollRef, showNav && isMobile && !lockScroll)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    setIsScrolled(false)
    scrollRef.current?.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <>
      <DataLayer reserveBottomNav={showNav}>
        {!immersive && !hideShellHeader && (
          <div
            className={cn(
              'shell-content-x shrink-0 z-20 bg-background transition-[box-shadow,border-color] duration-200',
              showMobileHeader ? 'shell-mobile-header' : 'shell-content-y-top',
              isScrolled && 'border-b border-border/50',
            )}
          >
            <Header
              pageTitle={pageTitle}
              onMenuClick={hasMobileDrawer ? () => setSidebarOpen(true) : undefined}
              showSearch={variant === 'admin'}
              showThemeToggle={variant === 'admin'}
              showUserMenu={variant === 'admin'}
              notificationsHref={
                variant === 'paciente'
                  ? '/paciente/notificacoes'
                  : variant === 'profissional'
                    ? '/profissional/notificacoes'
                    : undefined
              }
              horizontalNav={undefined}
            />
          </div>
        )}

        <div
          ref={scrollRef}
          onScroll={() => {
            const top = scrollRef.current?.scrollTop ?? 0
            setIsScrolled(top > 0)
          }}
          className={
            lockScroll
              ? 'flex flex-1 flex-col min-h-0 min-w-0 overflow-hidden'
              : cn(
                  'shell-scroll-region flex-1 min-h-0 min-w-0 scrollbar-sidebar',
                  showMobileHeader && 'shell-has-mobile-header',
                )
          }
        >
          <main
            className={
              lockScroll
                ? 'flex flex-1 flex-col min-h-0 min-w-0 overflow-hidden w-full'
                : cn(
                    'block w-full min-w-0 shrink-0',
                    hideShellHeader ? 'max-lg:px-0' : 'shell-content-x',
                    showNav && !hideShellHeader && 'shell-content-scroll-top',
                    showNav && hideShellHeader && 'shell-content-scroll-top-compact',
                    showNav ? 'shell-with-bottom-nav' : hideShellHeader ? 'pb-0' : 'shell-content-y-bottom',
                  )
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
      {variant === 'paciente' && showNav && (
        <ShellBottomNav items={pacBottom} fabIndex={2} showChatUnreadBadge />
      )}
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
  const pacSections = filterNavByRole(pacienteNavSections, userRole)
  const profBottom = filterNavItems(profissionalBottomNav, userRole)
  const pacBottom = filterNavItems(pacienteBottomNav, userRole)

  const hasDesktopSidebar =
    variant === 'admin' || variant === 'profissional' || variant === 'paciente'
  const hasMobileDrawer = variant === 'admin'
  const sections =
    variant === 'admin'
      ? adminSections
      : variant === 'profissional'
        ? profSections
        : pacSections
  const topItems = variant === 'admin' ? adminTopItems : undefined
  const showBottomNav = (variant === 'profissional' || variant === 'paciente') && !immersive

  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-background">
      {hasDesktopSidebar && (
        <>
          <Sidebar
            sections={sections}
            topItems={topItems}
            subtitle={subtitles[variant]}
            collapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebarCollapse}
          />
          {hasMobileDrawer && (
            <MobileSidebar
              open={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              sections={sections}
              topItems={topItems}
              subtitle={subtitles[variant]}
            />
          )}
        </>
      )}

      <div className="flex flex-1 flex-col min-h-0 min-w-0 overflow-hidden">
        <PageHeaderProvider>
          <PageFooterProvider>
            <AppShellContent
              variant={variant}
              hasMobileDrawer={hasMobileDrawer}
              pageTitle={pageTitle}
              setSidebarOpen={setSidebarOpen}
              profBottom={profBottom}
              pacBottom={pacBottom}
              showBottomNav={showBottomNav}
            />
          </PageFooterProvider>
        </PageHeaderProvider>
      </div>
    </div>
  )
}
