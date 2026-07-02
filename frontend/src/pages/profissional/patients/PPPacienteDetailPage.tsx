import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MapPin, ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { DetailPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { CrudDrawer } from '@/components/crud/CrudDrawer'
import { Form } from '@/components/ui/form'
import { FormActions } from '@/components/crud/FormActions'
import { AssessmentProposalFields } from '@/components/assessments/AssessmentProposalFields'
import {
  assessmentStatusLabels,
  careStatusLabels,
  patientLevelLabels,
} from '@/constants/labels'
import {
  formatAttendancePeriod,
  formatPatientAge,
  formatPatientSex,
  resolveDiagnosticHypothesis,
} from '@/lib/patientDisplay'
import { getPPPatientDetail, getPPProfessionalCrefito } from '@/services/ppPatients'
import { getCurrentProfessional } from '@/services/professionals'
import { initialAssessmentsService } from '@/services/index'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import {
  assessmentProposalSchema,
  buildAssessmentProposalDefaults,
  normalizeWeeklyFrequency,
  type AssessmentProposalFormValues,
} from '@/schemas/assessmentProposal'

const ASSESSMENT_FORM_ID = 'pp-assessment-form'

export function PPPacienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const goBack = () => navigate('/profissional/pacientes')
  const [assessmentOpen, setAssessmentOpen] = useState(false)

  const { data: patient, isLoading } = useQuery({
    queryKey: ['pp', 'patient_detail', id],
    queryFn: () => getPPPatientDetail(id!),
    enabled: !!id,
  })

  const { data: professional } = useQuery({
    queryKey: ['pp', 'current_professional'],
    queryFn: getCurrentProfessional,
  })

  const { data: defaultCrefito } = useQuery({
    queryKey: ['pp', 'crefito'],
    queryFn: getPPProfessionalCrefito,
  })

  const form = useForm<AssessmentProposalFormValues>({
    resolver: zodResolver(assessmentProposalSchema) as never,
    defaultValues: buildAssessmentProposalDefaults(),
  })

  const suggestedLevel = form.watch('suggested_patient_level')
  const levelConfirmed = form.watch('level_confirmed')
  const showLevelChangeReason = levelConfirmed === false

  const createAssessment = useCrudMutation({
    mutationFn: async (values: AssessmentProposalFormValues) => {
      if (!professional?.id || !id) throw new Error('Profissional não encontrado')
      return initialAssessmentsService.create({
        patient_id: id,
        evaluator_professional_id: professional.id,
        crefito_number: values.crefito_number,
        clinical_content: values.clinical_content?.trim() || null,
        suggested_weekly_frequency: normalizeWeeklyFrequency(patient?.suggested_weekly_frequency),
        proposed_weekly_frequency: values.proposed_weekly_frequency,
        proposed_session_count: values.proposed_session_count,
        suggested_patient_level: values.suggested_patient_level,
        proposed_patient_level: values.suggested_patient_level,
        level_confirmed: values.level_confirmed,
        patient_level_change_reason: !values.level_confirmed ? values.patient_level_change_reason?.trim() || null : null,
        primary_diagnosis: values.primary_diagnosis,
        functionality: values.functionality,
        mobility: values.functionality,
        prior_conditions: values.prior_conditions,
        surgeries: values.surgeries.filter((s) => s.name.trim().length > 0),
        comorbidities: null,
        status: 'avaliacao_feita',
      } as Record<string, unknown>)
    },
    queryKey: ['pp'],
    successMessage: 'Avaliação registrada com sucesso',
    onSuccess: (record) => {
      setAssessmentOpen(false)
      form.reset()
      navigate(`/profissional/avaliacoes/${record.id}`)
    },
  })

  const openAssessmentDrawer = () => {
    if (!patient) return
    setAssessmentOpen(true)
    form.reset(
      buildAssessmentProposalDefaults({
        patientLevel: patient.patient_level,
        suggestedWeeklyFrequency: patient.suggested_weekly_frequency,
        diagnosticHypothesis: patient.diagnostic_hypothesis,
        defaultCrefito,
      }),
    )
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
  const latestAssessment = patient.initial_assessments?.[0] ?? null
  const hypothesis = resolveDiagnosticHypothesis(patient.diagnostic_hypothesis, patient.clinical_summary)

  return (
    <>
      <PageHeader>
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0 rounded-xl" aria-label="Voltar">
            <ArrowLeft size={20} />
          </Button>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-xl lg:text-2xl truncate">{patient.full_name}</h1>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <Badge variant="secondary">{careStatusLabels[patient.care_status] ?? patient.care_status}</Badge>
              {patient.evaluation_pending && (
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  Avaliação pendente
                </Badge>
              )}
            </div>
          </div>
        </div>
      </PageHeader>

      <CrudScrollPageLayout>
        <CascadeReveal className="space-y-5 pb-8">
          {patient.evaluation_pending && (
            <CascadeItem>
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/20 px-5 py-4">
                <p className="font-medium text-amber-900 dark:text-amber-200">Avaliação inicial pendente</p>
                <p className="text-sm text-amber-800/90 dark:text-amber-300/90 mt-1">
                  Realize a visita domiciliar e registre a avaliação clínica para que a gestão envie a proposta à
                  família.
                </p>
                <Button size="sm" className="mt-3" onClick={openAssessmentDrawer}>
                  Realizar avaliação
                </Button>
              </div>
            </CascadeItem>
          )}

          <CascadeItem>
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-semibold text-sm">Resumo clínico</h3>
              </div>
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
                  <p className="font-medium">{patientLevelLabels[patient.patient_level ?? ''] ?? patient.patient_level ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Período</p>
                  <p className="font-medium">{formatAttendancePeriod(patient.attendance_period)}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Hipótese diagnóstica</p>
                  <p className="font-medium">{hypothesis}</p>
                </div>
                {patient.clinical_summary && (
                  <div className="sm:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Resumo clínico</p>
                    <p className="text-muted-foreground whitespace-pre-wrap">{patient.clinical_summary}</p>
                  </div>
                )}
              </div>
            </div>
          </CascadeItem>

          {primaryAddress && (
            <CascadeItem>
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                  <MapPin size={16} className="text-muted-foreground" />
                  <h3 className="font-semibold text-sm">Endereço de atendimento</h3>
                </div>
                <div className="p-5 text-sm">
                  <p className="font-medium">{primaryAddress.full_address}</p>
                  {primaryAddress.neighborhood && (
                    <p className="text-muted-foreground mt-1">{primaryAddress.neighborhood}</p>
                  )}
                </div>
              </div>
            </CascadeItem>
          )}

          {latestAssessment && (
            <CascadeItem>
              <div className="rounded-xl border border-border bg-card shadow-sm px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-medium text-sm">Avaliação registrada</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Status: {assessmentStatusLabels[latestAssessment.status] ?? latestAssessment.status}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate(`/profissional/avaliacoes/${latestAssessment.id}`)}>
                  Ver rastreio
                </Button>
              </div>
            </CascadeItem>
          )}
        </CascadeReveal>
      </CrudScrollPageLayout>

      <CrudDrawer
        open={assessmentOpen}
        onOpenChange={setAssessmentOpen}
        title="Realizar avaliação"
        size="lg"
        footer={
          <FormActions
            form={ASSESSMENT_FORM_ID}
            onCancel={() => setAssessmentOpen(false)}
            isSubmitting={createAssessment.isPending}
            submitLabel="Salvar avaliação"
          />
        }
      >
        <Form {...form}>
          <form
            id={ASSESSMENT_FORM_ID}
            onSubmit={form.handleSubmit((values) => createAssessment.mutate(values))}
            className="space-y-4"
          >
            <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
              <p className="font-medium">Sugestão do sistema</p>
              <p className="text-muted-foreground mt-0.5">
                Nível {patientLevelLabels[suggestedLevel] ?? suggestedLevel}
                {patient.suggested_weekly_frequency != null && (
                  <> · frequência cadastro {normalizeWeeklyFrequency(patient.suggested_weekly_frequency)}x/semana</>
                )}
              </p>
            </div>

            <AssessmentProposalFields
              control={form.control}
              suggestedLevelLabel={patientLevelLabels[suggestedLevel] ?? suggestedLevel}
              showLevelChangeReason={showLevelChangeReason}
            />
          </form>
        </Form>
      </CrudDrawer>
    </>
  )
}
