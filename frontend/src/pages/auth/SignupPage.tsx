import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SegmentedControl } from '@/components/ui/segmented-control'
import {
  PP_PROFESSION_OPTIONS,
  signUpAccount,
  type PpProfession,
  type SignupAccountType,
} from '@/services/authSignup'
import { softFieldButtonClass, softFieldInputClass, softFieldLabelClass, softFieldSelectClass } from '@/lib/formFieldStyles'
import { formatCpf } from '@/lib/formatters'
import { sanitizeCpf } from '@/lib/sanitize'
import { mapSupabaseError } from '@/lib/supabase-errors'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const ACCOUNT_TYPES = [
  { value: 'paciente' as const, label: 'Sou paciente' },
  { value: 'pp' as const, label: 'Sou profissional' },
]

export function SignupPage() {
  const navigate = useNavigate()
  const [accountType, setAccountType] = useState<SignupAccountType>('paciente')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cpf, setCpf] = useState('')
  const [profession, setProfession] = useState<PpProfession>('FISIO')
  const [referralCode, setReferralCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signUpAccount({
        accountType,
        fullName,
        email,
        password,
        cpf: accountType === 'pp' ? cpf : undefined,
        profession: accountType === 'pp' ? profession : undefined,
        referralCode: accountType === 'pp' ? referralCode : undefined,
      })
      toast.success(
        accountType === 'pp'
          ? 'Conta profissional criada! Verifique seu e-mail e faça login para continuar o credenciamento.'
          : 'Conta criada! Verifique seu e-mail, faça login e complete seu cadastro para solicitar atendimento.',
      )
      navigate('/login')
    } catch (err) {
      toast.error(mapSupabaseError(err instanceof Error ? err : null))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative box-border flex h-dvh flex-col overflow-hidden bg-background p-4 sm:p-5">
      <div className="mx-auto grid h-full min-h-0 w-full max-w-6xl flex-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="relative hidden h-full min-h-0 overflow-hidden rounded-3xl bg-brand-care p-8 text-brand-light lg:flex lg:flex-col lg:justify-between">
          <Logo variant="dark" layout="horizontal" size="sm" subtitle="Fisioterapia Domiciliar" />

          <div className="relative z-10 max-w-md space-y-3">
            <h2 className="font-display text-2xl font-bold leading-tight xl:text-3xl">
              Cuidado domiciliar com segurança e proximidade
            </h2>
            <p className="text-sm leading-relaxed text-brand-light/80">
              Pacientes encontram cuidado de qualidade enquanto Profissionais parceiros otimizam o tempo e recebem a valorização profissional.
            </p>
          </div>

          <div className="relative z-10 opacity-90">
            <img
              src="/brand/symbol-v1-dark.svg"
              alt=""
              aria-hidden
              className="size-24 object-contain"
            />
          </div>

          <p className="relative z-10 shrink-0 text-xs text-brand-light/50">© LarsanaCare · DELUMA</p>

          <div className="pointer-events-none absolute -bottom-20 -right-20 size-64 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -top-10 right-1/3 size-40 rounded-full bg-white/5" />
        </div>

        <div className="min-h-0 overflow-y-auto overscroll-y-contain px-2 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center space-y-5 py-2 lg:space-y-4">
            <div className="flex justify-center lg:hidden">
              <Logo
                layout="horizontal"
                adaptToTheme
                style="v1"
                size="sm"
                subtitle="Fisioterapia Domiciliar"
                className="items-center [&_img]:!h-7 [&_img]:mx-auto"
              />
            </div>

            <SegmentedControl
              value={accountType}
              onChange={setAccountType}
              options={ACCOUNT_TYPES}
              aria-label="Tipo de conta"
            />

            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-3.5">
              <div className="space-y-2">
                <Label htmlFor="fullName" className={softFieldLabelClass}>
                  Nome completo
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                  autoComplete="name"
                  disabled={loading}
                  required
                  className={softFieldInputClass}
                />
              </div>

              {accountType === 'pp' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="cpf" className={softFieldLabelClass}>
                      CPF
                    </Label>
                    <Input
                      id="cpf"
                      value={cpf}
                      onChange={(e) => setCpf(formatCpf(sanitizeCpf(e.target.value)))}
                      placeholder="000.000.000-00"
                      autoComplete="off"
                      inputMode="numeric"
                      disabled={loading}
                      required
                      className={softFieldInputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profession" className={softFieldLabelClass}>
                      Profissão
                    </Label>
                    <select
                      id="profession"
                      value={profession}
                      onChange={(e) => setProfession(e.target.value as PpProfession)}
                      disabled={loading}
                      required
                      className={cn(softFieldSelectClass, 'w-full')}
                    >
                      {PP_PROFESSION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className={softFieldLabelClass}>
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  disabled={loading}
                  required
                  className={softFieldInputClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className={softFieldLabelClass}>
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
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

              {accountType === 'pp' && (
                <div className="space-y-2">
                  <Label htmlFor="referralCode" className={softFieldLabelClass}>
                    Código de indicação <span className="font-normal">(opcional)</span>
                  </Label>
                  <Input
                    id="referralCode"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="Ex.: AB12CD"
                    autoComplete="off"
                    disabled={loading}
                    className={softFieldInputClass}
                  />
                </div>
              )}

              <Button type="submit" className={softFieldButtonClass} disabled={loading}>
                {loading
                  ? 'Criando...'
                  : accountType === 'pp'
                    ? 'Criar conta profissional'
                    : 'Criar conta'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Já tem conta?{' '}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
