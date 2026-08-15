import { CheckCircle2, Circle, CircleDot } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PatientServiceDemand } from '@/services/patientServiceRequest'

const STEPS = [
  { key: 'enviada', label: 'Solicitação enviada' },
  { key: 'buscando', label: 'Procurando profissional parceiro' },
  { key: 'waitlist', label: 'Lista de espera / sem cobertura imediata' },
  { key: 'atribuido', label: 'Profissional parceiro atribuído' },
] as const

function resolveStepIndex(demand: PatientServiceDemand | null | undefined, hasWaitlist?: boolean): number {
  if (hasWaitlist && !demand) return 2
  if (!demand) return -1
  if (demand.status === 'alocada' || demand.assigned_professional_id) return 3
  if (demand.status === 'aberta') return 1
  return 0
}

type Props = {
  demand?: PatientServiceDemand | null
  hasWaitlist?: boolean
  createdAt?: string
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

export function ServiceRequestTimeline({ demand, hasWaitlist, createdAt }: Props) {
  const activeIndex = resolveStepIndex(demand, hasWaitlist)
  if (activeIndex < 0 && !hasWaitlist) return null

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-4 text-sm font-semibold text-foreground">Acompanhe sua solicitação</p>
      <div className="space-y-0">
        {STEPS.map((step, index) => {
          const done = index < activeIndex
          const current = index === activeIndex
          const isLast = index === STEPS.length - 1
          const Icon = done ? CheckCircle2 : current ? CircleDot : Circle

          return (
            <div key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center self-stretch">
                <Icon
                  className={cn('size-5 shrink-0', done || current ? 'text-primary' : 'text-muted-foreground/60')}
                />
                {!isLast ? (
                  <div
                    className={cn(
                      'mt-1 w-px flex-1 min-h-4',
                      done ? 'bg-primary/35' : 'bg-border',
                    )}
                  />
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
                  {step.label}
                </p>
                {index === 0 && createdAt ? (
                  <p className="text-xs text-muted-foreground">{formatWhen(createdAt)}</p>
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
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
