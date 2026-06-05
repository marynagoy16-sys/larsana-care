import { useEffect } from 'react'
import type { NavItem as NavItemType, NavSection as NavSectionType } from '@/config/navigation'
import { NavSection } from '@/components/layout/NavSection'
import { NavItem } from '@/components/layout/NavItem'
import { Logo } from '@/components/shared/Logo'
import { SidebarLogoutFooter } from '@/components/layout/SidebarLogoutFooter'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface MobileSidebarProps {
  open: boolean
  onClose: () => void
  sections: NavSectionType[]
  topItems?: NavItemType[]
  subtitle: string
}

export function MobileSidebar({ open, onClose, sections, topItems, subtitle }: MobileSidebarProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="left" className="w-[var(--sidebar-width-mobile)] max-w-[90vw] p-0 flex flex-col">
        <div className="flex items-center shrink-0 p-4 border-b border-border/50">
          <Logo subtitle={subtitle} />
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto scrollbar-sidebar p-3">
          {topItems && topItems.length > 0 && (
            <div className={cn('space-y-0.5', sections.length > 0 && 'mb-3')}>
              {topItems.map((item) => (
                <NavItem
                  key={item.href}
                  to={item.href}
                  icon={item.icon}
                  label={item.label}
                  comingSoon={item.comingSoon}
                  end={item.end}
                  onClick={onClose}
                />
              ))}
            </div>
          )}
          {sections.map((section) => (
            <NavSection key={section.title} section={section} onItemClick={onClose} />
          ))}
        </nav>

        <div className="shrink-0 border-t border-border/80 p-3">
          <SidebarLogoutFooter />
        </div>
      </SheetContent>
    </Sheet>
  )
}
