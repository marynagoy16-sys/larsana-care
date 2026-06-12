import { Menu, Search, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/layout/UserMenu'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import type { NavItem } from '@/config/navigation'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { COMING_SOON_BADGE } from '@/config/navigation'
import { usePageHeader } from '@/contexts/PageHeaderContext'

interface HeaderProps {
  pageTitle: string
  onMenuClick?: () => void
  showSearch?: boolean
  horizontalNav?: NavItem[]
}

export function Header({
  pageTitle,
  onMenuClick,
  showSearch = true,
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
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-lg h-9 w-9 text-muted-foreground hover:text-foreground"
          aria-label="Notificações"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
        </Button>
        <ThemeToggle />
        <UserMenu variant="full" />
      </div>
    </header>
  )
}
