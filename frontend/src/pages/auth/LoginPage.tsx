import { Heart, Home, Stethoscope } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { LoginForm } from '@/components/auth/LoginForm'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

export function LoginPage() {
  return (
    <div className="relative min-h-screen bg-background p-4 sm:p-6">
      <div className="absolute top-4 right-4 z-10 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl gap-4 lg:grid-cols-2 lg:gap-8 lg:min-h-[calc(100vh-3rem)]">
        {/* Painel promocional */}
        <div className="relative hidden overflow-hidden rounded-3xl bg-brand-dark p-10 text-brand-light lg:flex lg:flex-col lg:justify-between">
          <Logo variant="dark" subtitle="Fisioterapia Domiciliar" />

          <div className="relative z-10 max-w-md space-y-4">
            <h2 className="font-display text-3xl font-bold leading-tight xl:text-4xl">
              Simplifique a gestão do cuidado domiciliar
            </h2>
            <p className="text-sm leading-relaxed text-brand-light/80">
              Painel unificado para equipe Larsana, profissionais parceiros e famílias — ABC/SP.
            </p>
          </div>

          {/* Ilustração decorativa */}
          <div className="relative z-10 mt-8 flex items-end gap-4">
            <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Stethoscope className="h-14 w-14 text-white/90" strokeWidth={1.5} />
            </div>
            <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Home className="h-16 w-16 text-white/90" strokeWidth={1.5} />
            </div>
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
              <Heart className="h-12 w-12 text-white/80" strokeWidth={1.5} />
            </div>
          </div>

          <p className="relative z-10 text-xs text-brand-light/50">© LarsanaCare · DELUMA</p>

          {/* Círculos decorativos de fundo */}
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -top-10 right-1/3 h-40 w-40 rounded-full bg-white/5" />
        </div>

        {/* Formulário */}
        <div className="flex flex-col justify-center px-2 py-8 sm:px-6 lg:px-10">
          <div className="mx-auto w-full max-w-md space-y-8">
            <div className="flex justify-center lg:justify-start">
              <Logo subtitle="Fisioterapia Domiciliar" size="md" />
            </div>

            <div className="space-y-2 text-center lg:text-left">
              <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Bem-vindo de volta
              </h1>
              <p className="text-sm text-muted-foreground">
                Faça login na sua conta
              </p>
            </div>

            <LoginForm />

            <p className="text-center text-sm text-muted-foreground">
              Não tem acesso?{' '}
              <a
                href="mailto:contato@larsanacare.com.br"
                className="font-medium text-primary hover:underline"
              >
                Fale com a gestão
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
