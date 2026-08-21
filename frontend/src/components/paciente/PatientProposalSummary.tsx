import { patientLevelLabels, proposedSessionCountLabels, weeklyFrequencyLabels } from '@/constants/labels'
import { formatAssessmentProposalSummary, formatFamilyDeadline } from '@/lib/assessmentListDisplay'
import { formatCurrency } from '@/lib/formatters'
import type { PatientProposalPreview } from '@/services/assessmentFamilyResponse'

type PatientProposalSummaryProps = {
  preview: PatientProposalPreview
  selectedOption?: import('@/services/assessmentFamilyResponse').ProposalOption | null
}

export function PatientProposalSummary({ preview, selectedOption }: PatientProposalSummaryProps) {
  const deadline = formatFamilyDeadline({
    status: preview.status,
    proposal_sent_at: preview.proposal_sent_at,
    response_deadline_at: preview.response_deadline_at,
  })

  const compactSummary = formatAssessmentProposalSummary({
    status: preview.status,
    proposed_session_count: preview.proposed_session_count,
    proposed_patient_level: preview.proposed_patient_level,
    proposed_weekly_frequency: preview.proposed_weekly_frequency,
  })

  return (
    <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="font-semibold text-sm">Resumo da proposta</h2>
        {deadline !== '—' && deadline !== 'Após envio' && (
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 font-medium">
            Prazo para responder: {deadline}
          </p>
        )}
      </div>
      <div className="p-5 space-y-4 text-sm">
        {preview.professional_name && (
          <div>
            <p className="text-xs text-muted-foreground">Profissional</p>
            <p className="font-medium">{preview.professional_name}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground">Recomendação do fisioterapeuta</p>
          <p className="font-medium">
            {weeklyFrequencyLabels[preview.proposed_weekly_frequency]
              ?? `${preview.proposed_weekly_frequency}x por semana`}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Ciclo proposto</p>
          <p className="font-medium">{compactSummary}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {proposedSessionCountLabels[preview.proposed_session_count as 4 | 8 | 12]
              ?? `${preview.proposed_session_count} sessões`}
            {' · '}
            {patientLevelLabels[preview.proposed_patient_level] ?? preview.proposed_patient_level}
          </p>
        </div>
        {selectedOption ? (
          <div className="rounded-lg bg-muted/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">Valor do ciclo escolhido</p>
            <p className="font-display text-xl font-bold">
              {formatCurrency(selectedOption.total_amount_cents)}
            </p>
            {selectedOption.assessment_credit_cents > 0 ? (
              <p className="text-xs text-primary mt-0.5">
                Inclui desconto de {formatCurrency(selectedOption.assessment_credit_cents)} da avaliação paga
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground mt-0.5">Pagamento antecipado via PIX ou boleto</p>
          </div>
        ) : null}
      </div>
    </section>
  )
}
