import { ChevronDown, LogOut, Moon, Sun, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTheme } from 'next-themes'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types/auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface UserMenuProps {
  variant?: 'icon' | 'full'
}

export function UserMenu({ variant = 'icon' }: UserMenuProps) {
  const { profile, signOut, role } = useAuth()
  const { theme, setTheme } = useTheme()

  const profileHref: Partial<Record<UserRole, string>> = {
    pp: '/profissional/perfil',
    paciente: '/paciente/conta/perfil',
  }
  const profilePath = role ? profileHref[role as UserRole] : undefined

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : profile?.email?.[0]?.toUpperCase() ?? 'U'

  const displayName = profile?.full_name ?? 'Usuário'
  const handle = profile?.email?.split('@')[0] ?? 'usuario'

  const trigger =
    variant === 'full' ? (
      <button
        type="button"
        className={cn(
          'flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-1.5',
          'hover:bg-muted/50 transition-colors outline-none',
          'focus-visible:ring-2 focus-visible:ring-ring',
        )}
      >
        <Avatar className="h-9 w-9 rounded-lg">
          <AvatarFallback className="rounded-lg text-xs font-semibold bg-muted text-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="hidden sm:block text-left min-w-0">
          <p className="text-sm font-bold leading-tight truncate max-w-[140px] text-foreground">
            {displayName}
          </p>
          <p className="text-xs text-muted-foreground leading-tight truncate max-w-[140px]">
            @{handle}
          </p>
        </div>
        <ChevronDown size={16} className="text-muted-foreground shrink-0 hidden sm:block" />
      </button>
    ) : (
      <Button variant="ghost" size="icon" className="rounded-lg">
        <Avatar className="h-8 w-8 rounded-lg">
          <AvatarFallback className="rounded-lg text-xs">{initials}</AvatarFallback>
        </Avatar>
      </Button>
    )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-bold truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">@{handle}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
        </DropdownMenuItem>
        {profilePath ? (
          <DropdownMenuItem asChild>
            <Link to={profilePath}>
              <User className="mr-2 h-4 w-4" />
              Perfil
            </Link>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled>
            <User className="mr-2 h-4 w-4" />
            Perfil
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
