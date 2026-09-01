import { Link } from 'react-router-dom'
import { useTheme } from 'next-themes'
import { useQuery } from '@tanstack/react-query'
import {
  Bell,
  ChevronRight,
  CreditCard,
  FileText,
  HelpCircle,
  LogOut,
  Moon,
  Pill,
  ScrollText,
  User,
} from 'lucide-react'
import { getThemeDescription } from '@/pages/paciente/PacienteAparenciaPage'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PatientAccountAvatar } from '@/components/paciente/PatientAccountAvatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
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

export function PacienteContaPage() {
  const { profile, signOut } = useAuth()
  const { theme, resolvedTheme } = useTheme()

  const { data: responsible, isLoading } = useQuery({
    queryKey: ['paciente', 'responsible'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_responsibles')
        .select('full_name')
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as { full_name: string } | null
    },
  })

  const themeDescription = getThemeDescription(theme as 'light' | 'dark' | 'system' | undefined, resolvedTheme)
  const profileDescription = responsible?.full_name ?? profile?.full_name ?? 'Dados do responsável'

  return (
    <CrudScrollPageLayout>
      <div className="space-y-3 pb-8">
        <PatientAccountAvatar />

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <AccountLinkRow
            to="/paciente/conta/perfil"
            label="Perfil"
            description={profileDescription}
            icon={User}
            className="border-b border-border"
          />
          <AccountLinkRow
            to="/paciente/pagamentos"
            label="Pagamentos"
            description="PIX e boletos"
            icon={CreditCard}
            className="border-b border-border"
          />
          <AccountLinkRow
            to="/paciente/documentos"
            label="Documentos"
            description="Termos aceitos e comprovantes"
            icon={FileText}
            className="border-b border-border"
          />
          <AccountLinkRow
            to="/paciente/larsanapill"
            label="LarsanaPill"
            description="Exercícios e orientações em casa"
            icon={Pill}
            className="border-b border-border"
          />
          <AccountLinkRow
            to="/paciente/notificacoes"
            label="Notificações"
            description="Alertas e avisos importantes"
            icon={Bell}
            className="border-b border-border"
          />
          <AccountLinkRow
            to="/paciente/conta/aparencia"
            label="Aparência"
            description={themeDescription}
            icon={Moon}
            className="border-b border-border"
          />
          <AccountLinkRow
            to="/paciente/termos"
            label="Termos"
            description="Termos de uso e política de privacidade"
            icon={ScrollText}
            className="border-b border-border"
          />
          <AccountLinkRow
            to="/paciente/ajuda"
            label="Ajuda"
            description="Suporte e FAQ"
            icon={HelpCircle}
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
