import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Dumbbell,
  HelpCircle,
  Sparkles,
  Target,
  Timer,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ContentDisclaimerBanner } from '@/components/content-experience/ContentDisclaimerBanner'
import { ContentHubLayout } from '@/components/content-experience/ContentHubLayout'
import { WeeklyPlanVslSection } from '@/components/larsanapill/WeeklyPlanVslSection'
import { getContentIcon, getContentLabel } from '@/lib/content/contentIcons'
import { getPlanGradient } from '@/lib/larsanapill/planVisuals'
import { getWeeklyMinutes, getWeeklyPlanSalesCopy } from '@/lib/larsanapill/weeklyPlanSalesContent'
import {
  getPlanProgress,
  getPrimaryPatientId,
  getWeeklyPlanSalesContext,
} from '@/services/larsanapill'
import { cn } from '@/lib/utils'

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <Card>
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 p-4 text-left"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="font-medium">{question}</span>
        <ChevronDown className={cn('mt-0.5 h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <CardContent className="border-t pt-0 pb-4 text-sm text-muted-foreground">{answer}</CardContent>}
    </Card>
  )
}

export function WeeklyPlanSalesPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const { data: patientId } = useQuery({
    queryKey: ['paciente', 'patient-id'],
    queryFn: getPrimaryPatientId,
  })

  const { data: salesContext, isLoading } = useQuery({
    queryKey: ['paciente', 'larsanapill', 'plan-sales', slug],
    queryFn: () => getWeeklyPlanSalesContext(slug!),
    enabled: Boolean(slug),
  })

  const { data: completedDays } = useQuery({
    queryKey: ['paciente', 'larsanapill', 'plan-progress', patientId, salesContext?.plan.id],
    queryFn: () => getPlanProgress(patientId!, salesContext!.plan.id),
    enabled: Boolean(patientId && salesContext?.plan.id),
  })

  if (isLoading) return <p className="p-6 text-sm text-muted-foreground">Carregando plano…</p>
  if (!salesContext) return <p className="p-6 text-sm text-muted-foreground">Plano não encontrado.</p>

  const { plan, days, vslContent, contentById } = salesContext
  const copy = getWeeklyPlanSalesCopy(plan)
  const gradient = getPlanGradient(plan.code)
  const sortedDays = [...days].sort((a, b) => a.day_index - b.day_index)
  const firstDay = sortedDays[0]
  const weeklyMinutes = getWeeklyMinutes(plan)
  const completedCount = completedDays?.size ?? 0
  const progressPercent = days.length > 0 ? Math.round((completedCount / days.length) * 100) : 0
  const hasStarted = completedCount > 0

  const goToPlayer = (dayIndex: number) => navigate(`/paciente/larsanapill/planos/${plan.slug}/dia/${dayIndex}`)
  const goToStart = () => firstDay && goToPlayer(firstDay.day_index)

  const stats = [
    { icon: Calendar, label: 'Frequência', value: `${plan.sessions_per_week}x/semana` },
    { icon: Timer, label: 'Por sessão', value: `${plan.minutes_per_session} min` },
    { icon: Target, label: 'Dias no plano', value: `${days.length} dias` },
    { icon: Clock, label: 'Tempo semanal', value: `~${weeklyMinutes} min` },
  ]

  return (
    <ContentHubLayout>
      <div className={cn('rounded-b-3xl bg-gradient-to-br px-6 py-10 text-white', gradient)}>
        <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Plano {plan.code}</p>
        <h1 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl">{plan.title}</h1>
        <p className="mt-3 max-w-2xl text-base opacity-90">{copy.tagline}</p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          {stats.map(({ icon: Icon, label, value }) => (
            <span key={label} className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
              <Icon className="h-4 w-4" />
              <span className="opacity-80">{label}:</span> {value}
            </span>
          ))}
        </div>
        {hasStarted && (
          <div className="mt-6 max-w-md rounded-2xl bg-white/10 p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>Seu progresso neste plano</span>
              <span className="font-semibold tabular-nums">
                {completedCount}/{days.length} dias
              </span>
            </div>
            <Progress value={progressPercent} className="h-2 bg-white/20 [&>div]:bg-white" />
          </div>
        )}
      </div>

      <div className="space-y-10 pb-28">
        <WeeklyPlanVslSection content={vslContent} planTitle={plan.title} />

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ icon: Icon, label, value }) => (
            <Card key={label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-semibold">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">O que você ganha</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {copy.benefits.map((benefit) => (
              <Card key={benefit.title}>
                <CardContent className="space-y-1 p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <p className="font-medium">{benefit.title}</p>
                  </div>
                  <p className="pl-6 text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Como funciona</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {copy.howItWorks.map((step) => (
              <Card key={step.step} className="relative overflow-hidden">
                <CardContent className="space-y-2 p-5">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {step.step}
                  </span>
                  <p className="font-semibold">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Para quem é este plano</h2>
          </div>
          <ul className="space-y-2">
            {copy.audience.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {sortedDays.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Sua rotina semanal</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {sortedDays.length} sessões estruturadas — cada dia com exercícios ou orientações específicas.
            </p>
            <div className="space-y-2">
              {sortedDays.map((day) => {
                const linked = day.content_id ? contentById[day.content_id] : null
                const Icon = getContentIcon(linked?.content_type ?? (day.instructions ? 'richtext' : 'exercise_steps'))
                const isDone = completedDays?.has(day.day_index)

                return (
                  <Card key={day.id} className={cn(isDone && 'border-primary/40 bg-primary/5')}>
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-semibold uppercase text-primary">Dia {day.day_index}</p>
                          {isDone && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                              Concluído
                            </span>
                          )}
                        </div>
                        <p className="font-medium">{day.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {linked
                            ? `${getContentLabel(linked.content_type)} · ${linked.title}`
                            : day.instructions
                              ? 'Orientações textuais'
                              : 'Conteúdo em preparação'}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="shrink-0" onClick={() => goToPlayer(day.day_index)}>
                        Abrir
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Perguntas frequentes</h2>
          </div>
          <div className="space-y-2">
            {copy.faq.map((item) => (
              <FaqItem key={item.question} question={item.question} answer={item.answer} />
            ))}
          </div>
        </section>

        <ContentDisclaimerBanner>
          Complemento ao tratamento — não substitui sessão presencial com seu fisioterapeuta. Em caso de dor aguda ou
          piora dos sintomas, interrompa e consulte seu profissional.
        </ContentDisclaimerBanner>
      </div>

      <div className="fixed inset-x-0 bottom-20 z-30 border-t bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:bottom-0">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row">
          <Button size="lg" className="flex-1 rounded-full" disabled={!firstDay} onClick={goToStart}>
            {hasStarted ? 'Continuar plano' : 'Começar plano'}
          </Button>
          <Button variant="outline" size="lg" className="rounded-full sm:w-auto" onClick={() => navigate('/paciente/larsanapill')}>
            Voltar ao hub
          </Button>
        </div>
      </div>
    </ContentHubLayout>
  )
}
