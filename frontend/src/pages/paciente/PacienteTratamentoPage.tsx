import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PacienteEmptyState } from '@/components/paciente/PacienteSubpageShell'
import { PatientActiveTreatmentCard } from '@/components/paciente/PatientActiveTreatmentCard'
import { cycleStatusLabels } from '@/constants/labels'
import { loadPatientTreatmentPage, patientTreatmentQueryKeys } from '@/services/patientTreatment'
import { cn } from '@/lib/utils'

function cycleStatusBadgeClass(status: string) {
  if (status === 'ativo') {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
  }
  if (status === 'encerrado' || status === 'fechado_financeiramente') {
    return 'bg-muted text-muted-foreground'
  }
  if (status === 'aguardando_pagamento') {
    return 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300'
  }
  return 'bg-muted text-muted-foreground'
}

export function PacienteTratamentoPage() {
  const { data, isLoading } = useQuery({
    queryKey: patientTreatmentQueryKeys.list,
    queryFn: loadPatientTreatmentPage,
  })

  const activeCycle = data?.activeCycle ?? null
  const cycles = data?.cycles ?? []
  const otherCycles = activeCycle ? cycles.filter((cycle) => cycle.id !== activeCycle.id) : cycles

  return (
    <CrudScrollPageLayout>
      <div className="space-y-6 pb-8">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando tratamento…</p>
        ) : cycles.length === 0 ? (
          <PacienteEmptyState message="Nenhum ciclo de tratamento encontrado no momento." />
        ) : (
          <>
            {activeCycle && <PatientActiveTreatmentCard cycle={activeCycle} />}

            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">
                {activeCycle ? 'Outros ciclos' : 'Todos os ciclos'}
              </h2>

              {otherCycles.length === 0 ? (
                <p className="text-sm text-muted-foreground">Você possui apenas o ciclo ativo no momento.</p>
              ) : (
                <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
                  {otherCycles.map((cycle) => {
                    const statusLabel = cycleStatusLabels[cycle.status] ?? cycle.status

                    return (
                      <Link
                        key={cycle.id}
                        to={`/paciente/tratamento/ciclo/${cycle.id}`}
                        className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/40"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground">Ciclo #{cycle.cycle_number}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {cycle.professionalName ? `${cycle.professionalName} · ` : ''}
                            {cycle.completedSessions}/{cycle.session_count} sessões
                          </p>
                        </div>
                        <span
                          className={cn(
                            'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
                            cycleStatusBadgeClass(cycle.status),
                          )}
                        >
                          {statusLabel}
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                      </Link>
                    )
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </CrudScrollPageLayout>
  )
}
