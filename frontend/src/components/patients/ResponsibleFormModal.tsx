import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CrudModal } from '@/components/crud/CrudModal'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { FormActions } from '@/components/crud/FormActions'
import { MaskedInput } from '@/components/forms/MaskedInput'
import { responsibleStepSchema, type ResponsibleStepValues } from '@/schemas/patient'
import { useUpsertResponsible } from '@/hooks/mutations/usePatientSubMutations'

interface ResponsibleFormModalProps {
  patientId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: ResponsibleStepValues & { id?: string }
}

export function ResponsibleFormModal({
  patientId,
  open,
  onOpenChange,
  defaultValues,
}: ResponsibleFormModalProps) {
  const mutation = useUpsertResponsible(patientId)
  const form = useForm<ResponsibleStepValues & { id?: string }>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(responsibleStepSchema) as any,
    defaultValues: defaultValues ?? {
      full_name: '',
      cpf: '',
      email: '',
      phone: '',
      backup_phone: '',
      is_primary: true,
    },
  })

  return (
    <CrudModal
      open={open}
      onOpenChange={onOpenChange}
      title={defaultValues?.id ? 'Editar responsável' : 'Adicionar responsável'}
      size="md"
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(async (values) => {
            await mutation.mutateAsync({ ...values, id: defaultValues?.id })
            onOpenChange(false)
          })}
          className="space-y-4"
        >
          <FormField control={form.control} name="full_name" render={({ field }) => (
            <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="cpf" render={({ field }) => (
            <FormItem><FormLabel>CPF</FormLabel><FormControl><MaskedInput mask="cpf" value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem><FormLabel>E-mail</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem><FormLabel>Telefone</FormLabel><FormControl><MaskedInput mask="phone" value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormActions onCancel={() => onOpenChange(false)} isSubmitting={mutation.isPending} />
        </form>
      </Form>
    </CrudModal>
  )
}
