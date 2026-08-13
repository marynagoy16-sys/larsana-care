import { useNavigate } from 'react-router-dom'
import { EntityListPage } from '@/components/crud/EntityListPage'
import { Badge } from '@/components/ui/badge'
import { careStatusLabels } from '@/constants/labels'
import { isPatientInActiveTreatment } from '@/lib/patientCareStatus'
import { listPPPatients } from '@/services/ppPatients'

export function PPPacientesPage() {
  const navigate = useNavigate()
  return (
    <EntityListPage
      title="Meus pacientes"
      showStats={false}
      mobileVariant="compact"
      getMobileAvatarLabel={(r) => r.full_name}
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
          header: 'Situação',
          mobileBadge: true,
          cell: (r) => {
            if (r.evaluation_pending) {
              return (
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  Avaliação pendente
                </Badge>
              )
            }
            if (r.pending_evolution_count > 0) {
              return (
                <Badge className="bg-orange-100 text-orange-900 dark:bg-orange-950/40 dark:text-orange-300">
                  {r.pending_evolution_count === 1
                    ? 'Evolução pendente'
                    : `${r.pending_evolution_count} evoluções`}
                </Badge>
              )
            }
            if (isPatientInActiveTreatment(r.care_status)) {
              return <Badge variant="secondary">Ativo</Badge>
            }
            return <span className="text-muted-foreground text-sm">—</span>
          },
        },
      ]}
    />
  )
}
