import { BookOpen, GraduationCap, Shield } from 'lucide-react'
import type { ContentBannerSlide } from '@/components/content-experience/ContentBannerCarousel'

export const ACADEMY_SLIDES: ContentBannerSlide[] = [
  {
    id: 'formation',
    eyebrow: 'Larsana Academy',
    title: 'Formação do Profissional Parceiro',
    subtitle: 'Capacitação para operar na plataforma Larsana Care com segurança e qualidade.',
    icon: GraduationCap,
    className: 'bg-primary text-primary-foreground',
  },
  {
    id: 'modules',
    eyebrow: 'Trilha M1–M5',
    title: 'Módulos progressivos',
    subtitle: 'Conclua os módulos obrigatórios para liberar demandas e credenciamento.',
    icon: BookOpen,
    className: 'bg-muted text-foreground border',
  },
  {
    id: 'gates',
    eyebrow: 'Requisitos',
    title: 'Gates configuráveis',
    subtitle: 'O administrador define quais módulos são exigidos para cada funcionalidade.',
    icon: Shield,
    className: 'bg-secondary text-secondary-foreground',
  },
]

export const ACADEMY_FORMATION_SLIDE = ACADEMY_SLIDES[0]
