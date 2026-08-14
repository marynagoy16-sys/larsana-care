import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestPasswordReset } from '@/services/authPasswordReset'
import { softFieldButtonClass, softFieldInputClass, softFieldLabelClass } from '@/lib/formFieldStyles'
import { mapSupabaseError } from '@/lib/supabase-errors'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await requestPasswordReset(email)
      setSent(true)
      toast.success('Link enviado! Verifique sua caixa de entrada.')
    } catch (err) {
      toast.error(mapSupabaseError(err instanceof Error ? err : null))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="space-y-4 lg:space-y-3.5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Se existir uma conta com <span className="font-medium text-foreground">{email.trim()}</span>, você
          receberá um e-mail com instruções para redefinir sua senha.
        </p>
        <Button asChild className={softFieldButtonClass}>
          <Link to="/login">Voltar ao login</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-3.5">
      <div className="space-y-2">
        <Label htmlFor="email" className={softFieldLabelClass}>
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
          required
          className={softFieldInputClass}
        />
      </div>

      <Button type="submit" className={softFieldButtonClass} disabled={loading}>
        {loading ? 'Enviando...' : 'Enviar link de recuperação'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Lembrou a senha?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  )
}
