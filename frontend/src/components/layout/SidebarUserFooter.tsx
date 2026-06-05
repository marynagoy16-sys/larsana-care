import { LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

interface SidebarUserFooterProps {
  collapsed?: boolean
}

export function SidebarUserFooter({ collapsed }: SidebarUserFooterProps) {
  const { profile, signOut } = useAuth()

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : profile?.email?.[0]?.toUpperCase() ?? 'U'

  const displayName = profile?.full_name ?? profile?.email ?? 'Usuário'

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 w-full">
        <Avatar className="h-9 w-9 shrink-0" title={displayName}>
          <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-destructive"
          onClick={() => signOut()}
          aria-label="Sair"
          title="Sair"
        >
          <LogOut size={18} />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 w-full min-w-0">
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-semibold truncate leading-tight">{displayName}</p>
        {profile?.email && profile.full_name && (
          <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-destructive"
        onClick={() => signOut()}
        aria-label="Sair"
        title="Sair"
      >
        <LogOut size={18} />
      </Button>
    </div>
  )
}
