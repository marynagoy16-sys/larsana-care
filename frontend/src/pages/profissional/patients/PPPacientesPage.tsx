import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EntityListPage } from '@/components/crud/EntityListPage'
import { Toggle } from '@/components/ui/toggle'
import { careStatusLabels } from '@/constants/labels'
import { PPPatientSituationBadge } from '@/components/profissional/patients/PPPatientSituationBadge'
import { matchesPPPatientSituationFilter } from '@/lib/ppPatientSituation'
import { cn } from '@/lib/utils'
import { listPPPatients, type PPPatientListItem } from '@/services/ppPatients'

type PatientSituationFilter = 'all' | 'evaluation' | 'proposal' | 'evolution' | 'active'

const SITUATION_FILTERS: { id: PatientSituationFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'evaluation', label: 'Avaliação pendente' },
  { id: 'proposal', label: 'Em análise' },
  { id: 'evolution', label: 'Evolução pendente' },
  { id: 'active', label: 'Em tratamento' },
]

export function PPPacientesPage() {
  const navigate = useNavigate()
  const [situationFilter, setSituationFilter] = useState<PatientSituationFilter>('all')

  const rowFilter = useMemo(
    () => (row: PPPatientListItem) => matchesPPPatientSituationFilter(row.situation, situationFilter),
    [situationFilter],
  )

  return (
    <EntityListPage
      title="Meus pacientes"
      showStats={false}
      searchable={false}
      mobileVariant="compact"
      getMobileAvatarLabel={(r) => r.full_name}
      queryKey={['pp', 'patients']}
      queryFn={() => listPPPatients()}
      onRowClick={(r) => navigate(`/profissional/pacientes/${r.id}`)}
      rowFilter={rowFilter}
      filterResetKey={situationFilter}
      toolbar={
        <div
          className={cn(
            'overflow-x-auto overscroll-x-contain py-2.5 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            'max-lg:-mx-[var(--shell-gap)] max-lg:w-[calc(100%+2*var(--shell-gap))]',
          )}
        >
          <div className="flex w-max flex-nowrap gap-2">
            {SITUATION_FILTERS.map((filter, index) => (
              <Toggle
                key={filter.id}
                variant="outline"
                pressed={situationFilter === filter.id}
                onPressedChange={(pressed) => {
                  if (pressed) setSituationFilter(filter.id)
                }}
                className={cn(
                  'h-11 shrink-0 rounded-full px-5 text-sm whitespace-nowrap data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
                  index === 0 && 'max-lg:ml-[var(--shell-gap)]',
                  index === SITUATION_FILTERS.length - 1 && 'max-lg:mr-[var(--shell-gap)]',
                )}
              >
                {filter.label}
              </Toggle>
            ))}
          </div>
        </div>
      }
      columns={[
        {
          key: 'name',
          header: 'Nome',
          mobilePrimary: true,
          cell: (r) => <span className="font-medium">{r.full_name}</span>,
        },
        {
          key: 'care_status',
          header: 'Status',
          cell: (r) => careStatusLabels[r.care_status] ?? r.care_status,
        },
        {
          key: 'evaluation',
          header: 'Situação',
          mobileBadge: true,
          cell: (r) => (
            <PPPatientSituationBadge
              evaluation_pending={r.evaluation_pending}
              latest_assessment_status={r.latest_assessment_status}
              latest_cycle_status={r.latest_cycle_status}
              latest_cycle_payment_status={r.latest_cycle_payment_status}
              pending_evolution_count={r.pending_evolution_count}
              care_status={r.care_status}
            />
          ),
        },
      ]}
    />
  )
}
