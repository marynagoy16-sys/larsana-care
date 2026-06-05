import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { PanelLeftClose, PanelLeft } from 'lucide-react'
import type { NavItem as NavItemType, NavSection as NavSectionType } from '@/config/navigation'
import { NavSection, sectionIsActive } from '@/components/layout/NavSection'
import { NavItem } from '@/components/layout/NavItem'
import { Logo } from '@/components/shared/Logo'
import { SidebarLogoutFooter } from '@/components/layout/SidebarLogoutFooter'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SidebarProps {
  sections: NavSectionType[]
  topItems?: NavItemType[]
  subtitle: string
  collapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({ sections, topItems, subtitle, collapsed, onToggleCollapse }: SidebarProps) {
  const { pathname } = useLocation()
  const hasTopItems = Boolean(topItems && topItems.length > 0)
  const hasSections = sections.length > 0
  const [openSectionTitle, setOpenSectionTitle] = useState<string | null>(null)

  useEffect(() => {
    const activeSection = sections.find((section) => sectionIsActive(section, pathname))
    if (activeSection) setOpenSectionTitle(activeSection.title)
  }, [pathname, sections])

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col shrink-0 relative z-40 h-dvh min-h-0',
        'bg-card border-r border-border sidebar-inset',
        'transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-[var(--sidebar-width-collapsed)]' : 'w-[var(--sidebar-width)]',
      )}
    >
      <div
        className={cn(
          'flex shrink-0',
          collapsed ? 'justify-center mb-3' : 'items-center mb-3 px-1',
        )}
      >
        <Logo
          subtitle={subtitle}
          collapsed={collapsed}
          compact={collapsed}
          className={collapsed ? undefined : 'px-3'}
        />
      </div>

      <Button
        variant="outline"
        size="icon"
        className={cn(
          'absolute right-0 z-50 translate-x-1/2 -translate-y-1/2',
          'h-[var(--sidebar-collapse-btn-size)] w-[var(--sidebar-collapse-btn-size)]',
          'rounded-full border-border bg-card shadow-md',
          'text-muted-foreground hover:bg-muted hover:text-foreground',
          'top-[calc(0.75rem+var(--sidebar-collapsed-item-size)/2)]',
        )}
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        title={collapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        {collapsed ? <PanelLeft size={15} /> : <PanelLeftClose size={16} />}
      </Button>

      <div
        className={cn(
          'sidebar-nav-shell flex-1 min-h-0',
          collapsed ? 'overflow-hidden' : 'scrollbar-sidebar overflow-y-auto overflow-x-hidden',
        )}
      >
        <nav className={cn('flex flex-col', collapsed ? 'gap-3 px-2' : 'gap-2 px-1')}>
          {hasTopItems && (
            <div className={cn('flex flex-col', collapsed ? 'gap-3' : 'gap-2')}>
              {topItems!.map((item) => (
                <NavItem
                  key={item.href}
                  to={item.href}
                  icon={item.icon}
                  label={item.label}
                  comingSoon={item.comingSoon}
                  end={item.end}
                  collapsed={collapsed}
                />
              ))}
            </div>
          )}

          {hasSections && (
            <div className={cn('flex flex-col', collapsed ? 'gap-3' : 'gap-2')}>
              {sections.map((section) => (
                <NavSection
                  key={section.title}
                  section={section}
                  collapsed={collapsed}
                  isOpen={!collapsed && openSectionTitle === section.title}
                  onOpenChange={(open) =>
                    setOpenSectionTitle(open ? section.title : null)
                  }
                />
              ))}
            </div>
          )}
        </nav>
      </div>

      <div className="shrink-0 border-t border-border/80 pt-2 mt-2">
        <SidebarLogoutFooter collapsed={collapsed} />
      </div>
    </aside>
  )
}
