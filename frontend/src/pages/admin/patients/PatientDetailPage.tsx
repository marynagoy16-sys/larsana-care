import { useNavigate, useParams } from 'react-router-dom'
import { PatientPreviewDrawer } from '@/components/patients/PatientPreviewDrawer'

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  return (
    <PatientPreviewDrawer
      patientId={id ?? null}
      open={!!id}
      onOpenChange={(open) => !open && navigate('/admin/pacientes')}
      onEdit={(patientId) => navigate(`/admin/pacientes/${patientId}/editar`)}
    />
  )
}
