import { Menu, Search } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { NotificationBellButton } from '@/components/layout/NotificationBellButton'
import { UserMenu } from '@/components/layout/UserMenu'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import type { NavItem } from '@/config/navigation'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { COMING_SOON_BADGE } from '@/config/navigation'
import { usePageHeader } from '@/contexts/PageHeaderContext'

interface HeaderProps {
  pageTitle: string
  onMenuClick?: () => void
  showSearch?: boolean
  showThemeToggle?: boolean
  showUserMenu?: boolean
  notificationsHref?: string
  horizontalNav?: NavItem[]
}

export function Header({
  pageTitle,
  onMenuClick,
  showSearch = true,
  showThemeToggle = true,
  showUserMenu = true,
  notificationsHref,
  horizontalNav,
}: HeaderProps) {
  const { header } = usePageHeader()

  return (
    <header className="flex items-center justify-between gap-4 pb-4 lg:pb-5 pt-0">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden rounded-xl shrink-0"
            onClick={onMenuClick}
            aria-label="Abrir menu"
          >
            <Menu size={22} />
          </Button>
        )}
        {header?.content ?? (
          pageTitle ? (
            <h1 className="font-display font-bold text-2xl lg:text-[1.75rem] leading-tight tracking-tight truncate min-w-0">
              {pageTitle}
            </h1>
          ) : null
        )}
      </div>

      {horizontalNav && horizontalNav.length > 0 && (
        <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center max-w-2xl mx-4">
          {horizontalNav.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors',
                  isActive
                    ? 'font-semibold bg-nav-active-bg text-nav-active-fg'
                    : 'text-muted-foreground hover:bg-nav-hover-bg hover:text-foreground',
                )
              }
            >
              {item.label}
              {item.comingSoon && (
                <Badge variant="muted" className="text-[9px] px-1 py-0">
                  {COMING_SOON_BADGE}
                </Badge>
              )}
            </NavLink>
          ))}
        </nav>
      )}

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {showSearch && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex rounded-lg h-9 w-9 text-muted-foreground hover:text-foreground"
            aria-label="Buscar"
          >
            <Search size={18} />
          </Button>
        )}
        {notificationsHref ? <NotificationBellButton href={notificationsHref} /> : null}
        {showThemeToggle ? <ThemeToggle /> : null}
        {showUserMenu ? <UserMenu variant="full" /> : null}
      </div>
    </header>
  )
}
