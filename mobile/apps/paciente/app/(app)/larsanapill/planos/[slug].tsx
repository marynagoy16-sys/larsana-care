import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Dumbbell,
  HelpCircle,
  Sparkles,
  Target,
  Timer,
  Users,
} from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ContentDisclaimerBanner } from '@/components/larsanapill/ContentDisclaimerBanner'
import { FaqItem } from '@/components/larsanapill/FaqItem'
import { WeeklyPlanVslSection } from '@/components/larsanapill/WeeklyPlanVslSection'
import { getContentIcon, getContentLabel } from '@/lib/content/contentIcons'
import { getPlanColor } from '@/lib/larsanapill/planVisuals'
import { getWeeklyMinutes, getWeeklyPlanSalesCopy } from '@/lib/larsanapill/weeklyPlanSalesContent'
import { cn } from '@/lib/cn'
import { getPlanProgress, getPrimaryPatientId, getWeeklyPlanSalesContext } from '@/services/larsanapill'

function PlanStatCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <Card className="flex-1 min-w-[46%] p-4">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Icon size={20} color="#095742" />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-xs text-muted-foreground">{label}</Text>
          <Text className="font-semibold text-foreground">{value}</Text>
        </View>
      </View>
    </Card>
  )
}

export default function WeeklyPlanSalesScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const { data: patientId } = useQuery({
    queryKey: ['paciente', 'patient-id'],
    queryFn: getPrimaryPatientId,
  })

  const { data: salesContext, isLoading } = useQuery({
    queryKey: ['paciente', 'larsanapill', 'plan-sales', slug],
    queryFn: () => getWeeklyPlanSalesContext(slug!),
    enabled: !!slug,
  })

  const { data: completedDays } = useQuery({
    queryKey: ['paciente', 'larsanapill', 'plan-progress', patientId, salesContext?.plan.id],
    queryFn: () => getPlanProgress(patientId!, salesContext!.plan.id),
    enabled: Boolean(patientId && salesContext?.plan.id),
  })

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background" edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color="#095742" />
      </SafeAreaView>
    )
  }

  if (!salesContext) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background px-6" edges={['top', 'bottom']}>
        <Text className="text-muted-foreground">Plano não encontrado.</Text>
      </SafeAreaView>
    )
  }

  const { plan, days, vslContent, contentById } = salesContext
  const copy = getWeeklyPlanSalesCopy(plan)
  const planColor = getPlanColor(plan.code)
  const sortedDays = [...days].sort((a, b) => a.day_index - b.day_index)
  const firstDay = sortedDays[0]
  const weeklyMinutes = getWeeklyMinutes(plan)
  const completedCount = completedDays?.size ?? 0
  const progressPercent = days.length > 0 ? Math.round((completedCount / days.length) * 100) : 0
  const hasStarted = completedCount > 0

  const goToPlayer = (dayIndex: number) => router.push(`/(app)/larsanapill/planos/${plan.slug}/dia/${dayIndex}`)
  const goToStart = () => firstDay && goToPlayer(firstDay.day_index)

  const stats = [
    { icon: Calendar, label: 'Frequência', value: `${plan.sessions_per_week}x/semana` },
    { icon: Timer, label: 'Por sessão', value: `${plan.minutes_per_session} min` },
    { icon: Target, label: 'Dias no plano', value: `${days.length} dias` },
    { icon: Clock, label: 'Tempo semanal', value: `~${weeklyMinutes} min` },
  ]

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="pb-36" showsVerticalScrollIndicator={false}>
        <View className="rounded-b-3xl px-6 pb-8 pt-4" style={{ backgroundColor: planColor, paddingTop: Math.max(insets.top, 12) }}>
          <Pressable
            onPress={() => router.back()}
            className="mb-4 self-start rounded-xl bg-white/15 p-2.5"
            accessibilityLabel="Voltar"
          >
            <ArrowLeft size={20} color="#fff" />
          </Pressable>
          <Text className="text-xs font-semibold uppercase tracking-wider text-white/80">Plano {plan.code}</Text>
          <Text className="mt-2 font-display text-3xl font-bold leading-tight text-white">{plan.title}</Text>
          <Text className="mt-3 text-base text-white/90">{copy.tagline}</Text>
          <View className="mt-6 flex-row flex-wrap gap-2">
            {stats.map(({ icon: Icon, label, value }) => (
              <View key={label} className="flex-row items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
                <Icon size={14} color="#fff" />
                <Text className="text-xs text-white">
                  <Text className="text-white/80">{label}: </Text>
                  {value}
                </Text>
              </View>
            ))}
          </View>
          {hasStarted ? (
            <View className="mt-6 rounded-2xl bg-white/10 p-4">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-sm text-white">Seu progresso neste plano</Text>
                <Text className="text-sm font-semibold text-white">
                  {completedCount}/{days.length} dias
                </Text>
              </View>
              <ProgressBar value={progressPercent} trackClassName="bg-white/20" fillClassName="bg-white" />
            </View>
          ) : null}
        </View>

        <View className="gap-8 px-4 pt-6">
          <WeeklyPlanVslSection content={vslContent} planTitle={plan.title} />

          <View className="flex-row flex-wrap gap-3">
            {stats.map((stat) => (
              <PlanStatCard key={stat.label} {...stat} />
            ))}
          </View>

          <View className="gap-4">
            <View className="flex-row items-center gap-2">
              <Sparkles size={20} color="#095742" />
              <Text className="text-xl font-semibold text-foreground">O que você ganha</Text>
            </View>
            <View className="gap-3">
              {copy.benefits.map((benefit) => (
                <Card key={benefit.title} className="p-4">
                  <View className="flex-row items-start gap-2">
                    <CheckCircle2 size={16} color="#095742" style={{ marginTop: 2 }} />
                    <Text className="flex-1 font-medium text-foreground">{benefit.title}</Text>
                  </View>
                  <Text className="mt-1 pl-6 text-sm text-muted-foreground">{benefit.description}</Text>
                </Card>
              ))}
            </View>
          </View>

          <View className="gap-4">
            <Text className="text-xl font-semibold text-foreground">Como funciona</Text>
            <View className="gap-3">
              {copy.howItWorks.map((step) => (
                <Card key={step.step} className="p-5">
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-primary">
                    <Text className="text-sm font-bold text-primary-foreground">{step.step}</Text>
                  </View>
                  <Text className="mt-3 font-semibold text-foreground">{step.title}</Text>
                  <Text className="mt-1 text-sm text-muted-foreground">{step.description}</Text>
                </Card>
              ))}
            </View>
          </View>

          <View className="gap-4">
            <View className="flex-row items-center gap-2">
              <Users size={20} color="#095742" />
              <Text className="text-xl font-semibold text-foreground">Para quem é este plano</Text>
            </View>
            <View className="gap-2">
              {copy.audience.map((item) => (
                <View key={item} className="flex-row items-start gap-2">
                  <ArrowRight size={16} color="#095742" style={{ marginTop: 2 }} />
                  <Text className="flex-1 text-sm text-foreground">{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {sortedDays.length > 0 ? (
            <View className="gap-4">
              <View className="flex-row items-center gap-2">
                <Dumbbell size={20} color="#095742" />
                <Text className="text-xl font-semibold text-foreground">Sua rotina semanal</Text>
              </View>
              <Text className="text-sm text-muted-foreground">
                {sortedDays.length} sessões estruturadas — cada dia com exercícios ou orientações específicas.
              </Text>
              <View className="gap-2">
                {sortedDays.map((day) => {
                  const linked = day.content_id ? contentById[day.content_id] : null
                  const Icon = getContentIcon(linked?.content_type ?? (day.instructions ? 'richtext' : 'exercise_steps'))
                  const isDone = completedDays?.has(day.day_index)

                  return (
                    <Card key={day.id} className={cn(isDone && 'border-primary/40 bg-primary/5')}>
                      <View className="flex-row items-center gap-3 p-4">
                        <View className="h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                          <Icon size={20} color="#095742" />
                        </View>
                        <View className="min-w-0 flex-1">
                          <View className="flex-row flex-wrap items-center gap-2">
                            <Text className="text-xs font-semibold uppercase text-primary">Dia {day.day_index}</Text>
                            {isDone ? (
                              <View className="rounded-full bg-primary/10 px-2 py-0.5">
                                <Text className="text-[10px] font-semibold text-primary">Concluído</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text className="font-medium text-foreground">{day.title}</Text>
                          <Text className="text-xs text-muted-foreground">
                            {linked
                              ? `${getContentLabel(linked.content_type)} · ${linked.title}`
                              : day.instructions
                                ? 'Orientações textuais'
                                : 'Conteúdo em preparação'}
                          </Text>
                        </View>
                        <Button variant="ghost" className="h-9 px-3" onPress={() => goToPlayer(day.day_index)}>
                          Abrir
                        </Button>
                      </View>
                    </Card>
                  )
                })}
              </View>
            </View>
          ) : null}

          <View className="gap-4">
            <View className="flex-row items-center gap-2">
              <HelpCircle size={20} color="#095742" />
              <Text className="text-xl font-semibold text-foreground">Perguntas frequentes</Text>
            </View>
            <View className="gap-2">
              {copy.faq.map((item) => (
                <FaqItem key={item.question} question={item.question} answer={item.answer} />
              ))}
            </View>
          </View>

          <ContentDisclaimerBanner>
            Complemento ao tratamento — não substitui sessão presencial com seu fisioterapeuta. Em caso de dor aguda ou
            piora dos sintomas, interrompa e consulte seu profissional.
          </ContentDisclaimerBanner>
        </View>
      </ScrollView>

      <View
        className="absolute inset-x-0 bottom-0 border-t border-border bg-background/95 px-4 py-3"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <View className="gap-2">
          <Button disabled={!firstDay} onPress={goToStart}>
            {hasStarted ? 'Continuar plano' : 'Começar plano'}
          </Button>
          <Button variant="outline" onPress={() => router.push('/(app)/larsanapill')}>
            Voltar ao hub
          </Button>
        </View>
      </View>
    </View>
  )
}
