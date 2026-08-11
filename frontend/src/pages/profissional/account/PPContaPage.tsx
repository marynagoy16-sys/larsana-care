import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTheme } from 'next-themes'
import { useQuery } from '@tanstack/react-query'
import {
  Bell,
  ChevronRight,
  CreditCard,
  LogOut,
  Moon,
  Shield,
  TrendingUp,
  Trophy,
  User,
  Users,
  Wallet,
} from 'lucide-react'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { getThemeDescription } from '@/pages/paciente/PacienteAparenciaPage'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

function AccountLinkRow({
  to,
  label,
  description,
  icon: Icon,
  className,
}: {
  to: string
  label: string
  description?: string
  icon: typeof User
  className?: string
}) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-muted/40',
        className,
      )}
    >
      <Icon className="size-5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{label}</p>
        {description ? <p className="text-xs text-muted-foreground mt-0.5">{description}</p> : null}
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}

export function PPContaPage() {
  const { profile, signOut } = useAuth()
  const { theme, resolvedTheme } = useTheme()
  const [isDesktop, setIsDesktop] = useState<boolean | null>(() => {
    if (typeof window === 'undefined') return null
    return window.matchMedia('(min-width: 1024px)').matches
  })

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const sync = () => setIsDesktop(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const { data: professional, isLoading } = useQuery({
    queryKey: ['pp', 'profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data, error } = await supabase
        .from('professionals')
        .select('id, full_name, profession, credentialing_status')
        .eq('user_id', user.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })

  const displayName = professional?.full_name ?? profile?.full_name ?? 'Profissional'
  const themeDescription = getThemeDescription(
    theme as 'light' | 'dark' | 'system' | undefined,
    resolvedTheme,
  )

  if (isDesktop === null) return null
  if (isDesktop) return <Navigate to="/profissional/perfil" replace />

  return (
    <CrudScrollPageLayout>
      <div className="space-y-4 pb-8">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <User className="size-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-bold text-foreground truncate">{displayName}</p>
              <p className="text-sm text-muted-foreground truncate">{profile?.email ?? '—'}</p>
              {professional?.profession ? (
                <p className="text-sm text-muted-foreground mt-0.5">{professional.profession}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <AccountLinkRow
            to="/profissional/evolucao"
            label="Minha evolução"
            description="Pontos, patente e percentual de repasse"
            icon={Trophy}
            className="border-b border-border"
          />
          <AccountLinkRow
            to="/profissional/pacientes"
            label="Meus pacientes"
            description="Prontuários e ciclos de tratamento"
            icon={Users}
            className="border-b border-border"
          />
          <AccountLinkRow
            to="/profissional/repasses"
            label="Repasses"
            description="Ganhos por ciclo liberados pela Larsana"
            icon={Wallet}
            className="border-b border-border"
          />
          <AccountLinkRow
            to="/profissional/simulador"
            label="Simulador de ganhos"
            description="Estimativa com base no histórico"
            icon={TrendingUp}
            className="border-b border-border"
          />
          <AccountLinkRow
            to="/profissional/credenciamento"
            label="Credenciamento"
            description="Documentos, conselho e dados bancários"
            icon={Shield}
            className="border-b border-border"
          />
          <AccountLinkRow
            to="/profissional/cartao"
            label="Cartão de visita"
            description="Informações do cartão digital"
            icon={CreditCard}
            className="border-b border-border"
          />
          <AccountLinkRow
            to="/profissional/notificacoes"
            label="Notificações"
            description="Alertas e avisos importantes"
            icon={Bell}
            className="border-b border-border"
          />
          <AccountLinkRow
            to="/profissional/conta/aparencia"
            label="Aparência"
            description={themeDescription}
            icon={Moon}
            className="border-b border-border"
          />
          <AccountLinkRow
            to="/profissional/perfil"
            label="Perfil"
            description="Dados do profissional parceiro"
            icon={User}
          />
        </div>

        <Button
          variant="outline"
          className="w-full h-12 lg:h-10 text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
          onClick={() => signOut()}
        >
          <LogOut className="size-4" />
          Sair
        </Button>

        {isLoading ? (
          <p className="text-center text-sm text-muted-foreground">Carregando dados…</p>
        ) : null}
      </div>
    </CrudScrollPageLayout>
  )
}
