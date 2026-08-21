import { Monitor } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { PLATFORM_WEB_URL } from '@/lib/native/constants'
import { openPlatformWeb } from '@/lib/native/links'

export function StaffUsesWebPage() {
  const { signOut, profile } = useAuth()

  return (
    <div className="relative box-border flex h-dvh flex-col overflow-auto bg-background px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top,0px))] sm:px-5 sm:pb-5">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 py-8">
        <div className="flex justify-center">
          <Logo
            layout="horizontal"
            adaptToTheme
            style="v1"
            size="sm"
            subtitle="Fisioterapia Domiciliar"
          />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10">
            <Monitor className="size-7 text-primary" />
          </div>
          <h1 className="font-display text-xl font-bold tracking-tight text-foreground">
            Este perfil utiliza a plataforma administrativa web.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            O aplicativo LarsanaCare é exclusivo para pacientes, responsáveis e
            profissionais parceiros.
            {profile?.full_name ? ` A conta ${profile.full_name}` : ' Esta conta'} deve
            acessar Admin, Gestão ou Financeiro pelo navegador.
          </p>

          <div className="mt-6 space-y-3">
            <Button className="h-12 w-full" onClick={() => void openPlatformWeb()}>
              Abrir plataforma web
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full"
              onClick={() => void signOut()}
            >
              Sair desta conta
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground break-all">{PLATFORM_WEB_URL}</p>
        </div>
      </div>
    </div>
  )
}
