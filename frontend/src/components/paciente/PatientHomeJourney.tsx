import { useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronUp, Circle, CircleDot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PatientHomeContext } from '@/services/patientPortal'

type StepState = 'done' | 'current' | 'waiting' | 'locked'

type JourneyStep = {
  key: string
  label: string
  description?: string
  state: StepState
}

export function shouldCompactJourney(context: PatientHomeContext): boolean {
  return Boolean(context.activeCycle) && !context.pendingProposal && !context.pendingCharge
}

export function buildJourneySteps(context: PatientHomeContext): JourneyStep[] {
  const { latestAssessment, pendingProposal, activeCycle, pendingCharge } = context
  const assessment = latestAssessment
  const respondedSim =
    assessment?.family_response === 'SIM' || assessment?.status === 'respondida_sim'
  const respondedNao =
    assessment?.family_response === 'NAO' || assessment?.status === 'respondida_nao'
  const proposalResolved = respondedSim || respondedNao || assessment?.status === 'vencida'

  const steps: JourneyStep[] = [
    {
      key: 'cadastro',
      label: 'Cadastro',
      description: 'Paciente cadastrado na Larsana',
      state: 'done',
    },
    {
      key: 'avaliacao',
      label: 'Avaliação',
      description: assessment
        ? 'Profissional registrou a avaliação domiciliar'
        : 'Aguardando visita do profissional',
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
  if (state === 'done') {
    return <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
  }
  if (state === 'current') {
    return <CircleDot size={20} className="text-primary shrink-0" />
  }
  if (state === 'waiting') {
    return <CircleDot size={20} className="text-muted-foreground shrink-0" />
  }
  return <Circle size={20} className="text-muted-foreground/40 shrink-0" />
}

function JourneyStepList({ steps, compactDone }: { steps: JourneyStep[]; compactDone?: boolean }) {
  return (
    <div className={cn('space-y-0', compactDone && 'opacity-90')}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1
        const showDescription = step.state === 'done' || step.state === 'current' || step.state === 'waiting'

        return (
          <div key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <StepIcon state={step.state} />
              {!isLast && (
                <div
                  className={cn(
                    'w-0.5 flex-1 min-h-[2rem] my-1',
                    step.state === 'done' ? 'bg-emerald-600/40' : 'bg-border',
                  )}
                />
              )}
            </div>
            <div className={cn('pb-6 min-w-0', isLast && 'pb-0')}>
              <p
                className={cn(
                  'text-sm font-medium',
                  step.state === 'current' && 'text-primary',
                  step.state === 'locked' && 'text-muted-foreground',
                  step.state === 'done' && compactDone && 'text-muted-foreground',
                )}
              >
                {step.label}
              </p>
              {showDescription && step.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function PatientHomeJourney({ context }: { context: PatientHomeContext }) {
  const [expanded, setExpanded] = useState(false)
  const steps = buildJourneySteps(context)
  const compact = shouldCompactJourney(context)
  const doneCount = steps.filter((step) => step.state === 'done').length

  if (compact && !expanded) {
    return (
      <section className="rounded-xl border border-border/80 bg-card overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <p className="min-w-0 flex-1 text-sm font-medium text-foreground">
            {doneCount} etapas concluídas
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-1"
            onClick={() => setExpanded(true)}
          >
            Ver jornada
            <ChevronDown className="size-4" />
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section
      className={cn(
        'rounded-xl border bg-card overflow-hidden',
        compact ? 'border-border/80 shadow-none' : 'border-border shadow-sm',
      )}
    >
      <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-sm">Sua jornada</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {compact ? 'Histórico das etapas do cuidado' : 'Acompanhe as etapas do cuidado'}
          </p>
        </div>
        {compact && expanded ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 gap-1 px-2 -mr-2 text-muted-foreground"
            onClick={() => setExpanded(false)}
          >
            Recolher
            <ChevronUp className="size-4" />
          </Button>
        ) : null}
      </div>
      <div className="p-5">
        <JourneyStepList steps={steps} compactDone={compact && expanded} />
      </div>
    </section>
  )
}
