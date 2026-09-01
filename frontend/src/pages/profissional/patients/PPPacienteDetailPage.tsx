import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, ArrowLeft, ChevronRight, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { DetailPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import {
  assessmentStatusLabels,
  patientLevelLabels,
} from '@/constants/labels'
import {
  formatAttendancePeriod,
  formatPatientAge,
  formatPatientSex,
  resolveDiagnosticHypothesis,
} from '@/lib/patientDisplay'
import { getPPPatientDetail, getPPPatientProntuario } from '@/services/ppPatients'
import { getPendingScheduleDemandForPatient } from '@/services/scheduling'
import { PPPatientProntuarioSection } from '@/components/profissional/patients/PPPatientProntuarioSection'
import { PPPatientSituationBadge } from '@/components/profissional/patients/PPPatientSituationBadge'

const FAMILY_RESPONSE_RESOLVED_STATUSES = new Set(['respondida_sim', 'respondida_nao', 'vencida'])

function isAwaitingFamilyAssessmentResponse(status: string) {
  return !FAMILY_RESPONSE_RESOLVED_STATUSES.has(status)
}

export function PPPacienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const goBack = () => navigate('/profissional/pacientes')
  const [showClinicalSummary, setShowClinicalSummary] = useState(false)

  const { data: patient, isLoading } = useQuery({
    queryKey: ['pp', 'patient_detail', id],
    queryFn: () => getPPPatientDetail(id!),
    enabled: !!id,
  })

  const { data: prontuario, isLoading: prontuarioLoading } = useQuery({
    queryKey: ['pp', 'patient', id, 'prontuario'],
    queryFn: () => getPPPatientProntuario(id!),
    enabled: !!id,
  })

  const { data: pendingScheduleDemand } = useQuery({
    queryKey: ['pp', 'patient_pending_schedule', id],
    queryFn: () => getPendingScheduleDemandForPatient(id!),
    enabled: !!id,
  })

  const openAssessment = () => {
    if (!id) return
    navigate(`/profissional/pacientes/${id}/avaliacao`)
  }

  if (isLoading) {
    return (
      <>
        <PageHeader loading>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0 rounded-xl" aria-label="Voltar">
              <ArrowLeft size={20} />
            </Button>
            <span className="font-display font-bold text-xl">Paciente</span>
          </div>
        </PageHeader>
        <CrudScrollPageLayout>
          <DetailPageSkeleton fields={6} />
        </CrudScrollPageLayout>
      </>
    )
  }

  if (!patient) {
    return (
      <>
        <PageHeader>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0 rounded-xl" aria-label="Voltar">
              <ArrowLeft size={20} />
            </Button>
            <span className="font-display font-bold text-xl">Paciente</span>
          </div>
        </PageHeader>
        <CrudScrollPageLayout>
          <p className="text-muted-foreground p-6">Paciente não encontrado ou não alocado a você.</p>
        </CrudScrollPageLayout>
      </>
    )
  }

  const primaryAddress =
    patient.patient_addresses?.find((a) => a.is_primary) ?? patient.patient_addresses?.[0] ?? null
  const latestAssessment =
    patient.initial_assessments?.length
      ? [...patient.initial_assessments].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )[0]
      : null
  const hypothesis = resolveDiagnosticHypothesis(patient.diagnostic_hypothesis, patient.clinical_summary)
  const showAssessmentAtTop =
    latestAssessment != null && isAwaitingFamilyAssessmentResponse(latestAssessment.status)

  const assessmentRegisteredCard = latestAssessment ? (
    <CascadeItem>
      <div className="rounded-xl border border-border bg-card px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="font-medium text-sm">Avaliação registrada</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Status: {assessmentStatusLabels[latestAssessment.status] ?? latestAssessment.status}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            navigate(`/profissional/avaliacoes/${latestAssessment.id}`, {
              state: { from: 'patient', patientId: id },
            })
          }
        >
          Ver rastreio
        </Button>
      </div>
    </CascadeItem>
  ) : null

  if (showClinicalSummary) {
    return (
      <>
        <PageHeader>
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowClinicalSummary(false)}
              className="shrink-0 rounded-xl"
              aria-label="Voltar"
            >
              <ArrowLeft size={20} />
            </Button>
            <h1 className="font-display font-bold text-xl truncate">Resumo clínico</h1>
          </div>
        </PageHeader>

        <CrudScrollPageLayout>
          <CascadeReveal className="space-y-5 pb-8">
            <CascadeItem>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="p-5 grid gap-4 sm:grid-cols-2 text-sm">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Idade</p>
                    <p className="font-medium">{formatPatientAge(patient.birth_date)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Sexo</p>
                    <p className="font-medium">{formatPatientSex(patient.sex)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Nível</p>
                    <p className="font-medium">
                      {patientLevelLabels[patient.patient_level ?? ''] ?? patient.patient_level ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Período</p>
                    <p className="font-medium">{formatAttendancePeriod(patient.attendance_period)}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Hipótese diagnóstica
                    </p>
                    <p className="font-medium">{hypothesis}</p>
                  </div>
                  {patient.clinical_summary ? (
                    <div className="sm:col-span-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Resumo clínico
                      </p>
                      <p className="text-muted-foreground whitespace-pre-wrap">{patient.clinical_summary}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </CascadeItem>

            {primaryAddress ? (
              <CascadeItem>
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                    <MapPin size={16} className="text-muted-foreground" />
                    <h3 className="font-semibold text-sm">Endereço de atendimento</h3>
                  </div>
                  <div className="p-5 text-sm">
                    <p className="font-medium">{primaryAddress.full_address}</p>
                    {primaryAddress.neighborhood ? (
                      <p className="text-muted-foreground mt-1">{primaryAddress.neighborhood}</p>
                    ) : null}
                  </div>
                </div>
              </CascadeItem>
            ) : (
              <CascadeItem>
                <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-6 text-center text-sm text-muted-foreground">
                  Endereço de atendimento não cadastrado.
                </div>
              </CascadeItem>
            )}
          </CascadeReveal>
        </CrudScrollPageLayout>
      </>
    )
  }

  return (
    <>
      <PageHeader>
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0 rounded-xl" aria-label="Voltar">
            <ArrowLeft size={20} />
          </Button>
          <div className="min-w-0">
            <h1 className="font-display text-base lg:text-lg truncate">
              <span className="font-bold">Paciente:</span>{' '}
              <span className="font-normal">{patient.full_name}</span>
            </h1>
            {patient.situation !== 'none' ? (
              <PPPatientSituationBadge
                className="mt-1"
                evaluation_pending={patient.evaluation_pending}
                latest_assessment_status={patient.latest_assessment_status}
                latest_cycle_status={patient.latest_cycle_status}
                latest_cycle_payment_status={patient.latest_cycle_payment_status}
                pending_evolution_count={patient.pending_evolution_count}
                care_status={patient.care_status}
              />
            ) : null}
          </div>
        </div>
      </PageHeader>

      <CrudScrollPageLayout>
        <CascadeReveal className="space-y-5 pb-8">
          {pendingScheduleDemand && (
            <CascadeItem>
              <div className="rounded-xl border border-primary/25 bg-primary/5 px-5 py-4">
                <p className="font-medium text-foreground">
                  {pendingScheduleDemand.demand_type === 'continuidade'
                    ? 'Horários da primeira terapia pendentes'
                    : 'Horários pendentes de envio'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {pendingScheduleDemand.demand_type === 'continuidade'
                    ? 'O paciente confirmou o pagamento. Envie opções de horário para a primeira terapia do ciclo.'
                    : 'Você assumiu este paciente, mas ainda não enviou opções de horário para a família confirmar.'}
                </p>
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() =>
                    navigate(`/profissional/demandas/${pendingScheduleDemand.id}/agendar`)
                  }
                >
                  Enviar horários ao paciente
                </Button>
              </div>
            </CascadeItem>
          )}

          {patient.evaluation_pending && (
            <CascadeItem>
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/20 px-5 py-4">
                <p className="font-medium text-amber-900 dark:text-amber-200">Avaliação inicial pendente</p>
                <p className="text-sm text-amber-800/90 dark:text-amber-300/90 mt-1">
                  Realize a visita domiciliar e registre a avaliação clínica para que a gestão envie a proposta à
                  família.
                </p>
                <Button size="sm" className="mt-3" onClick={openAssessment}>
                  Registrar avaliação
                </Button>
              </div>
            </CascadeItem>
          )}

          {showAssessmentAtTop ? assessmentRegisteredCard : null}

          <CascadeItem>
            <PPPatientProntuarioSection
              prontuario={prontuario}
              isLoading={prontuarioLoading}
            />
          </CascadeItem>

          <CascadeItem>
            <button
              type="button"
              onClick={() => setShowClinicalSummary(true)}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-left transition-colors hover:bg-muted/30 active:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <FileText className="size-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">Ver resumo clínico</p>
                <p className="text-xs text-muted-foreground mt-0.5">Dados clínicos e endereço de atendimento</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </CascadeItem>

          {!showAssessmentAtTop ? assessmentRegisteredCard : null}
        </CascadeReveal>
      </CrudScrollPageLayout>
    </>
  )
}
