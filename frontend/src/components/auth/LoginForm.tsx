import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { DevQuickLogin } from '@/components/auth/DevQuickLogin'
import { getHomePathForRole } from '@/types/auth'
import { cn } from '@/lib/utils'

const loginInputClass =
  'h-12 rounded-xl border-0 bg-muted px-4 text-base shadow-none focus-visible:ring-2 focus-visible:ring-primary/30'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn, role } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (role) {
      navigate(getHomePathForRole(role), { replace: true })
    }
  }, [role, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Preencha e-mail e senha')
      return
    }

    setLoading(true)
    const { error } = await signIn(email.trim(), password)
    setLoading(false)

    if (error) {
      toast.error('Falha no login', { description: error })
      return
    }

    toast.success('Bem-vindo ao LarsanaCare!')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">
          E-mail
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          disabled={loading}
          className={loginInputClass}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-muted-foreground">
          Senha
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={loading}
            className={cn(loginInputClass, 'pr-12')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground dark:text-brand-light/60 dark:hover:text-brand-light transition-colors"
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <div className="flex justify-end pt-1">
          <Link to="/recuperar-senha" className="text-xs text-muted-foreground hover:text-primary dark:hover:text-brand-light transition-colors">
            Esqueceu a senha?
          </Link>
        </div>
      </div>

      <Button
        type="submit"
        className="h-12 w-full rounded-xl text-base font-semibold"
        disabled={loading}
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </Button>

      <DevQuickLogin disabled={loading} onLoadingChange={setLoading} />
    </form>
  )
}
