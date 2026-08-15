import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CycleSessionsProgress } from '@/components/cycles/CycleSessionsProgress'
import { PatientRescheduleSessionDialog } from '@/components/paciente/PatientRescheduleSessionDialog'
import { PacienteEmptyState, PacienteSubpageShell } from '@/components/paciente/PacienteSubpageShell'
import { sessionStatusLabels } from '@/constants/labels'
import { formatDateTime } from '@/lib/formatters'
import { loadPatientCycleDetail, patientTreatmentQueryKeys } from '@/services/patientTreatment'
import { cn } from '@/lib/utils'

function sessionStatusBadgeClass(status: string) {
  if (status === 'realizada') {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
  }
  if (status === 'prevista' || status === 'remarcada') {
    return 'bg-sky-100 text-sky-900 dark:bg-sky-950/40 dark:text-sky-300'
  }
  if (status === 'falta' || status === 'cancelada_sem_justificativa') {
    return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
  }
  return 'bg-muted text-muted-foreground'
}

export function PacienteCicloDetailPage() {
  const { id = '' } = useParams()
  const [rescheduleSessionId, setRescheduleSessionId] = useState<string | null>(null)
  const [rescheduleScheduledAt, setRescheduleScheduledAt] = useState<string | null>(null)

  const { data: cycle, isLoading, refetch } = useQuery({
    queryKey: patientTreatmentQueryKeys.detail(id),
    queryFn: () => loadPatientCycleDetail(id),
    enabled: !!id,
  })

  const needsPayment = cycle
    ? cycle.status === 'aguardando_pagamento'
      || cycle.payment_status === 'pendente'
      || cycle.payment_status === 'vencido'
    : false
  const payHref = cycle?.pendingChargeId
    ? `/paciente/pagamentos/${cycle.pendingChargeId}`
    : '/paciente/pagamentos'

  const canReschedule = cycle?.payment_status === 'pago' && cycle.status === 'ativo'

  return (
    <PacienteSubpageShell
      title={cycle ? `Ciclo #${cycle.cycle_number}` : 'Ciclo'}
      backTo="/paciente/tratamento"
      loading={isLoading}
    >
      <div className="space-y-6 pb-8">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando ciclo…</p>
        ) : !cycle ? (
          <PacienteEmptyState message="Ciclo não encontrado." />
        ) : (
          <>
            {needsPayment && (
              <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/25 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                    <CreditCard size={18} className="text-amber-800 dark:text-amber-300" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div>
                      <p className="font-semibold text-foreground">Pagamento pendente</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Pague este ciclo para liberar as terapias domiciliares.
                      </p>
                    </div>
                    <Button asChild size="sm">
                      <Link to={payHref}>Pagar</Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <section className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="space-y-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Progresso do ciclo</p>
                  {cycle.professionalName && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Profissional: {cycle.professionalName}
                    </p>
                  )}
                </div>
                <CycleSessionsProgress
                  done={cycle.completedSessions}
                  total={cycle.session_count}
                  fullWidth
                />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Terapias</h3>

              {cycle.sessions.length === 0 ? (
                <PacienteEmptyState message="Nenhuma terapia registrada neste ciclo." />
              ) : (
                <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
                  {cycle.sessions.map((session) => {
                    const sessionLabel = sessionStatusLabels[session.status] ?? session.status
                    const showReschedule =
                      canReschedule
                      && session.scheduled_at
                      && (session.status === 'prevista' || session.status === 'remarcada')

                    return (
                      <div key={session.id} className="flex items-start gap-3 px-4 py-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground">Terapia {session.session_number}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {session.scheduled_at
                              ? formatDateTime(session.scheduled_at)
                              : 'Data a definir'}
                            {session.professionalName ? ` · ${session.professionalName}` : ''}
                          </p>
                          {showReschedule && (
                            <Button
                              type="button"
                              variant="link"
                              className="h-auto p-0 mt-2 text-xs"
                              onClick={() => {
                                setRescheduleSessionId(session.id)
                                setRescheduleScheduledAt(session.scheduled_at)
                              }}
                            >
                              Remarcar
                            </Button>
                          )}
                        </div>
                        <span
                          className={cn(
                            'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
                            sessionStatusBadgeClass(session.status),
                          )}
                        >
                          {sessionLabel}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {rescheduleSessionId && rescheduleScheduledAt && (
              <PatientRescheduleSessionDialog
                open
                onOpenChange={(open) => {
                  if (!open) {
                    setRescheduleSessionId(null)
                    setRescheduleScheduledAt(null)
                  }
                }}
                sessionId={rescheduleSessionId}
                patientId={cycle.patient_id}
                scheduledAt={rescheduleScheduledAt}
                onSuccess={() => refetch()}
              />
            )}
          </>
        )}
      </div>
    </PacienteSubpageShell>
  )
}
