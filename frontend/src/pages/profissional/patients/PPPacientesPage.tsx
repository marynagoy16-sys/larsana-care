import { useNavigate } from 'react-router-dom'
import { EntityListPage } from '@/components/crud/EntityListPage'
import { Badge } from '@/components/ui/badge'
import { careStatusLabels } from '@/constants/labels'
import { listPPPatients } from '@/services/ppPatients'

export function PPPacientesPage() {
  const navigate = useNavigate()
  return (
    <EntityListPage
      title="Meus pacientes"
      showStats={false}
      queryKey={['pp', 'patients']}
      queryFn={() => listPPPatients()}
      onRowClick={(r) => navigate(`/profissional/pacientes/${r.id}`)}
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
          header: 'Avaliação',
          mobileBadge: true,
          cell: (r) =>
            r.evaluation_pending ? (
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                Pendente
              </Badge>
            ) : (
              <span className="text-muted-foreground text-sm">—</span>
            ),
        },
      ]}
    />
  )
}
