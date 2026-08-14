import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { DetailPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { FormActions } from '@/components/crud/FormActions'
import { Form } from '@/components/ui/form'
import { AssessmentProposalFields } from '@/components/assessments/AssessmentProposalFields'
import { patientLevelLabels } from '@/constants/labels'
import { useSuppressBottomNav } from '@/contexts/PageFooterContext'
import { useSidebarCollapsed } from '@/hooks/useSidebarCollapsed'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import { cn } from '@/lib/utils'
import { getPPPatientDetail, getPPProfessionalCrefito } from '@/services/ppPatients'
import { getCurrentProfessional } from '@/services/professionals'
import { initialAssessmentsService } from '@/services/index'
import {
  assessmentProposalSchema,
  buildAssessmentProposalDefaults,
  normalizeWeeklyFrequency,
  type AssessmentProposalFormValues,
} from '@/schemas/assessmentProposal'

const ASSESSMENT_FORM_ID = 'pp-assessment-form'

export function PPPacienteAssessmentPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const sidebarCollapsed = useSidebarCollapsed()
  const goBack = () => navigate(`/profissional/pacientes/${id}`)

  useSuppressBottomNav(true)

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

  useEffect(() => {
    if (!patient) return
    form.reset(
      buildAssessmentProposalDefaults({
        patientLevel: patient.patient_level,
        suggestedWeeklyFrequency: patient.suggested_weekly_frequency,
        diagnosticHypothesis: patient.diagnostic_hypothesis,
        defaultCrefito,
      }),
    )
  }, [patient, defaultCrefito, form])

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
    onSuccess: () => {
      navigate(`/profissional/pacientes/${id}`)
    },
  })

  if (isLoading) {
    return (
      <>
        <PageHeader loading>
          <span className="font-display font-bold text-xl">Realizar avaliação</span>
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
          <Button variant="ghost" size="icon" onClick={() => navigate('/profissional/pacientes')} aria-label="Voltar">
            <ArrowLeft size={20} />
          </Button>
        </PageHeader>
        <CrudScrollPageLayout>
          <p className="p-6 text-muted-foreground">Paciente não encontrado ou não alocado a você.</p>
        </CrudScrollPageLayout>
      </>
    )
  }

  return (
    <>
      <PageHeader>
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0 rounded-xl" aria-label="Voltar">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="truncate font-display text-xl font-bold">Realizar avaliação</h1>
        </div>
      </PageHeader>

      <CrudScrollPageLayout>
        <Form {...form}>
          <form
            id={ASSESSMENT_FORM_ID}
            onSubmit={form.handleSubmit((values) => createAssessment.mutate(values))}
            className="space-y-4 pb-28 sm:pb-32"
          >
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm dark:border-amber-900/40 dark:bg-amber-950/20">
              <p className="font-medium text-amber-900 dark:text-amber-200">Sugestão do sistema</p>
              <p className="mt-0.5 text-amber-800/90 dark:text-amber-100/80">
                {patientLevelLabels[suggestedLevel] ?? suggestedLevel}
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
      </CrudScrollPageLayout>

      <div
        className={cn(
          'fixed bottom-0 right-0 z-50 border-t border-border bg-background/95 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur supports-[backdrop-filter]:bg-background/90',
          'left-0 lg:transition-[left] lg:duration-300 lg:ease-in-out',
          sidebarCollapsed ? 'lg:left-[var(--sidebar-width-collapsed)]' : 'lg:left-[var(--sidebar-width)]',
        )}
      >
        <div className="shell-content-x py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <FormActions
            form={ASSESSMENT_FORM_ID}
            onCancel={goBack}
            isSubmitting={createAssessment.isPending}
            submitLabel="Salvar avaliação"
          />
        </div>
      </div>
    </>
  )
}
