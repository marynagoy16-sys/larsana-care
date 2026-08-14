import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  getPasswordRecoveryHashError,
  updatePassword,
  waitForPasswordRecoverySession,
} from '@/services/authPasswordReset'
import { softFieldButtonClass, softFieldInputClass, softFieldLabelClass } from '@/lib/formFieldStyles'
import { mapSupabaseError } from '@/lib/supabase-errors'
import { cn } from '@/lib/utils'

export function ResetPasswordForm() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingLink, setCheckingLink] = useState(true)
  const [linkValid, setLinkValid] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function validateRecoveryLink() {
      const hashError = getPasswordRecoveryHashError()
      if (hashError) {
        if (mounted) {
          setLinkError(hashError)
          setCheckingLink(false)
        }
        return
      }

      const valid = await waitForPasswordRecoverySession()
      if (!mounted) return

      setLinkValid(valid)
      if (!valid) {
        setLinkError('Este link é inválido ou expirou. Solicite um novo e-mail de recuperação.')
      }
      setCheckingLink(false)
    }

    void validateRecoveryLink()

    return () => {
      mounted = false
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.')
      return
    }

    setLoading(true)
    try {
      await updatePassword(password)
      toast.success('Senha redefinida! Faça login com a nova senha.')
      navigate('/login', { replace: true })
    } catch (err) {
      toast.error(mapSupabaseError(err instanceof Error ? err : null))
    } finally {
      setLoading(false)
    }
  }

  if (checkingLink) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!linkValid) {
    return (
      <div className="space-y-4 lg:space-y-3.5">
        <p className="text-sm leading-relaxed text-muted-foreground">{linkError}</p>
        <Button asChild className={softFieldButtonClass}>
          <Link to="/recuperar-senha">Solicitar novo link</Link>
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Voltar ao login
          </Link>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-3.5">
      <div className="space-y-2">
        <Label htmlFor="password" className={softFieldLabelClass}>
          Nova senha
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            disabled={loading}
            minLength={8}
            required
            className={cn(softFieldInputClass, 'pr-12')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground dark:text-brand-light/60 dark:hover:text-brand-light"
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className={softFieldLabelClass}>
          Confirmar nova senha
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            disabled={loading}
            minLength={8}
            required
            className={cn(softFieldInputClass, 'pr-12')}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground dark:text-brand-light/60 dark:hover:text-brand-light"
            aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <Button type="submit" className={softFieldButtonClass} disabled={loading}>
        {loading ? 'Salvando...' : 'Redefinir senha'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Voltar ao login
        </Link>
      </p>
    </form>
  )
}
