import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Calendar,
  ClipboardList,
  ClipboardPlus,
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
      { label: 'Credenciamento', href: '/admin/credenciamento', icon: Shield, roles: ['admin', 'gestao'] },
      { label: 'Demandas', href: '/admin/demandas', icon: MapPin, roles: ['admin', 'gestao'] },
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
    title: 'Financeiro',
    icon: Wallet,
    items: [
      { label: 'Repasses', href: '/profissional/repasses', icon: Wallet, roles: ['pp'] },
      { label: 'Simulador de ganhos', href: '/profissional/simulador', icon: TrendingUp, roles: ['pp'] },
    ],
  },
  {
    title: 'Conta',
    icon: User,
    items: [
      { label: 'Credenciamento', href: '/profissional/credenciamento', icon: Shield, roles: ['pp'] },
      { label: 'Cartão de visita', href: '/profissional/cartao', icon: CreditCard, roles: ['pp'] },
      { label: 'Notificações', href: '/profissional/notificacoes', icon: Bell, roles: ['pp'] },
      { label: 'Perfil', href: '/profissional/perfil', icon: User, roles: ['pp'] },
    ],
  },
]

export const profissionalBottomNav: NavItem[] = [
  { label: 'Início', href: '/profissional/inicio', icon: Home, roles: ['pp'], end: true },
  { label: 'Demandas', href: '/profissional/demandas', icon: MapPin, roles: ['pp'] },
  { label: 'Evolução', href: '/profissional/evolucao/nova', icon: ClipboardPlus, roles: ['pp'] },
  { label: 'Repasses', href: '/profissional/repasses', icon: Wallet, roles: ['pp'] },
  { label: 'Perfil', href: '/profissional/perfil', icon: User, roles: ['pp'] },
]

export const pacienteHeaderNav: NavItem[] = [
  { label: 'Início', href: '/paciente', icon: Home, roles: ['paciente'] },
  { label: 'Pagamentos', href: '/paciente/pagamentos', icon: CreditCard, roles: ['paciente'] },
  { label: 'Tratamento', href: '/paciente/tratamento', icon: Heart, roles: ['paciente'] },
  { label: 'LarsanaPill', href: '/paciente/larsanapill', icon: Pill, roles: ['paciente'] },
  { label: 'Documentos', href: '/paciente/documentos', icon: FileText, roles: ['paciente'] },
  { label: 'Ajuda', href: '/paciente/ajuda', icon: HelpCircle, roles: ['paciente'] },
  { label: 'Conta', href: '/paciente/conta', icon: User, roles: ['paciente'] },
]

export const pacienteBottomNav: NavItem[] = [
  { label: 'Início', href: '/paciente', icon: Home, roles: ['paciente'] },
  { label: 'Pagar', href: '/paciente/pagamentos', icon: CreditCard, roles: ['paciente'] },
  { label: 'Tratamento', href: '/paciente/tratamento', icon: Heart, roles: ['paciente'] },
  { label: 'Documentos', href: '/paciente/documentos', icon: FileText, roles: ['paciente'] },
  { label: 'Conta', href: '/paciente/conta', icon: User, roles: ['paciente'] },
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
  '/aceite-termos': 'Aceite de termos',
  '/credenciamento-pendente': 'Credenciamento pendente',
  '/admin': 'Dashboard',
  '/admin/pacientes': 'Pacientes',
  '/admin/pacientes/novo': 'Novo paciente',
  '/admin/avaliacoes': 'Avaliações',
  '/admin/ciclos': 'Ciclos',
  '/admin/ciclos/novo': 'Novo ciclo',
  '/admin/prontuarios': 'Prontuários',
  '/admin/profissionais': 'Profissionais',
  '/admin/credenciamento': 'Credenciamento',
  '/admin/demandas': 'Demandas',
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
  '/profissional/evolucao/nova': 'Nova evolução',
  '/profissional/pacientes': 'Meus pacientes',
  '/profissional/avaliacoes': 'Avaliações',
  '/profissional/repasses': 'Repasses',
  '/profissional/simulador': 'Simulador de ganhos',
  '/profissional/credenciamento': 'Credenciamento',
  '/profissional/credenciamento/contrato': 'Contrato LRS-PROF',
  '/profissional/cartao': 'Cartão de visita',
  '/profissional/perfil': 'Perfil',
  '/profissional/notificacoes': 'Notificações',
  '/profissional/academy': 'Academy',
  '/profissional/academy/certificados': 'Certificados',
  '/paciente': 'Início',
  '/paciente/tratamento': 'Meu tratamento',
  '/paciente/pagamentos': 'Pagamentos',
  '/paciente/proposta': 'Responder proposta',
  '/paciente/documentos': 'Documentos',
  '/paciente/aceite-inicial': 'Aceite inicial',
  '/paciente/conta': 'Conta',
  '/paciente/ajuda': 'Ajuda',
  '/paciente/larsanapill': 'LarsanaPill',
  '/paciente/notificacoes': 'Notificações',
}

export function getPageTitle(pathname: string): string {
  if (
    pathname === '/paciente' ||
    pathname === '/paciente/notificacoes' ||
    pathname === '/paciente/proposta' ||
    pathname === '/profissional/inicio'
  ) {
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
  if (routeTitles[pathname]) return routeTitles[pathname]
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length >= 2) {
    const base = '/' + segments.slice(0, 2).join('/')
    if (routeTitles[base]) return routeTitles[base]
  }
  return 'LarsanaCare'
}
