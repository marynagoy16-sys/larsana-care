import { NavLink } from 'react-router-dom'
import type { NavItem } from '@/config/navigation'
import { cn } from '@/lib/utils'
import { COMING_SOON_BADGE } from '@/config/navigation'

interface BottomNavProps {
  items: NavItem[]
  fabIndex?: number
}

export function BottomNav({ items, fabIndex }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-border bg-card/95 backdrop-blur-md">
      <div className="flex items-end justify-around px-2 pt-2 pb-3">
        {items.map((item, index) => {
          const Icon = item.icon
          const isFab = fabIndex !== undefined && index === fabIndex

          if (isFab) {
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className="flex flex-col items-center -mt-6"
                aria-label={item.label}
              >
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                  <Icon size={24} />
                </div>
                <span className="text-[10px] font-bold mt-1 text-primary">{item.label}</span>
              </NavLink>
            )
          }

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 min-w-[56px] px-1',
                  isActive ? 'text-nav-icon font-bold' : 'text-muted-foreground',
                )
              }
            >
              <Icon size={22} />
              <span className="text-[10px] truncate max-w-[64px]">{item.label}</span>
              {item.comingSoon && (
                <span className="text-[8px] text-muted-foreground leading-none">{COMING_SOON_BADGE}</span>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
