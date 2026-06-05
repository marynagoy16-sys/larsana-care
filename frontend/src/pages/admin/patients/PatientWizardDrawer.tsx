import { PatientPreviewDrawer } from '@/components/patients/PatientPreviewDrawer'

interface PatientWizardDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (patientId: string) => void
}

/** @deprecated Use PatientPreviewDrawer com mode="create" */
export function PatientWizardDrawer({ open, onOpenChange, onCreated }: PatientWizardDrawerProps) {
  return (
    <PatientPreviewDrawer
      mode="create"
      open={open}
      onOpenChange={onOpenChange}
      onCreated={onCreated}
    />
  )
}
