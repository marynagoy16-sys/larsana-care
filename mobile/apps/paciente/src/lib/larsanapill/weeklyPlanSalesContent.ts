import type { LarsanaPillWeeklyPlan } from '@/types/content'

export interface WeeklyPlanSalesBenefit {
  title: string
  description: string
}

export interface WeeklyPlanSalesStep {
  step: number
  title: string
  description: string
}

export interface WeeklyPlanSalesFaq {
  question: string
  answer: string
}

export interface WeeklyPlanSalesCopy {
  tagline: string
  benefits: WeeklyPlanSalesBenefit[]
  howItWorks: WeeklyPlanSalesStep[]
  audience: string[]
  faq: WeeklyPlanSalesFaq[]
}

const BASE_BENEFITS: WeeklyPlanSalesBenefit[] = [
  {
    title: 'Rotina estruturada dia a dia',
    description: 'Cada sessão tem objetivo claro — você sabe exatamente o que fazer em casa.',
  },
  {
    title: 'Exercícios guiados passo a passo',
    description: 'Vídeos e instruções visuais para executar com segurança, no seu ritmo.',
  },
  {
    title: 'Progresso acompanhado',
    description: 'Marque os dias concluídos e retome de onde parou quando quiser.',
  },
  {
    title: 'Alinhado ao seu tratamento',
    description: 'Complemento entre sessões presenciais — não substitui o fisioterapeuta.',
  },
]

const PLAN_COPY: Record<string, Partial<WeeklyPlanSalesCopy>> = {
  T1: {
    tagline: 'Recupere confiança no movimento após quedas com sessões curtas e progressivas.',
    audience: [
      'Pacientes em reabilitação pós-queda',
      'Idosos que precisam retomar equilíbrio e força',
      'Quem busca prevenir novas quedas em casa',
    ],
    benefits: [
      {
        title: 'Fortalecimento de membros inferiores',
        description: 'Exercícios focados em estabilidade e apoio seguro durante a marcha.',
      },
      {
        title: 'Treino de equilíbrio',
        description: 'Desafios graduais para melhorar reação e confiança ao caminhar.',
      },
      ...BASE_BENEFITS.slice(2),
    ],
  },
  T2: {
    tagline: 'Mantenha autonomia e condicionamento com uma rotina pensada para o dia a dia.',
    audience: [
      'Idosos ativos que querem manter funcionalidade',
      'Pacientes em manutenção entre consultas',
      'Quem precisa de estímulo regular em casa',
    ],
    benefits: [
      {
        title: 'Condicionamento funcional',
        description: 'Sessões que simulam movimentos do cotidiano com carga leve.',
      },
      {
        title: 'Resistência progressiva',
        description: 'Volume semanal ajustado para evolução sem sobrecarga.',
      },
      ...BASE_BENEFITS.slice(2),
    ],
  },
  T3: {
    tagline: 'Retome mobilidade e marcha com orientações seguras para o pós-AVC.',
    audience: [
      'Pacientes em fase de reabilitação neurológica',
      'Quem trabalha hemiparesia ou alteração de marcha',
      'Familiares que apoiam exercícios domiciliares',
    ],
    benefits: [
      {
        title: 'Mobilidade guiada',
        description: 'Movimentos controlados para membros afetados com pausas adequadas.',
      },
      {
        title: 'Marcha e transferências',
        description: 'Foco em padrões de caminhada e mudanças de posição com segurança.',
      },
      ...BASE_BENEFITS.slice(2),
    ],
  },
  T4: {
    tagline: 'Alívio e estabilização da lombalgia com alongamentos e fortalecimento core.',
    audience: [
      'Pacientes com dor lombar crônica',
      'Quem passa muito tempo sentado ou em pé',
      'Pessoas em fase de estabilização da coluna',
    ],
    benefits: [
      {
        title: 'Alongamento dirigido',
        description: 'Sessões curtas para reduzir tensão muscular e melhorar amplitude.',
      },
      {
        title: 'Estabilização do core',
        description: 'Ativação de musculatura profunda para proteger a região lombar.',
      },
      ...BASE_BENEFITS.slice(2),
    ],
  },
  T5: {
    tagline: 'Melhore marcha, equilíbrio e propriocepção com treinos neurológicos guiados.',
    audience: [
      'Pacientes neurológicos em reabilitação',
      'Quem apresenta instabilidade ou alteração de base de sustentação',
      'Tratamentos focados em marcha e coordenação',
    ],
    benefits: [
      {
        title: 'Propriocepção e equilíbrio',
        description: 'Estímulos progressivos para resposta postural e controle corporal.',
      },
      {
        title: 'Padrão de marcha',
        description: 'Exercícios que reforçam cadência, apoio e simetria ao caminhar.',
      },
      ...BASE_BENEFITS.slice(2),
    ],
  },
}

const DEFAULT_HOW_IT_WORKS: WeeklyPlanSalesStep[] = [
  {
    step: 1,
    title: 'Assista à apresentação',
    description: 'Entenda o objetivo do plano e como cada sessão se encaixa na sua semana.',
  },
  {
    step: 2,
    title: 'Siga a rotina diária',
    description: 'Abra o dia correspondente, execute os exercícios guiados e marque como concluído.',
  },
  {
    step: 3,
    title: 'Evolua com consistência',
    description: 'Mantenha a frequência recomendada e acompanhe seu progresso no hub LarsanaPill.',
  },
]

const DEFAULT_FAQ: WeeklyPlanSalesFaq[] = [
  {
    question: 'Preciso de equipamentos especiais?',
    answer: 'Na maioria das sessões, não. Quando algum material for necessário, isso estará indicado no dia correspondente.',
  },
  {
    question: 'Substitui a sessão com meu fisioterapeuta?',
    answer: 'Não. Este plano é um complemento ao tratamento presencial, orientado pela equipe Larsana Care.',
  },
  {
    question: 'Posso pausar e continuar depois?',
    answer: 'Sim. Seu progresso é salvo por dia — retome quando quiser pelo botão "Continuar de onde parou".',
  },
  {
    question: 'Quanto tempo leva cada sessão?',
    answer: 'O tempo médio por sessão está indicado no plano. Respeite pausas e execute no seu ritmo.',
  },
]

export function getWeeklyPlanSalesCopy(plan: LarsanaPillWeeklyPlan): WeeklyPlanSalesCopy {
  const override = PLAN_COPY[plan.code] ?? {}
  const metadataBenefits = parseMetadataBenefits(plan.metadata)

  return {
    tagline: override.tagline ?? plan.description ?? 'Rotina semanal guiada para complementar seu tratamento em casa.',
    benefits: metadataBenefits.length > 0 ? metadataBenefits : override.benefits ?? BASE_BENEFITS,
    howItWorks: override.howItWorks ?? DEFAULT_HOW_IT_WORKS,
    audience: override.audience ?? [
      'Pacientes em tratamento fisioterapêutico Larsana Care',
      'Quem precisa de continuidade entre sessões presenciais',
      'Pessoas que buscam orientação clara para exercícios em casa',
    ],
    faq: override.faq ?? DEFAULT_FAQ,
  }
}

function parseMetadataBenefits(metadata?: Record<string, unknown>): WeeklyPlanSalesBenefit[] {
  const raw = metadata?.benefits
  if (!Array.isArray(raw)) return []
  return raw
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      title: String(item.title ?? ''),
      description: String(item.description ?? ''),
    }))
    .filter((item) => item.title.trim().length > 0)
}

export function getWeeklyMinutes(plan: LarsanaPillWeeklyPlan): number {
  return plan.sessions_per_week * plan.minutes_per_session
}
