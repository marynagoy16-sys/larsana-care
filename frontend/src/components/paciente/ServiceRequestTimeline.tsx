import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, CircleDot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PatientServiceDemand } from '@/services/patientServiceRequest'

const BASE_STEPS = [
  { key: 'pagamento', label: 'Pagamento da avaliação' },
  { key: 'enviada', label: 'Solicitação enviada' },
  { key: 'buscando', label: 'Procurando profissional parceiro' },
  { key: 'waitlist', label: 'Lista de espera / sem cobertura imediata' },
  { key: 'avaliacao', label: 'Avaliação domiciliar' },
  { key: 'plano', label: 'Escolha do plano de tratamento' },
  { key: 'ciclo', label: 'Pagamento do ciclo' },
  { key: 'atribuido', label: 'Profissional parceiro atribuído' },
  { key: 'horario', label: 'Confirmar horário no chat' },
] as const

type StepKey = (typeof BASE_STEPS)[number]['key']

function resolveVisibleSteps(
  hasWaitlist?: boolean,
  pendingScheduling?: boolean,
  awaitingAssessmentPayment?: boolean,
): StepKey[] {
  if (awaitingAssessmentPayment) {
    return ['pagamento', 'enviada', 'buscando', 'atribuido']
  }
  if (hasWaitlist && pendingScheduling) {
    return ['enviada', 'waitlist', 'atribuido', 'horario']
  }
  if (hasWaitlist) {
    return ['enviada', 'waitlist']
  }
  if (pendingScheduling) {
    return ['enviada', 'buscando', 'atribuido', 'horario']
  }
  return ['enviada', 'buscando', 'atribuido']
}

function resolveStepIndex(
  demand: PatientServiceDemand | null | undefined,
  hasWaitlist?: boolean,
  pendingScheduling?: boolean,
  awaitingAssessmentPayment?: boolean,
): number {
  if (awaitingAssessmentPayment) return 0
  if (hasWaitlist && !demand) return 1
  if (!demand) return -1
  if (pendingScheduling) return 3
  if (demand.status === 'alocada' || demand.assigned_professional_id) return 2
  if (demand.status === 'aberta') return 1
  return 0
}

type Props = {
  demand?: PatientServiceDemand | null
  hasWaitlist?: boolean
  pendingScheduling?: boolean
  awaitingAssessmentPayment?: boolean
  createdAt?: string
  assignedProfessional?: { name: string; rating?: number | null } | null
}

function formatWhen(iso?: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export function ServiceRequestTimeline({
  demand,
  hasWaitlist,
  pendingScheduling,
  awaitingAssessmentPayment,
  createdAt,
  assignedProfessional,
}: Props) {
  const visibleKeys = resolveVisibleSteps(hasWaitlist, pendingScheduling, awaitingAssessmentPayment)
  const steps = BASE_STEPS.filter((step) => visibleKeys.includes(step.key))
  const activeIndex = resolveStepIndex(
    demand,
    hasWaitlist,
    pendingScheduling,
    awaitingAssessmentPayment,
  )

  if (activeIndex < 0 && !hasWaitlist) return null

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-4 text-sm font-semibold text-foreground">Acompanhe sua solicitação</p>
      <div className="space-y-0">
        {steps.map((step, index) => {
          const done = index < activeIndex
          const current = index === activeIndex
          const isLast = index === steps.length - 1
          const Icon = done ? CheckCircle2 : current ? CircleDot : Circle

          return (
            <div key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center self-stretch">
                <Icon
                  className={cn('size-5 shrink-0', done || current ? 'text-primary' : 'text-muted-foreground/60')}
                />
                {!isLast ? (
                  <div className={cn('mt-1 w-px flex-1 min-h-4', done ? 'bg-primary/35' : 'bg-border')} />
                ) : null}
              </div>
              <div className={cn('min-w-0 flex-1 space-y-0.5', !isLast && 'pb-4')}>
                <p
                  className={cn(
                    'text-sm',
                    current ? 'font-semibold text-foreground' : 'text-muted-foreground',
                    done && 'text-foreground',
                  )}
                >
                  {step.key === 'pagamento' && current && awaitingAssessmentPayment
                    ? 'Aguardando pagamento'
                    : step.label}
                </p>
                {index === 0 && createdAt ? (
                  <p className="text-xs text-muted-foreground">{formatWhen(createdAt)}</p>
                ) : null}
                {current && step.key === 'pagamento' ? (
                  <p className="text-xs text-muted-foreground pt-1">
                    Aguardando pagamento da taxa de avaliação para enviarmos sua solicitação.
                  </p>
                ) : null}
                {current && step.key === 'buscando' ? (
                  <p className="text-xs text-muted-foreground">
                    Estamos buscando um profissional parceiro disponível na sua região.
                  </p>
                ) : null}
                {current && step.key === 'waitlist' ? (
                  <p className="text-xs text-muted-foreground">
                    Registramos seu interesse. Nossa equipe avisará quando houver cobertura.
                  </p>
                ) : null}
                {current && step.key === 'atribuido' && assignedProfessional ? (
                  <p className="text-xs text-muted-foreground">
                    {assignedProfessional.name}
                    {assignedProfessional.rating != null
                      ? ` · Nota ${assignedProfessional.rating.toFixed(1)}/10`
                      : ''}
                  </p>
                ) : null}
                {current && step.key === 'horario' ? (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs text-muted-foreground">
                      O profissional enviou opções de horário no chat com a Sara.
                    </p>
                    <Button asChild size="sm" className="h-8">
                      <Link to="/paciente/chat">Abrir chat</Link>
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
