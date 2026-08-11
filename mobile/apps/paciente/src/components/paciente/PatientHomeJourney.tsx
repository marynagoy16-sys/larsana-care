import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { CheckCircle2, ChevronDown, ChevronUp, Circle, CircleDot } from 'lucide-react-native'
import { cn } from '@/lib/cn'
import type { PatientHomeContext } from '@/services/patientPortal'

type StepState = 'done' | 'current' | 'waiting' | 'locked'

type JourneyStep = {
  key: string
  label: string
  description?: string
  state: StepState
}

function shouldCompactJourney(context: PatientHomeContext): boolean {
  return Boolean(context.activeCycle) && !context.pendingProposal && !context.pendingCharge
}

function buildJourneySteps(context: PatientHomeContext): JourneyStep[] {
  const { latestAssessment, pendingProposal, activeCycle, pendingCharge } = context
  const assessment = latestAssessment
  const respondedSim =
    assessment?.family_response === 'SIM' || assessment?.status === 'respondida_sim'
  const respondedNao =
    assessment?.family_response === 'NAO' || assessment?.status === 'respondida_nao'
  const proposalResolved = respondedSim || respondedNao || assessment?.status === 'vencida'

  const steps: JourneyStep[] = [
    { key: 'cadastro', label: 'Cadastro', description: 'Paciente cadastrado na Larsana', state: 'done' },
    {
      key: 'avaliacao',
      label: 'Avaliação',
      description: assessment ? 'Profissional registrou a avaliação domiciliar' : 'Aguardando visita do profissional',
      state: assessment ? 'done' : 'locked',
    },
    {
      key: 'proposta',
      label: 'Proposta',
      description: pendingProposal
        ? 'Sua resposta SIM ou NÃO'
        : proposalResolved
          ? respondedSim
            ? 'Família aceitou iniciar o tratamento'
            : respondedNao
              ? 'Família optou por não iniciar agora'
              : 'Prazo de resposta encerrado'
          : assessment?.status === 'avaliacao_feita'
            ? 'Em breve você receberá a proposta'
            : 'Aguardando proposta',
      state: pendingProposal
        ? 'current'
        : proposalResolved
          ? 'done'
          : assessment?.status === 'avaliacao_feita'
            ? 'waiting'
            : assessment
              ? 'waiting'
              : 'locked',
    },
  ]

  if (respondedSim || pendingCharge) {
    steps.push({
      key: 'pagamento',
      label: 'Pagamento do ciclo',
      description: pendingCharge
        ? 'Pague para liberar as sessões'
        : activeCycle
          ? 'Pagamento confirmado'
          : 'Aguardando cobrança',
      state: pendingCharge ? 'current' : activeCycle ? 'done' : respondedSim ? 'waiting' : 'locked',
    })
  }

  steps.push({
    key: 'tratamento',
    label: 'Tratamento',
    description: activeCycle
      ? 'Sessões domiciliares em andamento'
      : 'Inicia após confirmação do pagamento',
    state: activeCycle ? 'current' : respondedSim && !pendingCharge ? 'waiting' : 'locked',
  })

  return steps
}

function StepIcon({ state }: { state: StepState }) {
  if (state === 'done') return <CheckCircle2 size={20} color="#059669" />
  if (state === 'current') return <CircleDot size={20} color="#095742" />
  if (state === 'waiting') return <CircleDot size={20} color="#49796B" />
  return <Circle size={20} color="#d1d5db" />
}

function JourneyStepList({ steps }: { steps: JourneyStep[] }) {
  return (
    <>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1
        const showDescription = step.state === 'done' || step.state === 'current' || step.state === 'waiting'
        return (
          <View key={step.key} className="flex-row gap-3">
            <View className="items-center">
              <StepIcon state={step.state} />
              {!isLast ? (
                <View className={cn('my-1 min-h-8 w-0.5 flex-1', step.state === 'done' ? 'bg-emerald-600/40' : 'bg-border')} />
              ) : null}
            </View>
            <View className={cn('min-w-0 pb-6', isLast && 'pb-0')}>
              <Text
                className={cn(
                  'text-sm font-medium',
                  step.state === 'current' && 'text-primary',
                  step.state === 'locked' && 'text-muted-foreground',
                )}
              >
                {step.label}
              </Text>
              {showDescription && step.description ? (
                <Text className="mt-0.5 text-xs text-muted-foreground">{step.description}</Text>
              ) : null}
            </View>
          </View>
        )
      })}
    </>
  )
}

export function PatientHomeJourney({ context }: { context: PatientHomeContext }) {
  const [expanded, setExpanded] = useState(false)
  const steps = buildJourneySteps(context)
  const compact = shouldCompactJourney(context)
  const doneCount = steps.filter((step) => step.state === 'done').length

  if (compact && !expanded) {
    return (
      <View className="overflow-hidden rounded-xl border border-border/80 bg-muted/20">
        <View className="flex-row items-center gap-3 px-4 py-3">
          <CheckCircle2 size={18} color="#059669" />
          <Text className="min-w-0 flex-1 text-sm text-muted-foreground">
            <Text className="font-medium text-foreground">{doneCount} etapas concluídas</Text>
            {' · '}detalhes do tratamento acima
          </Text>
          <Pressable onPress={() => setExpanded(true)} className="flex-row items-center gap-1 px-1">
            <Text className="text-sm font-medium text-primary">Ver jornada</Text>
            <ChevronDown size={16} color="#095742" />
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <View className="overflow-hidden rounded-xl border border-border bg-card">
      <View className="flex-row items-start justify-between gap-3 border-b border-border px-5 py-4">
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-semibold text-foreground">Sua jornada</Text>
          <Text className="mt-0.5 text-xs text-muted-foreground">
            {compact ? 'Histórico das etapas do cuidado' : 'Acompanhe as etapas do cuidado'}
          </Text>
        </View>
        {compact && expanded ? (
          <Pressable onPress={() => setExpanded(false)} className="flex-row items-center gap-1 px-1">
            <Text className="text-sm text-muted-foreground">Recolher</Text>
            <ChevronUp size={16} color="#49796B" />
          </Pressable>
        ) : null}
      </View>
      <View className="p-5">
        <JourneyStepList steps={steps} />
      </View>
    </View>
  )
}
