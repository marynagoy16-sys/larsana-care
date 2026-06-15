import {
  patientLevelLabels,
  ppClassLabels,
  proposedSessionCountLabels,
  weeklyFrequencyLabels,
} from '@/constants/labels'
import { formatCurrency } from '@/lib/formatters'
import { AssessmentTrackingTimeline, type AssessmentTrackingData } from '@/components/assessments/AssessmentTrackingTimeline'

export type AssessmentDetailViewData = {
  status: string
  crefito_number: string
  created_at: string
  proposal_sent_at?: string | null
  response_deadline_at?: string | null
  suggested_weekly_frequency?: number | null
  proposed_weekly_frequency: number
  proposed_session_count: number
  suggested_patient_level: string
  proposed_patient_level: string
  patient_level_change_reason?: string | null
  primary_diagnosis: string
  comorbidities?: string | null
  mobility: string
  clinical_content?: string | null
  patient?: {
    full_name?: string
    regions?: { code: string; name: string } | null
    cities?: { name: string } | null
    patient_responsibles?: Array<{ full_name: string; is_primary: boolean }> | null
  } | null
  evaluator?: {
    full_name: string
    pp_class: string | null
  } | null
}

type AssessmentDetailViewProps = {
  data: AssessmentDetailViewData
  totalAmountCents?: number | null
}


function ClinicalTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4 h-full min-h-[5.5rem] flex flex-col">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-1.5 whitespace-pre-wrap leading-snug">{value}</p>
    </div>
  )
}

function PlanRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 border-b border-border/60 last:border-0 text-sm sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium sm:text-right whitespace-pre-wrap">{value}</span>
    </div>
  )
}

function resolvePrimaryResponsible(
  responsibles?: Array<{ full_name: string; is_primary: boolean }> | null,
): string {
  if (!responsibles?.length) return '—'
  const primary = responsibles.find((r) => r.is_primary) ?? responsibles[0]
  return primary.full_name
}

function formatRegionLabel(data: AssessmentDetailViewData): string {
  const region = data.patient?.regions
  const city = data.patient?.cities?.name
  if (region?.code && city) return `Região ${region.code} · ${city}`
  if (region?.code) return `Região ${region.code}${region.name ? ` · ${region.name}` : ''}`
  if (city) return city
  return '—'
}

function formatProfessionalLabel(evaluator: AssessmentDetailViewData['evaluator']): string {
  if (!evaluator?.full_name) return '—'
  const ppClass = evaluator.pp_class ? ppClassLabels[evaluator.pp_class] ?? evaluator.pp_class : null
  return ppClass ? `${evaluator.full_name} · ${ppClass}` : evaluator.full_name
}

export function AssessmentDetailView({ data, totalAmountCents }: AssessmentDetailViewProps) {
  const levelChanged = data.proposed_patient_level !== data.suggested_patient_level
  const unitPriceCents =
    totalAmountCents != null && data.proposed_session_count > 0
      ? Math.round(totalAmountCents / data.proposed_session_count)
      : null

  const levelLabel = patientLevelLabels[data.proposed_patient_level] ?? data.proposed_patient_level
  const cycleLabel =
    proposedSessionCountLabels[data.proposed_session_count as 4 | 8 | 12]
    ?? `${data.proposed_session_count} sessões`
  const freqLabel =
    weeklyFrequencyLabels[data.proposed_weekly_frequency]
    ?? `${data.proposed_weekly_frequency}x/semana`
  const suggestedFreq = data.suggested_weekly_frequency
  const freqDetail =
    suggestedFreq != null && suggestedFreq !== data.proposed_weekly_frequency
      ? `${freqLabel} (cadastro sugeria ${Math.round(suggestedFreq)}x)`
      : `${freqLabel} (sugerida)`

  const trackingData: AssessmentTrackingData = {
    status: data.status,
    createdAt: data.created_at,
    proposalSentAt: data.proposal_sent_at,
    responseDeadlineAt: data.response_deadline_at,
    proposedSessionCount: data.proposed_session_count,
    proposedPatientLevel: data.proposed_patient_level,
    totalAmountCents,
  }

  const regionLabel = formatRegionLabel(data)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-stretch">
        <section className="flex h-full flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="shrink-0 min-h-[5.25rem] px-5 py-4 border-b border-border flex flex-col justify-center">
            <h3 className="font-semibold text-sm">Rastreio da proposta</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Acompanhe até a família responder SIM ou NÃO à proposta de tratamento.
            </p>
          </div>
          <div className="flex flex-1 flex-col p-5">
            <AssessmentTrackingTimeline data={trackingData} />
          </div>
        </section>

        <section className="flex h-full flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="shrink-0 min-h-[5.25rem] px-5 py-4 border-b border-border flex flex-col justify-center">
            <h3 className="font-semibold text-sm">Dados clínicos</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Diagnóstico, comorbidades e mobilidade registrados na avaliação.
            </p>
          </div>
          <div className="flex flex-1 flex-col p-5">
            <div className="grid h-full grid-cols-1 sm:grid-cols-2 gap-3 auto-rows-fr flex-1">
              <ClinicalTile label="Diagnóstico principal" value={data.primary_diagnosis} />
              <ClinicalTile label="Comorbidades" value={data.comorbidities?.trim() || '—'} />
              <ClinicalTile label="Mobilidade" value={data.mobility} />
              <ClinicalTile
                label="Responsável legal"
                value={resolvePrimaryResponsible(data.patient?.patient_responsibles)}
              />
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-sm">Plano terapêutico</h3>
          <p className="text-xs text-muted-foreground mt-0.5">CREFITO {data.crefito_number}</p>
        </div>
        <div className="px-5 pb-2">
          <PlanRow label="Região" value={regionLabel} />
          <PlanRow
            label="Nível"
            value={
              unitPriceCents != null
                ? `${levelLabel} · ${formatCurrency(unitPriceCents)}/sessão`
                : levelLabel
            }
          />
          <PlanRow
            label="Ciclo proposto"
            value={
              totalAmountCents != null
                ? `${cycleLabel} · ${formatCurrency(totalAmountCents)}`
                : cycleLabel
            }
          />
          <PlanRow label="Frequência" value={freqDetail} />
          <PlanRow label="Profissional" value={formatProfessionalLabel(data.evaluator)} />
          {levelChanged && data.patient_level_change_reason && (
            <PlanRow
              label="Alteração de nível"
              value={`${patientLevelLabels[data.suggested_patient_level]} → ${levelLabel} — ${data.patient_level_change_reason}`}
            />
          )}
          {data.clinical_content?.trim() && (
            <PlanRow label="Laudo complementar" value={data.clinical_content.trim()} />
          )}
        </div>
      </section>
    </div>
  )
}
