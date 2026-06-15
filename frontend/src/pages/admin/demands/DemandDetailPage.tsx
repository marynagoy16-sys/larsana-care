import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { DetailPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import {
  AvaliacaoSections,
  buildDemandBriefProps,
  ContinuidadeSections,
  DemandBriefCard,
  DemandDetailInfoCard,
  DemandDetailPageHeader,
  resolveRegionLabel,
  useDemandPricingContext,
} from '@/components/demands/DemandDetailContent'
import { demandsService } from '@/services/demands'
import {
  formatAttendancePeriod,
  formatPatientAge,
  formatPatientSex,
  resolveDiagnosticHypothesis,
} from '@/lib/patientDisplay'
import { formatDateTime } from '@/lib/formatters'
import {
  careStatusLabels,
  demandStatusLabels,
  demandTypeLabels,
  patientLevelLabels,
  ppClassLabels,
  professionTypeLabels,
} from '@/constants/labels'

export function DemandDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const goBack = () => navigate('/admin/demandas')

  const { data: demand, isLoading, isFetching } = useQuery({
    queryKey: ['demand_detail', id],
    queryFn: () => demandsService.getDetail(id!),
    enabled: !!id,
    placeholderData: (prev) => prev,
  })

  const ppClass = demand?.professionals?.pp_class ?? null
  const { data: pricingContext, isLoading: pricingLoading } = useDemandPricingContext(demand, ppClass)

  if (isLoading) {
    return (
      <>
        <PageHeader loading>
          <DemandDetailPageHeader onBack={goBack} loading />
        </PageHeader>
        <CrudScrollPageLayout>
          <DetailPageSkeleton fields={8} />
        </CrudScrollPageLayout>
      </>
    )
  }

  if (!demand) {
    return (
      <>
        <PageHeader>
          <DemandDetailPageHeader onBack={goBack} />
        </PageHeader>
        <CrudScrollPageLayout>
          <p className="text-muted-foreground p-6">Demanda não encontrada.</p>
        </CrudScrollPageLayout>
      </>
    )
  }

  const patient = demand.patients
  const isAvaliacao = demand.demand_type === 'avaliacao'
  const simulation = isAvaliacao ? pricingContext?.avaliacao : pricingContext?.continuidade
  const briefProps = buildDemandBriefProps(demand, simulation?.rules.cycle2RepassePerSessionCents ?? null)
  const attendancePeriod = formatAttendancePeriod(patient?.attendance_period)

  return (
    <>
      <PageHeader>
        <DemandDetailPageHeader demand={demand} onBack={goBack} isFetching={isFetching} />
      </PageHeader>

      <CrudScrollPageLayout>
        <CascadeReveal className="space-y-5 pb-8">
          <CascadeItem>
            <DemandBriefCard demand={demand} {...briefProps} loading={pricingLoading} />
          </CascadeItem>

          {isAvaliacao ? (
            <AvaliacaoSections simulation={pricingContext?.avaliacao ?? null} loading={pricingLoading} />
          ) : (
            <ContinuidadeSections simulation={pricingContext?.continuidade ?? null} loading={pricingLoading} />
          )}

          <CascadeItem>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DemandDetailInfoCard
                title="Paciente"
                icon={User}
                rows={[
                  { label: 'Nome', value: patient?.full_name ?? '—' },
                  { label: 'Sexo', value: formatPatientSex(patient?.sex) },
                  { label: 'Idade', value: formatPatientAge(patient?.birth_date) },
                  {
                    label: 'Nível',
                    value: patient?.patient_level
                      ? patientLevelLabels[patient.patient_level] ?? patient.patient_level
                      : '—',
                  },
                  {
                    label: 'Status clínico',
                    value: patient?.care_status
                      ? careStatusLabels[patient.care_status] ?? patient.care_status
                      : '—',
                  },
                  {
                    label: 'Hipótese diagnóstica',
                    value: resolveDiagnosticHypothesis(
                      patient?.diagnostic_hypothesis,
                      patient?.clinical_summary,
                    ),
                  },
                  { label: 'Período de atendimento', value: attendancePeriod },
                  {
                    label: 'Frequência sugerida',
                    value: patient?.suggested_weekly_frequency
                      ? `${patient.suggested_weekly_frequency}x por semana`
                      : '—',
                  },
                  { label: 'Cidade', value: patient?.cities?.name ?? '—' },
                  { label: 'Região', value: resolveRegionLabel(demand) },
                  { label: 'Endereço completo', value: briefProps.location },
                  { label: 'Resumo clínico', value: patient?.clinical_summary?.trim() || '—' },
                ]}
              />

              <DemandDetailInfoCard
                title="Demanda"
                icon={MapPin}
                rows={[
                  { label: 'Tipo', value: demandTypeLabels[demand.demand_type] ?? demand.demand_type },
                  { label: 'Status', value: demandStatusLabels[demand.status] ?? demand.status },
                  {
                    label: 'Profissão requerida',
                    value: professionTypeLabels[demand.required_profession] ?? demand.required_profession,
                  },
                  { label: 'Profissional alocado', value: demand.professionals?.full_name ?? '—' },
                  {
                    label: 'Classe do PP',
                    value: demand.professionals?.pp_class
                      ? ppClassLabels[demand.professionals.pp_class] ?? demand.professionals.pp_class
                      : '—',
                  },
                  { label: 'Região da demanda', value: resolveRegionLabel(demand) },
                  { label: 'Abertura', value: formatDateTime(demand.created_at) },
                  { label: 'Atualização', value: formatDateTime(demand.updated_at) },
                  { label: 'Observações', value: demand.notes?.trim() || '—' },
                ]}
              />
            </div>
          </CascadeItem>

          {(demand.demand_responses?.length ?? 0) > 0 && (
            <CascadeItem>
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <h3 className="font-semibold text-sm">Respostas de profissionais</h3>
                </div>
                <div className="divide-y divide-border">
                  {demand.demand_responses?.map((response) => (
                    <div
                      key={response.id}
                      className="px-5 py-3 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                    >
                      <div>
                        <p className="font-medium">{response.professionals?.full_name ?? 'Profissional'}</p>
                        <p className="text-muted-foreground text-xs">{formatDateTime(response.responded_at)}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={response.response === 'accepted' ? 'default' : 'secondary'}>
                          {response.response === 'accepted' ? 'Aceita' : 'Recusada'}
                        </Badge>
                        {response.decline_reason && (
                          <p className="text-xs text-muted-foreground mt-1 max-w-sm">{response.decline_reason}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CascadeItem>
          )}
        </CascadeReveal>
      </CrudScrollPageLayout>
    </>
  )
}
