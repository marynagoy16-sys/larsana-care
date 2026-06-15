import type { DataTableColumn } from '@/components/crud/DataTable'
import { demandTypeDescriptions, demandTypeLabels, demandStatusLabels } from '@/constants/labels'
import type { DemandListItem } from '@/services/demands'
import { cn } from '@/lib/utils'

function DemandTypeBadge({ type }: { type: string }) {
  const label = demandTypeLabels[type] ?? type
  const description = demandTypeDescriptions[type]
  const isContinuidade = type === 'continuidade'

  return (
    <span
      title={description}
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
        isContinuidade
          ? 'bg-primary/10 text-primary'
          : 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
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
    key: 'demand_type',
    header: 'Tipo',
    mobileBadge: true,
    cell: (r) => <DemandTypeBadge type={String(r.demand_type)} />,
  },
  {
    key: 'attendance_period',
    header: 'Período',
    cell: (r) => (
      <span className="line-clamp-2 max-w-[180px]" title={r.attendance_period}>
        {r.attendance_period}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    cell: (r) => demandStatusLabels[String(r.status)] ?? String(r.status),
  },
  {
    key: 'prof',
    header: 'Profissão',
    cell: (r) => String(r.required_profession),
  },
]
