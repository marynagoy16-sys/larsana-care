import { Link } from 'react-router-dom'
import { CreditCard, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatAssessmentProposalSummary, formatFamilyDeadline } from '@/lib/assessmentListDisplay'
import { formatCurrency, formatDate } from '@/lib/formatters'
import type { PatientHomeContext } from '@/services/patientPortal'

type PatientHomeBannerProps = {
  context: PatientHomeContext
}

export function PatientHomeBanner({ context }: PatientHomeBannerProps) {
  const { pendingProposal, pendingCharge } = context

  if (pendingProposal) {
    const summary = formatAssessmentProposalSummary(pendingProposal)
    const deadline = formatFamilyDeadline(pendingProposal)

    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/90 dark:border-amber-900/50 dark:bg-amber-950/30 p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
            <Send size={20} className="text-amber-700 dark:text-amber-400" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="font-semibold text-amber-950 dark:text-amber-100">
                Proposta de tratamento disponível
              </p>
              <p className="text-sm text-amber-900/85 dark:text-amber-200/90 mt-1">
                {summary}
                {deadline !== '—' && deadline !== 'Após envio' && (
                  <> · Prazo: <span className="font-medium">{deadline}</span></>
                )}
              </p>
            </div>
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to="/paciente/proposta">Ver proposta e responder</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const cycleNeedsPayment = pendingCharge != null

  if (cycleNeedsPayment && pendingCharge) {
    return (
      <div className="rounded-xl border border-primary/25 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <CreditCard size={20} className="text-primary" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="font-semibold">Pagamento pendente</p>
              <p className="text-sm text-muted-foreground mt-1">
                Valor {formatCurrency(pendingCharge.amount_cents)}
                {pendingCharge.due_date && (
                  <> · Vencimento {formatDate(pendingCharge.due_date)}</>
                )}
              </p>
            </div>
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to={`/paciente/pagamentos/${pendingCharge.id}`}>Pagar agora</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
