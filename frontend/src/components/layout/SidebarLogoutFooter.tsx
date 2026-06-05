import { LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { SIDEBAR_NAV_ITEM } from '@/components/layout/NavItem'
import { cn } from '@/lib/utils'

interface SidebarLogoutFooterProps {
  collapsed?: boolean
}

export function SidebarLogoutFooter({ collapsed }: SidebarLogoutFooterProps) {
  const { signOut } = useAuth()

  return (
    <Button
      variant="ghost"
      className={cn(
        'w-full text-muted-foreground hover:bg-muted hover:text-destructive',
        collapsed
          ? cn(SIDEBAR_NAV_ITEM, 'px-1.5')
          : cn(SIDEBAR_NAV_ITEM, 'justify-start gap-2.5 px-3'),
      )}
      onClick={() => signOut()}
      aria-label="Sair"
      title="Sair"
    >
      <LogOut size={18} className="shrink-0" />
      {!collapsed && <span className="text-sm font-medium">Sair</span>}
    </Button>
  )
}
