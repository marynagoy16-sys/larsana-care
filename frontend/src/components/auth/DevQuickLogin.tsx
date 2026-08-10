import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { DEV_LOGIN_PASSWORD, DEV_LOGIN_USERS, isDevLoginEnabled } from '@/config/devLogin'

interface DevQuickLoginProps {
  disabled?: boolean
  onLoadingChange?: (loading: boolean) => void
}

export function DevQuickLogin({ disabled, onLoadingChange }: DevQuickLoginProps) {
  const { signIn } = useAuth()

  if (!isDevLoginEnabled()) return null

  const handleQuickLogin = async (email: string, label: string) => {
    onLoadingChange?.(true)
    const { error } = await signIn(email, DEV_LOGIN_PASSWORD)
    onLoadingChange?.(false)

    if (error) {
      toast.error(`Falha ao entrar como ${label}`, { description: error })
      return
    }

    toast.success(`Entrou como ${label}`)
  }

  return (
    <div className="space-y-2 rounded-2xl border border-dashed border-primary/30 bg-primary/[0.04] p-3 lg:p-2.5">
      <div>
        <p className="text-sm font-semibold text-foreground lg:text-xs">Login rápido (dev)</p>
        <p className="text-xs text-muted-foreground lg:text-[11px]">
          Usuários do seed · senha <code className="text-[11px]">LarsanaCare2026!</code>
        </p>
      </div>
      <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-3">
        {DEV_LOGIN_USERS.map((user) => (
          <Button
            key={user.email}
            type="button"
            variant="outline"
            size="sm"
            className="h-8 justify-start rounded-lg bg-background/80 px-2 text-left text-xs lg:h-7 lg:px-2 lg:text-[11px]"
            disabled={disabled}
            onClick={() => void handleQuickLogin(user.email, user.label)}
          >
            <span className="truncate">{user.label}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}
