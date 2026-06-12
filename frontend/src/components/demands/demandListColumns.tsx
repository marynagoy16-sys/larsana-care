import type { DataTableColumn } from '@/components/crud/DataTable'
import { assessmentStatusLabels } from '@/constants/labels'
import type { DemandListItem } from '@/services/demands'
import { cn } from '@/lib/utils'

function AssessmentTag({ status }: { status: string | null }) {
  if (!status) {
    return <span className="text-muted-foreground">—</span>
  }

  const label = assessmentStatusLabels[status] ?? status
  const isPending = status === 'proposta_enviada' || status === 'em_analise'
  const isPositive = status === 'respondida_sim'
  const isNegative = status === 'respondida_nao' || status === 'vencida'

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
        isPositive && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        isNegative && 'bg-destructive/10 text-destructive',
        isPending && 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
        !isPositive && !isNegative && !isPending && 'bg-muted text-muted-foreground',
      )}
    >
      {label}
    </span>
  )
}

export const demandListColumns: DataTableColumn<DemandListItem>[] = [
  {
    key: 'patient_abbreviation',
    header: 'Paciente',
    mobilePrimary: true,
    cell: (r) => <span className="font-medium">{r.patient_abbreviation}</span>,
  },
  {
    key: 'patient_sex',
    header: 'Sexo',
    cell: (r) => r.patient_sex,
  },
  {
    key: 'patient_age',
    header: 'Idade',
    cell: (r) => r.patient_age,
  },
  {
    key: 'diagnostic_hypothesis',
    header: 'Hipótese diagnóstica',
    cell: (r) => (
      <span className="line-clamp-2 max-w-[220px]" title={r.diagnostic_hypothesis}>
        {r.diagnostic_hypothesis}
      </span>
    ),
  },
  {
    key: 'assessment_status',
    header: 'Tag avaliação',
    mobileBadge: true,
    cell: (r) => <AssessmentTag status={r.assessment_status} />,
  },
  {
    key: 'attendance_period',
    header: 'Período de atendimento',
    cell: (r) => (
      <span className="line-clamp-2 max-w-[180px]" title={r.attendance_period}>
        {r.attendance_period}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    cell: (r) => String(r.status),
  },
  {
    key: 'prof',
    header: 'Profissão',
    cell: (r) => String(r.required_profession),
  },
]
