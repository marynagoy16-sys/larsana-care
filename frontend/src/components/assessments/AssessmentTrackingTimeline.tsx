import { CheckCircle2, Circle, CircleDot } from 'lucide-react'
import { cn } from '@/lib/utils'
import { patientLevelLabels, proposedSessionCountLabels } from '@/constants/labels'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { businessDaysRemainingUntil, resolveFamilyResponseDeadline } from '@/lib/businessDays'

const TRACKING_STEPS = [
  { key: 'avaliacao_feita', label: 'Avaliação feita' },
  { key: 'proposta_enviada', label: 'Proposta enviada' },
  { key: 'em_analise', label: 'Em análise (5 dias)' },
  { key: 'resposta', label: 'Resposta da família' },
] as const

const STATUS_ORDER = [
  'avaliacao_feita',
  'proposta_enviada',
  'em_analise',
  'respondida_sim',
  'respondida_nao',
  'vencida',
] as const

export type AssessmentTrackingData = {
  status: string
  createdAt: string
  proposalSentAt?: string | null
  responseDeadlineAt?: string | null
  proposedSessionCount?: number
  proposedPatientLevel?: string
  totalAmountCents?: number | null
  /** Quando definido, exibe repasse em vez do valor total ao paciente (visão PP). */
  repasseTotalCents?: number | null
}

function resolveWorkflowIndex(status: string): number {
  if (status === 'respondida_sim' || status === 'respondida_nao' || status === 'vencida') {
    return 3
  }
  const idx = STATUS_ORDER.indexOf(status as (typeof STATUS_ORDER)[number])
  return idx >= 0 ? Math.min(idx, 3) : 0
}

function resolveResponseLabel(status: string): string | null {
  if (status === 'respondida_sim') return 'Família aceitou (SIM)'
  if (status === 'respondida_nao') return 'Família recusou (NÃO)'
  if (status === 'vencida') return 'Prazo vencido'
  return null
}

type StepState = 'locked' | 'unlocked' | 'done' | 'current'

function resolveStepState(stepIndex: number, status: string): StepState {
  const workflowIndex = resolveWorkflowIndex(status)
  const hasAssessment = true

  if (stepIndex === 0) {
    if (workflowIndex === 0 && status === 'avaliacao_feita') return 'current'
    return 'done'
  }

  if (stepIndex === 1 || stepIndex === 2) {
    if (!hasAssessment) return 'locked'
    if (stepIndex < workflowIndex) return 'done'
    if (stepIndex === workflowIndex) return 'current'
    return 'locked'
  }

  if (workflowIndex >= 3) return 'current'
  return 'locked'
}

function StepDescription({ stepKey, data }: { stepKey: string; data: AssessmentTrackingData }) {
  if (stepKey === 'avaliacao_feita') {
    return (
      <p className="text-xs text-muted-foreground mt-0.5">
        {formatDate(data.createdAt)} · 1º atendimento registrado
      </p>
    )
  }

  if (stepKey === 'proposta_enviada') {
    const sessionCount = data.proposedSessionCount
    const level = data.proposedPatientLevel
    if (!sessionCount || !level) return null

    const cycleLabel =
      proposedSessionCountLabels[sessionCount as 4 | 8 | 12] ?? `${sessionCount} sessões`
    const levelLabel = patientLevelLabels[level] ?? level
    const amountLabel =
      data.repasseTotalCents != null
        ? `${formatCurrency(data.repasseTotalCents)} repasse/ciclo`
        : data.totalAmountCents != null
          ? formatCurrency(data.totalAmountCents)
          : '—'

    return (
      <p className="text-xs text-muted-foreground mt-0.5">
        {cycleLabel} · {levelLabel} · {amountLabel}
      </p>
    )
  }

  if (stepKey === 'em_analise') {
    const deadline = resolveFamilyResponseDeadline({
      responseDeadlineAt: data.responseDeadlineAt,
      proposalSentAt: data.proposalSentAt,
    })

    if (!deadline) {
      return (
        <p className="text-xs text-muted-foreground mt-0.5">
          Família terá até 5 dias úteis para responder após o envio da proposta
        </p>
      )
    }

    const remaining = businessDaysRemainingUntil(deadline)
    if (remaining <= 0) {
      return (
        <p className="text-xs text-muted-foreground mt-0.5">
          Família tinha até 5 dias úteis — prazo encerrado
        </p>
      )
    }

    const dayWord = remaining === 1 ? 'dia útil' : 'dias úteis'
    return (
      <p className="text-xs text-muted-foreground mt-0.5">
        Família tem até 5 dias úteis — restam {remaining} {dayWord}
      </p>
    )
  }

  if (stepKey === 'resposta') {
    const responseLabel = resolveResponseLabel(data.status)
    if (!responseLabel) return null
    return <p className="text-xs text-muted-foreground mt-0.5">{responseLabel}</p>
  }

  return null
}

export function AssessmentTrackingTimeline({ data }: { data: AssessmentTrackingData }) {
  return (
    <div className="space-y-0">
      {TRACKING_STEPS.map((step, index) => {
        const state = resolveStepState(index, data.status)
        const done = state === 'done'
        const current = state === 'current'
        const unlocked = state === 'unlocked'
        const isLast = index === TRACKING_STEPS.length - 1
        const showDescription = state === 'done' || state === 'current'

        return (
          <div key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              {done ? (
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
              ) : current ? (
                <CircleDot size={20} className="text-primary shrink-0" />
              ) : unlocked ? (
                <CircleDot size={20} className="text-muted-foreground shrink-0" />
              ) : (
                <Circle size={20} className="text-muted-foreground/40 shrink-0" />
              )}
              {!isLast && (
                <div
                  className={cn(
                    'w-0.5 flex-1 min-h-[2rem] my-1',
                    done ? 'bg-emerald-600/40' : unlocked || current ? 'bg-primary/25' : 'bg-border',
                  )}
                />
              )}
            </div>
            <div className={cn('pb-6 min-w-0', isLast && 'pb-0')}>
              <p
                className={cn(
                  'text-sm font-medium',
                  current && 'text-primary',
                  done && 'text-foreground',
                  unlocked && 'text-foreground',
                  state === 'locked' && 'text-muted-foreground',
                )}
              >
                {step.label}
              </p>
              {showDescription && <StepDescription stepKey={step.key} data={data} />}
            </div>
          </div>
        )
      })}
    </div>
  )
}
