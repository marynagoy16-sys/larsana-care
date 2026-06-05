import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { COMING_SOON_BADGE } from '@/config/navigation'

interface NavSubmenuLinkProps {
  to: string
  label: string
  comingSoon?: boolean
  end?: boolean
  onClick?: () => void
}

export function NavSubmenuLink({ to, label, comingSoon, end, onClick }: NavSubmenuLinkProps) {
  return (
    <NavLink to={to} end={end} onClick={onClick} className="block">
      {({ isActive }) => (
        <span
          className={cn(
            'group flex items-center gap-2 py-1.5 pl-3 pr-2 text-[13px] transition-colors',
            'ml-[1.375rem] border-l-2',
            isActive
              ? 'border-nav-icon bg-nav-active-bg/80 text-nav-active-fg font-medium'
              : 'border-border/60 text-muted-foreground hover:border-border hover:bg-nav-hover-bg hover:text-foreground',
          )}
        >
          <span className="flex-1 truncate">{label}</span>
          {comingSoon && (
            <Badge variant="muted" className="shrink-0 text-[10px] px-1.5 font-normal">
              {COMING_SOON_BADGE}
            </Badge>
          )}
        </span>
      )}
    </NavLink>
  )
}
