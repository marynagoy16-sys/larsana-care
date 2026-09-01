import { Calendar, CreditCard, Heart, Pill } from 'lucide-react'
import { MetricCardRow } from '@/components/dashboard/MetricCardRow'
import { formatDate, formatDateTime } from '@/lib/formatters'
import type { PatientHomeContext } from '@/services/patientPortal'

interface PatientHomeKpiRowProps {
  context: PatientHomeContext
  isLoading?: boolean
}

export function PatientHomeKpiRow({ context, isLoading }: PatientHomeKpiRowProps) {
  const { activeCycle, pendingCharge, pendingProposal } = context

  const sessionsValue = activeCycle
    ? `${activeCycle.completedSessions}/${activeCycle.session_count}`
    : '—'

  const nextSessionAt = activeCycle?.nextSessionAt ?? null
  const nextSessionValue = nextSessionAt ? formatDate(nextSessionAt) : '—'
  const nextSessionFooter = nextSessionAt ? formatDateTime(nextSessionAt) : undefined

  const paymentValue = pendingCharge ? 'Pendente' : pendingProposal ? 'Proposta' : 'Em dia'
  const paymentHref = pendingCharge
    ? `/paciente/pagamentos/${pendingCharge.id}`
    : pendingProposal
      ? '/paciente/proposta'
      : '/paciente/pagamentos'

  return (
    <MetricCardRow
      isLoading={isLoading}
      columns={4}
      cards={[
        {
          label: 'Sessões do ciclo',
          value: sessionsValue,
          icon: Heart,
          href: '/paciente/tratamento',
        },
        {
          label: 'Próxima terapia',
          value: nextSessionValue,
          icon: Calendar,
          href: '/paciente/tratamento',
          footer: nextSessionFooter,
        },
        {
          label: 'Pagamentos',
          value: paymentValue,
          icon: CreditCard,
          href: paymentHref,
        },
        {
          label: 'LarsanaPill',
          value: activeCycle ? 'Ativo' : '—',
          icon: Pill,
          href: '/paciente/larsanapill',
        },
      ]}
    />
  )
}
