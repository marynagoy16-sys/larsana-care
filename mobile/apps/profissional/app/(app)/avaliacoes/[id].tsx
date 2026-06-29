import { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArrowLeft, CheckCircle, Circle, CircleDot } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatCurrency, formatDate, daysUntil } from '@/lib/formatters'
import {
  getAssessmentDetail,
  estimateAssessmentProposalTotalCents,
  type AssessmentDetail,
} from '@/services/assessments'

const patientLevelLabels: Record<string, string> = {
  N1: 'Nível 1',
  N2: 'Nível 2',
  N3: 'Nível 3',
  VALOR_SOCIAL: 'Valor social',
}

const weeklyFrequencyLabels: Record<number, string> = {
  1: '1x por semana',
  2: '2x por semana',
  3: '3x por semana',
}

const proposedSessionCountLabels: Record<number, string> = {
  4: '4 sessões',
  8: '8 sessões',
  12: '12 sessões',
}

const ppClassLabels: Record<string, string> = {
  BRONZE: 'Bronze',
  PRATA: 'Prata',
  OURO: 'Ouro',
}

const TRACKING_STEPS = [
  { key: 'avaliacao_feita', label: 'Avaliação feita' },
  { key: 'proposta_enviada', label: 'Proposta enviada' },
  { key: 'em_analise', label: 'Em análise (5 dias)' },
  { key: 'resposta', label: 'Resposta da família' },
] as const

const STATUS_ORDER = ['avaliacao_feita', 'proposta_enviada', 'em_analise', 'respondida_sim', 'respondida_nao', 'vencida'] as const

function resolveWorkflowIndex(status: string): number {
  if (status === 'respondida_sim' || status === 'respondida_nao' || status === 'vencida') return 3
  const idx = STATUS_ORDER.indexOf(status as (typeof STATUS_ORDER)[number])
  return idx >= 0 ? Math.min(idx, 3) : 0
}

type StepState = 'locked' | 'unlocked' | 'done' | 'current'

function resolveStepState(stepIndex: number, status: string): StepState {
  const workflowIndex = resolveWorkflowIndex(status)

  if (stepIndex === 0) {
    if (workflowIndex === 0 && status === 'avaliacao_feita') return 'current'
    return 'done'
  }

  if (stepIndex === 1 || stepIndex === 2) {
    if (stepIndex < workflowIndex) return 'done'
    if (stepIndex === workflowIndex) return 'current'
    return 'locked'
  }

  if (workflowIndex >= 3) return 'current'
  return 'locked'
}

function resolveResponseLabel(status: string): string | null {
  if (status === 'respondida_sim') return 'Família aceitou (SIM)'
  if (status === 'respondida_nao') return 'Família recusou (NÃO)'
  if (status === 'vencida') return 'Prazo vencido'
  return null
}

function StepIcon({ state }: { state: StepState }) {
  if (state === 'done') return <CheckCircle size={20} color="#059669" />
  if (state === 'current') return <CircleDot size={20} color="#5A7920" />
  if (state === 'unlocked') return <CircleDot size={20} color="#5A7920" />
  return <Circle size={20} color="#D1D5DB" />
}

function StepDescription({ stepKey, data, totalAmountCents }: { stepKey: string; data: AssessmentDetail; totalAmountCents: number | null }) {
  if (stepKey === 'avaliacao_feita') {
    return <Text className="text-xs text-muted-foreground">{formatDate(data.created_at)} · 1º atendimento registrado</Text>
  }
  if (stepKey === 'proposta_enviada') {
    const count = data.proposed_session_count
    const level = data.proposed_patient_level
    const cycle = proposedSessionCountLabels[count] ?? `${count} sessões`
    const levelLabel = patientLevelLabels[level] ?? level
    const total = totalAmountCents != null ? formatCurrency(totalAmountCents) : '—'
    return <Text className="text-xs text-muted-foreground">{cycle} · {levelLabel} · {total}</Text>
  }
  if (stepKey === 'em_analise') {
    if (!data.response_deadline_at) {
      return <Text className="text-xs text-muted-foreground">Família terá até 5 dias úteis para responder após o envio da proposta</Text>
    }
    const remaining = daysUntil(data.response_deadline_at)
    if (remaining <= 0) {
      return <Text className="text-xs text-muted-foreground">Família tinha até 5 dias úteis — prazo encerrado</Text>
    }
    const dayWord = remaining === 1 ? 'dia útil' : 'dias úteis'
    return <Text className="text-xs text-muted-foreground">Família tem até 5 dias úteis — restam {remaining} {dayWord}</Text>
  }
  if (stepKey === 'resposta') {
    const response = resolveResponseLabel(data.status)
    if (!response) return null
    return <Text className="text-xs text-muted-foreground">{response}</Text>
  }
  return null
}

function TrackingTimeline({ data, totalAmountCents }: { data: AssessmentDetail; totalAmountCents: number | null }) {
  return (
    <View className="gap-0">
      {TRACKING_STEPS.map((step, index) => {
        const state = resolveStepState(index, data.status)
        const done = state === 'done'
        const current = state === 'current'
        const isLast = index === TRACKING_STEPS.length - 1
        const showDescription = done || current

        return (
          <View key={step.key} className="flex-row gap-3">
            <View className="items-center">
              <StepIcon state={state} />
              {!isLast && (
                <View
                  className={`w-0.5 flex-1 min-h-[2rem] my-1 ${
                    done ? 'bg-emerald-600/40' : current ? 'bg-primary/25' : 'bg-border'
                  }`}
                />
              )}
            </View>
            <View className={`pb-6 min-w-0 flex-1 ${isLast ? 'pb-0' : ''}`}>
              <Text
                className={`text-sm font-medium ${
                  current ? 'text-primary' : done ? 'text-foreground' : state === 'locked' ? 'text-muted-foreground' : 'text-foreground'
                }`}
              >
                {step.label}
              </Text>
              {showDescription && <StepDescription stepKey={step.key} data={data} totalAmountCents={totalAmountCents} />}
            </View>
          </View>
        )
      })}
    </View>
  )
}

function ClinicalTile({ label, value }: { label: string; value: string }) {
  return (
    <View className="rounded-xl border border-border bg-muted/40 p-4 flex-1 min-h-[88px]">
      <Text className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</Text>
      <Text className="text-sm font-medium mt-1.5 leading-snug">{value}</Text>
    </View>
  )
}

function PlanRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-4 py-3 border-b border-border/60 last:border-0">
      <Text className="text-sm text-muted-foreground shrink-0">{label}</Text>
      <Text className="text-sm font-medium text-right flex-1">{value}</Text>
    </View>
  )
}

function CardSection({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <View className="rounded-xl border border-border bg-card overflow-hidden">
      <View className="px-5 py-4 border-b border-border bg-muted/20">
        <Text className="text-sm font-semibold text-foreground">{title}</Text>
        {subtitle ? <Text className="text-xs text-muted-foreground mt-0.5">{subtitle}</Text> : null}
      </View>
      <View className="p-5">{children}</View>
    </View>
  )
}

export default function AvaliacaoDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  const { data: assessment, isLoading } = useQuery({
    queryKey: ['pp', 'assessment', id],
    queryFn: () => getAssessmentDetail(id!),
    enabled: !!id,
  })

  const { data: totalAmountCents } = useQuery({
    queryKey: ['pp', 'assessment', id, 'total', assessment?.patient_id, assessment?.proposed_patient_level, assessment?.proposed_session_count],
    queryFn: () =>
      estimateAssessmentProposalTotalCents({
        patientId: assessment!.patient_id,
        patientLevel: assessment!.proposed_patient_level,
        sessionCount: assessment!.proposed_session_count,
      }),
    enabled: !!assessment?.patient_id && !!assessment?.proposed_patient_level,
  })

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background" edges={['bottom']}>
        <ActivityIndicator size="large" color="#17310A" />
      </SafeAreaView>
    )
  }

  if (!assessment) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
        <PageHeader>
          <View className="flex-row items-center gap-2">
            <Pressable onPress={() => router.back()} className="p-2">
              <ArrowLeft size={22} color="#17310A" />
            </Pressable>
            <Text className="text-lg font-semibold text-foreground">Avaliação</Text>
          </View>
        </PageHeader>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-sm text-muted-foreground">Avaliação não encontrada.</Text>
        </View>
      </SafeAreaView>
    )
  }

  const levelChanged = assessment.proposed_patient_level !== assessment.suggested_patient_level
  const unitPriceCents = totalAmountCents != null && assessment.proposed_session_count > 0
    ? Math.round(totalAmountCents / assessment.proposed_session_count)
    : null

  const levelLabel = patientLevelLabels[assessment.proposed_patient_level] ?? assessment.proposed_patient_level
  const cycleLabel = proposedSessionCountLabels[assessment.proposed_session_count] ?? `${assessment.proposed_session_count} sessões`
  const freqLabel = weeklyFrequencyLabels[assessment.proposed_weekly_frequency] ?? `${assessment.proposed_weekly_frequency}x/semana`
  const suggestedFreq = assessment.suggested_weekly_frequency
  const freqDetail =
    suggestedFreq != null && suggestedFreq !== assessment.proposed_weekly_frequency
      ? `${freqLabel} (cadastro sugeria ${Math.round(suggestedFreq)}x)`
      : `${freqLabel} (sugerida)`

  const region = assessment.patients?.regions
  const city = assessment.patients?.cities?.name
  const regionLabel =
    region?.code && city ? `Região ${region.code} · ${city}`
    : region?.code ? `Região ${region.code}${region.name ? ` · ${region.name}` : ''}`
    : city ? city
    : '—'

  const evaluator = assessment.evaluator
  const evaluatorLabel = evaluator?.full_name
    ? ppClassLabels[evaluator.pp_class ?? ''] ? `${evaluator.full_name} · ${ppClassLabels[evaluator.pp_class!]}` : evaluator.full_name
    : '—'

  const responsibles = assessment.patients?.patient_responsibles
  const primaryResponsible = responsibles?.length
    ? (responsibles.find((r) => r.is_primary) ?? responsibles[0]).full_name
    : '—'

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <PageHeader>
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()} className="p-2">
            <ArrowLeft size={22} color="#17310A" />
          </Pressable>
          <Text className="flex-1 text-lg font-semibold text-foreground" numberOfLines={1}>
            {assessment.patients?.full_name ?? 'Paciente'}
          </Text>
        </View>
      </PageHeader>

      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-4 pb-8">
        <CardSection title="Rastreio da proposta" subtitle="Acompanhe até a família responder SIM ou NÃO à proposta de tratamento.">
          <TrackingTimeline data={assessment} totalAmountCents={totalAmountCents ?? null} />
        </CardSection>

        <CardSection title="Dados clínicos" subtitle="Diagnóstico, comorbidades e mobilidade registrados na avaliação.">
          <View className="flex-row flex-wrap gap-3">
            <ClinicalTile label="Diagnóstico principal" value={assessment.primary_diagnosis} />
            <ClinicalTile label="Comorbidades" value={assessment.comorbidities?.trim() || '—'} />
            <ClinicalTile label="Mobilidade" value={assessment.mobility} />
            <ClinicalTile label="Responsável legal" value={primaryResponsible} />
          </View>
        </CardSection>

        <CardSection title="Plano terapêutico" subtitle={`CREFITO ${assessment.crefito_number}`}>
          <View className="gap-0">
            <PlanRow label="Região" value={regionLabel} />
            <PlanRow label="Nível" value={unitPriceCents != null ? `${levelLabel} · ${formatCurrency(unitPriceCents)}/sessão` : levelLabel} />
            <PlanRow label="Ciclo proposto" value={totalAmountCents != null ? `${cycleLabel} · ${formatCurrency(totalAmountCents)}` : cycleLabel} />
            <PlanRow label="Frequência" value={freqDetail} />
            <PlanRow label="Profissional" value={evaluatorLabel} />
            {levelChanged && assessment.patient_level_change_reason && (
              <PlanRow
                label="Alteração de nível"
                value={`${patientLevelLabels[assessment.suggested_patient_level] ?? assessment.suggested_patient_level} → ${levelLabel} — ${assessment.patient_level_change_reason}`}
              />
            )}
            {assessment.clinical_content?.trim() && (
              <PlanRow label="Laudo complementar" value={assessment.clinical_content.trim()} />
            )}
          </View>
        </CardSection>
      </ScrollView>
    </SafeAreaView>
  )
}
