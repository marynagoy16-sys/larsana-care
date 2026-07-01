import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { RESCHEDULE_WARNING_MESSAGE } from '@/lib/financialClosure'

interface RescheduleWarningModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function RescheduleWarningModal({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  isSubmitting,
}: RescheduleWarningModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Terceira remarcação consecutiva</AlertDialogTitle>
          <AlertDialogDescription className="text-left leading-relaxed">
            {RESCHEDULE_WARNING_MESSAGE}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isSubmitting}>
            Não, manter ciclo ativo
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isSubmitting}>
            Sim, desejo prosseguir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
