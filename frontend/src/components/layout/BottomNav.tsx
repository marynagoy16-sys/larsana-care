import { NavLink } from 'react-router-dom'
import type { NavItem } from '@/config/navigation'
import { cn } from '@/lib/utils'
import { COMING_SOON_BADGE } from '@/config/navigation'

interface BottomNavProps {
  items: NavItem[]
  fabIndex?: number
  collapsed?: boolean
  badgeCounts?: Partial<Record<string, number>>
}

function glassNavItemClass(isActive: boolean) {
  return cn(
    'flex size-10 items-center justify-center rounded-xl backdrop-blur-md transition-all',
    isActive
      ? 'border border-primary/30 bg-primary/15 shadow-sm'
      : 'bg-transparent',
  )
}

export function BottomNav({ items, fabIndex, collapsed = false, badgeCounts }: BottomNavProps) {
  const hasFab = fabIndex !== undefined

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 lg:hidden pointer-events-none',
        'transition-transform duration-300 ease-in-out will-change-transform',
        hasFab && 'pt-7',
        collapsed && 'translate-y-full overflow-hidden',
      )}
      aria-label="Navegação principal"
      aria-hidden={collapsed}
    >
      {/* Esmaecimento suave — conteúdo some ao rolar por trás do menu */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0',
          hasFab
            ? 'h-[calc(9rem+env(safe-area-inset-bottom))]'
            : 'h-[calc(7rem+env(safe-area-inset-bottom))]',
          'bg-gradient-to-t from-background/95 via-background/55 to-transparent',
          'dark:from-background/98 dark:via-background/60',
          'transition-opacity duration-300 ease-in-out',
          collapsed && 'opacity-0',
        )}
      />

      <div className="relative px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div
          className={cn(
            'pointer-events-auto mx-auto w-full max-w-[24rem] rounded-[1.25rem] border shadow-[0_8px_32px_rgba(0,0,0,0.1)]',
            'border-white/30 bg-background/45 backdrop-blur-xl backdrop-saturate-150',
            'dark:border-white/10 dark:bg-background/35 dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]',
          )}
        >
          <div className="flex items-end justify-around px-1.5 pb-2 pt-2.5">
          {items.map((item, index) => {
            const Icon = item.icon
            const isFab = fabIndex !== undefined && index === fabIndex

            if (isFab) {
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.end}
                  className="flex min-w-[4.5rem] flex-col items-center -mt-7"
                  aria-label={item.label}
                >
                  {({ isActive }) => (
                    <>
                      <div
                        className={cn(
                          'flex size-14 items-center justify-center rounded-full border text-primary-foreground shadow-lg backdrop-blur-md',
                          'bg-primary/90 border-white/30 ring-4 ring-background/50',
                          isActive && 'shadow-primary/25',
                        )}
                      >
                        <Icon size={24} />
                      </div>
                      <span
                        className={cn(
                          'mt-1 text-[10px] font-bold',
                          isActive ? 'text-nav-icon' : 'text-muted-foreground',
                        )}
                      >
                        {item.label}
                      </span>
                    </>
                  )}
                </NavLink>
              )
            }

            const badgeCount = badgeCounts?.[item.href] ?? 0

            return (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex min-w-[3.5rem] flex-col items-center justify-end gap-1 px-0.5 pb-0.5',
                    isActive ? 'font-bold text-nav-icon' : 'text-muted-foreground',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={glassNavItemClass(isActive)}>
                      <span className="relative inline-flex">
                        <Icon size={20} className={isActive ? 'text-nav-icon' : 'text-muted-foreground'} />
                        {badgeCount > 0 && !isActive ? (
                          <span
                            className="absolute right-0 top-0 flex h-[14px] min-w-[14px] -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold leading-none text-primary-foreground ring-2 ring-background/80"
                            aria-hidden
                          >
                            {badgeCount > 9 ? '9+' : badgeCount}
                          </span>
                        ) : null}
                      </span>
                    </div>
                    <span className="max-w-[4.25rem] truncate text-[10px] leading-tight">{item.label}</span>
                    {item.comingSoon && (
                      <span className="text-[8px] leading-none text-muted-foreground">{COMING_SOON_BADGE}</span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
          </div>
        </div>
      </div>
    </nav>
  )
}
