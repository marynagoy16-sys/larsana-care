import { useNavigate } from 'react-router-dom'
import { PPAccountSubpageHeader } from '@/components/profissional/account/PPAccountSubpageHeader'
import { EntityListPage } from '@/components/crud/EntityListPage'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import {
  listPendingEvolutionsForPp,
  pendingEvolutionDeadlineLabel,
  ppEvolutionsQueryKeys,
  type PendingEvolutionRow,
} from '@/services/ppEvolutions'

function asPendingRow(row: Record<string, unknown> & { id: string }) {
  return row as unknown as PendingEvolutionRow
}

export function PPEvolucoesPage() {
  const navigate = useNavigate()

  return (
    <>
      <PPAccountSubpageHeader title="Evoluções pendentes" />
      <EntityListPage
      title="Evoluções pendentes"
      showStats={false}
      showPagination={false}
      mobileVariant="compact"
      queryKey={ppEvolutionsQueryKeys.pending}
      queryFn={listPendingEvolutionsForPp}
      searchPlaceholder="Pesquisar por paciente ou terapia..."
      emptyMessage="Nenhuma evolução pendente. Todas as terapias realizadas já foram registradas."
      getMobileAvatarLabel={(row) => asPendingRow(row).care_cycles?.patients?.full_name ?? 'Paciente'}
      getSearchText={(row) => {
        const pending = asPendingRow(row)
        const patientName = pending.care_cycles?.patients?.full_name ?? ''
        const cycle = pending.care_cycles?.cycle_number
        return [
          patientName,
          cycle != null ? `ciclo ${cycle}` : '',
          `terapia ${pending.session_number}`,
        ]
          .filter(Boolean)
          .join(' ')
      }}
      onRowClick={(row) => navigate(`/profissional/evolucao/nova?session=${row.id}`)}
      columns={[
        {
          key: 'patient',
          header: 'Paciente',
          mobilePrimary: true,
          cell: (row) => (
            <span className="font-medium">
              {asPendingRow(row).care_cycles?.patients?.full_name ?? '—'}
            </span>
          ),
        },
        {
          key: 'therapy',
          header: 'Terapia',
          mobileSubtitle: true,
          cell: (row) => {
            const pending = asPendingRow(row)
            const cycle = pending.care_cycles?.cycle_number
            const ref = pending.check_out_at ?? pending.scheduled_at
            const therapyLabel =
              cycle != null
                ? `Ciclo ${cycle} · Terapia #${pending.session_number}`
                : `Terapia #${pending.session_number}`
            return ref ? `${therapyLabel} · ${formatDateTime(ref)}` : therapyLabel
          },
        },
        {
          key: 'date',
          header: 'Realizada em',
          mobileHidden: true,
          cell: (row) => {
            const pending = asPendingRow(row)
            const ref = pending.check_out_at ?? pending.scheduled_at
            return ref ? formatDateTime(ref) : '—'
          },
        },
        {
          key: 'deadline',
          header: 'Prazo',
          mobileBadge: true,
          cell: (row) => {
            const pending = asPendingRow(row)
            const deadline = pendingEvolutionDeadlineLabel(pending)
            const overdue = deadline.startsWith('Atrasada')

            return (
              <Badge
                variant="outline"
                className={cn(
                  'border-0 text-[11px]',
                  overdue
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
                )}
              >
                {deadline}
              </Badge>
            )
          },
        },
      ]}
      />
    </>
  )
}
