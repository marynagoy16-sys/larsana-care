import { Logo } from '@/components/shared/Logo'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export function ResetPasswordPage() {
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

        <div className="flex min-h-0 flex-col justify-center overflow-hidden px-2 py-4 sm:px-6 lg:px-8 lg:py-0">
          <div className="mx-auto w-full max-w-md space-y-5 lg:space-y-4">
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

            <div className="hidden space-y-2 text-center lg:block lg:text-left">
              <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Redefinir senha
              </h1>
              <p className="text-sm text-muted-foreground">
                Escolha uma nova senha para sua conta
              </p>
            </div>

            <ResetPasswordForm />
          </div>
        </div>
      </div>
    </div>
  )
}
