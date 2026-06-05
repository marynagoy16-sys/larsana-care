import { NavLink } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { COMING_SOON_BADGE } from '@/config/navigation'

interface NavItemProps {
  to: string
  icon: LucideIcon
  label: string
  comingSoon?: boolean
  end?: boolean
  onClick?: () => void
  collapsed?: boolean
}

export const SIDEBAR_NAV_ITEM =
  'flex items-center justify-center h-[var(--sidebar-collapsed-item-size)] w-full rounded-xl'

export function NavItem({ to, icon: Icon, label, comingSoon, end, onClick, collapsed }: NavItemProps) {
  return (
    <NavLink to={to} end={end} onClick={onClick} className="block" title={collapsed ? label : undefined}>
      {({ isActive }) => (
        <span
          className={cn(
            'group flex items-center text-sm transition-colors',
            SIDEBAR_NAV_ITEM,
            collapsed
              ? cn(
                  'px-1.5',
                  isActive
                    ? 'bg-nav-active-bg text-nav-active-fg shadow-sm'
                    : 'text-muted-foreground hover:bg-nav-hover-bg hover:text-foreground',
                )
              : cn(
                  'justify-start gap-3 px-3',
                  isActive
                    ? 'bg-nav-active-bg text-nav-active-fg font-semibold shadow-sm'
                    : 'text-muted-foreground hover:bg-nav-hover-bg hover:text-foreground',
                ),
          )}
        >
          <span className="relative shrink-0">
            <Icon
              size={18}
              className={cn(
                'transition-colors',
                isActive
                  ? 'text-nav-icon'
                  : 'text-nav-icon-muted group-hover:text-nav-icon',
              )}
            />
            {collapsed && comingSoon && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-muted-foreground/60" />
            )}
          </span>
          {!collapsed && (
            <>
              <span className="flex-1 truncate">{label}</span>
              {comingSoon && (
                <Badge variant="muted" className="shrink-0 text-[10px] px-1.5 font-normal">
                  {COMING_SOON_BADGE}
                </Badge>
              )}
            </>
          )}
        </span>
      )}
    </NavLink>
  )
}
