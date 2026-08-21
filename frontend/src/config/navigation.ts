import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Calendar,
  ClipboardList,
  CreditCard,
  FileText,
  Heart,
  Home,
  MapPin,
  Settings,
  Shield,
  Stethoscope,
  User,
  UserCheck,
  Users,
  Wallet,
  HelpCircle,
  Bell,
  FileCheck,
  Building2,
  ScrollText,
  Download,
  Receipt,
  TrendingUp,
  Clock,
  Star,
  Timer,
  GraduationCap,
  Pill,
  Trophy,
  Upload,
  UserPlus,
} from 'lucide-react'
import type { UserRole } from '@/types/auth'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  roles: UserRole[]
  comingSoon?: boolean
  end?: boolean
}

export interface NavSection {
  title: string
  icon?: LucideIcon
  items: NavItem[]
}

export interface RouteMeta {
  title: string
  roles: UserRole[]
  icon?: LucideIcon
}

export const COMING_SOON_BADGE = 'Em breve'

export const adminNavTopItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: Home, roles: ['admin', 'financeiro', 'gestao'], end: true },
]

export const adminNavSections: NavSection[] = [
  {
    title: 'Operação',
    icon: Stethoscope,
    items: [
      { label: 'Pacientes', href: '/admin/pacientes', icon: Users, roles: ['admin', 'gestao'] },
      { label: 'Avaliações', href: '/admin/avaliacoes', icon: ClipboardList, roles: ['admin', 'gestao'] },
      { label: 'Ciclos', href: '/admin/ciclos', icon: Calendar, roles: ['admin', 'gestao'] },
      { label: 'Pausas', href: '/admin/pausas', icon: Timer, roles: ['admin', 'gestao'] },
      { label: 'Prontuários', href: '/admin/prontuarios', icon: Stethoscope, roles: ['admin', 'gestao'] },
      { label: 'Profissionais', href: '/admin/profissionais', icon: UserCheck, roles: ['admin', 'gestao'] },
      { label: 'Demandas', href: '/admin/demandas', icon: MapPin, roles: ['admin', 'gestao'] },
      { label: 'Lista de espera', href: '/admin/lista-espera', icon: Users, roles: ['admin', 'gestao'] },
      { label: 'Importar pacientes', href: '/admin/importacao/pacientes', icon: Upload, roles: ['admin'] },
      { label: 'Importar profissionais', href: '/admin/importacao/profissionais', icon: Upload, roles: ['admin'] },
      { label: 'Academy', href: '/admin/academy', icon: GraduationCap, roles: ['admin', 'gestao'] },
      { label: 'LarsanaPill', href: '/admin/larsanapill', icon: Pill, roles: ['admin', 'gestao'] },
    ],
  },
  {
    title: 'Financeiro',
    icon: Wallet,
    items: [
      { label: 'Cobranças', href: '/admin/cobrancas', icon: Receipt, roles: ['admin', 'financeiro'] },
      { label: 'Repasses', href: '/admin/repasses', icon: Wallet, roles: ['admin', 'financeiro'] },
      { label: 'Caixa', href: '/admin/caixa', icon: TrendingUp, roles: ['admin', 'financeiro'] },
      { label: 'Exportação DELUMA', href: '/admin/exportacao-deluma', icon: Download, roles: ['admin', 'financeiro'] },
    ],
  },
  {
    title: 'Relatórios',
    icon: BarChart3,
    items: [
      { label: 'Hub relatórios', href: '/admin/relatorios', icon: BarChart3, roles: ['admin', 'financeiro', 'gestao'] },
      { label: 'Faturamento', href: '/admin/relatorios/faturamento', icon: TrendingUp, roles: ['admin', 'financeiro'] },
      { label: 'Conversão', href: '/admin/relatorios/conversao', icon: BarChart3, roles: ['admin', 'gestao'] },
      { label: 'Horas CREFITO', href: '/admin/relatorios/horas-crefito', icon: Clock, roles: ['admin', 'gestao'] },
      { label: 'NPS', href: '/admin/relatorios/nps', icon: Star, roles: ['admin', 'gestao'] },
      { label: 'Aging repasses', href: '/admin/relatorios/repasses-aging', icon: Timer, roles: ['admin', 'financeiro'] },
    ],
  },
  {
    title: 'Sistema',
    icon: Settings,
    items: [
      { label: 'Tabela de preços', href: '/admin/config/precos', icon: Receipt, roles: ['admin'] },
      { label: 'Pontuação PP', href: '/admin/config/pontos-pp', icon: Trophy, roles: ['admin'] },
      { label: 'Termos e contratos', href: '/admin/config/termos', icon: ScrollText, roles: ['admin'] },
      { label: 'Templates LRS-PROF', href: '/admin/config/contratos', icon: FileText, roles: ['admin'] },
      { label: 'Regiões e cidades', href: '/admin/config/regioes', icon: Building2, roles: ['admin', 'gestao'] },
      { label: 'Usuários', href: '/admin/config/usuarios', icon: Users, roles: ['admin'] },
      { label: 'Auditoria', href: '/admin/config/auditoria', icon: Shield, roles: ['admin', 'gestao'] },
      { label: 'Suporte', href: '/admin/suporte', icon: HelpCircle, roles: ['admin'] },
      { label: 'Configurações', href: '/admin/configuracoes', icon: Settings, roles: ['admin', 'financeiro', 'gestao'] },
    ],
  },
]

export const profissionalNavSections: NavSection[] = [
  {
    title: 'Hoje',
    icon: Calendar,
    items: [
      { label: 'Início', href: '/profissional/inicio', icon: Home, roles: ['pp'], end: true },
      { label: 'Minha jornada', href: '/profissional/evolucao', icon: Trophy, roles: ['pp'] },
      { label: 'Agenda', href: '/profissional/agenda', icon: Calendar, roles: ['pp'] },
      { label: 'Demandas', href: '/profissional/demandas', icon: MapPin, roles: ['pp'] },
    ],
  },
  {
    title: 'Formação',
    icon: GraduationCap,
    items: [
      { label: 'Academy', href: '/profissional/academy', icon: GraduationCap, roles: ['pp'] },
      { label: 'Certificados', href: '/profissional/academy/certificados', icon: FileCheck, roles: ['pp'] },
    ],
  },
  {
    title: 'Clínico',
    icon: ClipboardList,
    items: [
      { label: 'Evoluções pendentes', href: '/profissional/evolucoes', icon: ClipboardList, roles: ['pp'] },
      { label: 'Meus pacientes', href: '/profissional/pacientes', icon: Users, roles: ['pp'] },
      { label: 'Avaliações', href: '/profissional/avaliacoes', icon: FileCheck, roles: ['pp'] },
    ],
  },
  {
    title: 'Conta',
    icon: User,
    items: [
      { label: 'Repasses', href: '/profissional/repasses', icon: Wallet, roles: ['pp'] },
      { label: 'Simulador de ganhos', href: '/profissional/simulador', icon: TrendingUp, roles: ['pp'] },
      { label: 'Credenciamento', href: '/profissional/credenciamento', icon: Shield, roles: ['pp'] },
      { label: 'Notificações', href: '/profissional/notificacoes', icon: Bell, roles: ['pp'] },
      { label: 'Perfil', href: '/profissional/perfil', icon: User, roles: ['pp'] },
    ],
  },
]

export const profissionalBottomNav: NavItem[] = [
  { label: 'Início', href: '/profissional/inicio', icon: Home, roles: ['pp'], end: true },
  { label: 'Agenda', href: '/profissional/agenda', icon: Calendar, roles: ['pp'] },
  { label: 'Demandas', href: '/profissional/demandas', icon: MapPin, roles: ['pp'] },
  { label: 'Academy', href: '/profissional/academy', icon: GraduationCap, roles: ['pp'] },
  { label: 'Conta', href: '/profissional/conta', icon: User, roles: ['pp'] },
]

export const pacienteHeaderNav: NavItem[] = [
  { label: 'Início', href: '/paciente', icon: Home, roles: ['paciente'], end: true },
  { label: 'LarsanaPill', href: '/paciente/larsanapill', icon: Pill, roles: ['paciente'] },
  { label: 'Solicitar', href: '/paciente/solicitar', icon: UserPlus, roles: ['paciente'] },
  { label: 'Tratamento', href: '/paciente/tratamento', icon: Heart, roles: ['paciente'] },
  { label: 'Conta', href: '/paciente/conta', icon: User, roles: ['paciente'] },
]

export const pacienteBottomNav: NavItem[] = [
  { label: 'Início', href: '/paciente', icon: Home, roles: ['paciente'], end: true },
  { label: 'LarsanaPill', href: '/paciente/larsanapill', icon: Pill, roles: ['paciente'] },
  { label: 'Solicitar', href: '/paciente/solicitar', icon: UserPlus, roles: ['paciente'] },
  { label: 'Tratamento', href: '/paciente/tratamento', icon: Heart, roles: ['paciente'] },
  { label: 'Conta', href: '/paciente/conta', icon: User, roles: ['paciente'] },
]

export const pacienteNavSections: NavSection[] = [
  {
    title: 'Principal',
    icon: Home,
    items: [
      { label: 'Início', href: '/paciente', icon: Home, roles: ['paciente'], end: true },
      { label: 'Solicitar atendimento', href: '/paciente/solicitar', icon: UserPlus, roles: ['paciente'] },
      { label: 'Tratamento', href: '/paciente/tratamento', icon: Heart, roles: ['paciente'] },
      { label: 'LarsanaPill', href: '/paciente/larsanapill', icon: Pill, roles: ['paciente'] },
    ],
  },
  {
    title: 'Conta',
    icon: User,
    items: [
      { label: 'Conta', href: '/paciente/conta', icon: User, roles: ['paciente'] },
      { label: 'Pagamentos', href: '/paciente/pagamentos', icon: CreditCard, roles: ['paciente'] },
      { label: 'Documentos', href: '/paciente/documentos', icon: FileText, roles: ['paciente'] },
      { label: 'Notificações', href: '/paciente/notificacoes', icon: Bell, roles: ['paciente'] },
      { label: 'Ajuda', href: '/paciente/ajuda', icon: HelpCircle, roles: ['paciente'] },
    ],
  },
]

export function filterNavByRole(sections: NavSection[], role: UserRole): NavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0)
}

export function filterNavItems(items: NavItem[], role: UserRole): NavItem[] {
  return items.filter((item) => item.roles.includes(role))
}

export const routeTitles: Record<string, string> = {
  '/login': 'Entrar',
  '/recuperar-senha': 'Recuperar senha',
  '/redefinir-senha': 'Redefinir senha',
  '/paciente/onboarding': 'Complete seu cadastro',
  '/aceite-termos': 'Aceite de termos',
  '/credenciamento-pendente': 'Credenciamento pendente',
  '/admin': 'Dashboard',
  '/admin/pacientes': 'Pacientes',
  '/admin/pacientes/novo': 'Novo paciente',
  '/admin/pacientes/:id/prontuario': 'Prontuário',
  '/admin/avaliacoes': 'Avaliações',
  '/admin/ciclos': 'Ciclos',
  '/admin/ciclos/novo': 'Novo ciclo',
  '/admin/pausas': 'Pausas',
  '/admin/prontuarios': 'Prontuários',
  '/admin/profissionais': 'Profissionais',
  '/admin/demandas': 'Demandas',
  '/admin/lista-espera': 'Lista de espera',
  '/admin/academy': 'Academy',
  '/admin/academy/cursos': 'Cursos Academy',
  '/admin/academy/matriculas': 'Matrículas Academy',
  '/admin/academy/config': 'Configuração Academy',
  '/admin/larsanapill': 'LarsanaPill',
  '/admin/larsanapill/categorias/:id': 'Categoria LarsanaPill',
  '/admin/cobrancas': 'Cobranças',
  '/admin/repasses': 'Repasses',
  '/admin/caixa': 'Caixa',
  '/admin/exportacao-deluma': 'Exportação DELUMA',
  '/admin/relatorios': 'Relatórios',
  '/admin/relatorios/faturamento': 'Faturamento',
  '/admin/relatorios/conversao': 'Conversão',
  '/admin/relatorios/horas-crefito': 'Horas CREFITO',
  '/admin/relatorios/nps': 'NPS',
  '/admin/relatorios/repasses-aging': 'Aging repasses',
  '/admin/config/precos': 'Tabela de preços',
  '/admin/config/pontos-pp': 'Pontuação PP',
  '/admin/config/termos': 'Termos e contratos',
  '/admin/config/contratos': 'Templates LRS-PROF',
  '/admin/config/regioes': 'Regiões e cidades',
  '/admin/config/usuarios': 'Usuários',
  '/admin/config/auditoria': 'Auditoria',
  '/admin/suporte': 'Suporte',
  '/admin/configuracoes': 'Configurações',
  '/profissional/inicio': 'Início',
  '/profissional/agenda': 'Agenda',
  '/profissional/demandas': 'Demandas',
  '/profissional/evolucoes': 'Evoluções pendentes',
  '/profissional/evolucao': 'Minha jornada',
  '/profissional/evolucao/nova': 'Nova evolução',
  '/profissional/pacientes': 'Meus pacientes',
  '/profissional/avaliacoes': 'Avaliações',
  '/profissional/repasses': 'Repasses',
  '/profissional/conta': 'Conta',
  '/profissional/conta/aparencia': 'Aparência',
  '/profissional/simulador': 'Simulador de ganhos',
  '/profissional/credenciamento': 'Credenciamento',
  '/profissional/credenciamento/contrato': 'Contrato LRS-PROF',
  '/profissional/cartao': 'Cartão de visita',
  '/profissional/perfil': 'Perfil',
  '/profissional/notificacoes': 'Notificações',
  '/profissional/academy': 'Academy',
  '/profissional/academy/certificados': 'Certificados',
  '/paciente': 'Início',
  '/paciente/solicitar': 'Solicitar atendimento',
  '/paciente/tratamento': 'Meu tratamento',
  '/paciente/pagamentos': 'Pagamentos',
  '/paciente/proposta': 'Responder proposta',
  '/paciente/agendamento': 'Confirmar horário',
  '/paciente/documentos': 'Documentos',
  '/paciente/aceite-inicial': 'Aceite inicial',
  '/paciente/conta': 'Conta',
  '/paciente/conta/aparencia': 'Aparência',
  '/paciente/conta/perfil': 'Perfil',
  '/paciente/termos': 'Termos',
  '/paciente/ajuda': 'Ajuda',
  '/paciente/larsanapill': 'LarsanaPill',
  '/paciente/notificacoes': 'Notificações',
}

export function getPageTitle(pathname: string): string {
  if (
    pathname === '/paciente' ||
    pathname === '/paciente/notificacoes' ||
    pathname === '/paciente/proposta' ||
    pathname === '/paciente/pagamentos' ||
    pathname === '/paciente/documentos' ||
    pathname === '/paciente/ajuda' ||
    pathname === '/paciente/termos' ||
    pathname === '/paciente/conta/aparencia' ||
    pathname === '/paciente/conta/perfil' ||
    pathname === '/profissional/conta/aparencia' ||
    pathname === '/profissional/perfil' ||
    pathname === '/profissional/notificacoes' ||
    pathname === '/profissional/cartao' ||
    pathname === '/profissional/simulador' ||
    pathname === '/profissional/repasses' ||
    pathname === '/profissional/credenciamento' ||
    pathname === '/profissional/credenciamento/contrato' ||
    pathname === '/profissional/evolucoes' ||
    pathname === '/profissional/inicio'
  ) {
    return ''
  }
  if (/^\/paciente\/pagamentos\/[^/]+$/.test(pathname)) {
    return ''
  }
  if (/^\/paciente\/termos\/[^/]+$/.test(pathname)) {
    return ''
  }
  if (/^\/paciente\/tratamento\/ciclo\/[^/]+$/.test(pathname)) {
    return ''
  }
  if (/^\/admin\/ciclos\/[^/]+$/.test(pathname) && pathname !== '/admin/ciclos/novo') {
    return ''
  }
  if (/^\/admin\/demandas\/[^/]+$/.test(pathname)) {
    return ''
  }
  if (/^\/admin\/avaliacoes\/[^/]+$/.test(pathname)) {
    return ''
  }
  if (/^\/profissional\/demandas\/[^/]+$/.test(pathname)) {
    return ''
  }
  if (/^\/profissional\/avaliacoes\/[^/]+$/.test(pathname)) {
    return ''
  }
  if (/^\/profissional\/repasses\/[^/]+$/.test(pathname)) {
    return ''
  }
  if (routeTitles[pathname]) return routeTitles[pathname]
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length >= 2) {
    const base = '/' + segments.slice(0, 2).join('/')
    if (routeTitles[base]) return routeTitles[base]
  }
  return 'LarsanaCare'
}

/** Rotas PP mobile sem barra superior do shell (mapa/conteúdo colado no topo). */
export function shouldHideShellHeader(pathname: string, variant: string): boolean {
  if (variant !== 'profissional') return false
  return pathname === '/profissional/demandas'
}
