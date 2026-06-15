import { patientLevelLabels, weeklyFrequencyLabels, proposedSessionCountLabels } from '@/constants/labels'

export type AssessmentProposalSummaryData = {
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
  crefito_number?: string
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium whitespace-pre-wrap">{value}</p>
    </div>
  )
}

export function AssessmentProposalSummary({ data }: { data: AssessmentProposalSummaryData }) {
  const levelChanged = data.proposed_patient_level !== data.suggested_patient_level

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <SummaryRow
        label="Frequência semanal"
        value={weeklyFrequencyLabels[data.proposed_weekly_frequency] ?? `${data.proposed_weekly_frequency}x/semana`}
      />
      <SummaryRow
        label="Ciclo proposto"
        value={proposedSessionCountLabels[data.proposed_session_count as 4 | 8 | 12] ?? `${data.proposed_session_count} sessões`}
      />
      <SummaryRow
        label="Nível sugerido"
        value={patientLevelLabels[data.suggested_patient_level] ?? data.suggested_patient_level}
      />
      <SummaryRow
        label="Nível proposto"
        value={patientLevelLabels[data.proposed_patient_level] ?? data.proposed_patient_level}
      />
      {levelChanged && data.patient_level_change_reason && (
        <div className="md:col-span-2">
          <SummaryRow label="Justificativa da alteração de nível" value={data.patient_level_change_reason} />
        </div>
      )}
      <SummaryRow label="Diagnóstico principal" value={data.primary_diagnosis} />
      {data.comorbidities && <SummaryRow label="Comorbidades" value={data.comorbidities} />}
      <SummaryRow label="Mobilidade" value={data.mobility} />
      {data.clinical_content ? (
        <SummaryRow label="Laudo complementar" value={data.clinical_content} />
      ) : null}
    </div>
  )
}
