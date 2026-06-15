import { Button } from '@/components/ui/button'

interface FormActionsProps {
  onCancel: () => void
  isSubmitting?: boolean
  submitLabel?: string
  cancelLabel?: string
  form?: string
}

export function FormActions({
  onCancel,
  isSubmitting,
  submitLabel = 'Salvar',
  cancelLabel = 'Cancelar',
  form,
}: FormActionsProps) {
  return (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
        {cancelLabel}
      </Button>
      <Button type="submit" form={form} disabled={isSubmitting}>
        {isSubmitting ? 'Salvando...' : submitLabel}
      </Button>
    </div>
  )
}
