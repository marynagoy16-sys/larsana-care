import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CrudModal } from '@/components/crud/CrudModal'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormActions } from '@/components/crud/FormActions'
import { MaskedInput } from '@/components/forms/MaskedInput'
import { addressStepSchema, type AddressStepValues } from '@/schemas/patient'
import { useUpsertAddress } from '@/hooks/mutations/usePatientSubMutations'
import { useCities } from '@/hooks/queries/useRegions'
import { usePatient } from '@/hooks/queries/usePatients'

interface AddressFormModalProps {
  patientId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: AddressStepValues & { id?: string }
}

export function AddressFormModal({
  patientId,
  open,
  onOpenChange,
  defaultValues,
}: AddressFormModalProps) {
  const { data: patient } = usePatient(patientId)
  const { data: cities = [] } = useCities(patient?.region_id ?? undefined)
  const mutation = useUpsertAddress(patientId)

  const form = useForm<AddressStepValues & { id?: string }>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(addressStepSchema) as any,
    defaultValues: defaultValues ?? {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      postal_code: '',
      city_id: '',
      full_address: '',
    },
  })

  return (
    <CrudModal
      open={open}
      onOpenChange={onOpenChange}
      title={defaultValues?.id ? 'Editar endereço' : 'Adicionar endereço'}
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
          <FormField control={form.control} name="postal_code" render={({ field }) => (
            <FormItem><FormLabel>CEP</FormLabel><FormControl><MaskedInput mask="cep" value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="street" render={({ field }) => (
            <FormItem><FormLabel>Rua</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="number" render={({ field }) => (
              <FormItem><FormLabel>Número</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="complement" render={({ field }) => (
              <FormItem><FormLabel>Complemento</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
          <FormField control={form.control} name="neighborhood" render={({ field }) => (
            <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="city_id" render={({ field }) => (
            <FormItem>
              <FormLabel>Cidade</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                <SelectContent>
                  {cities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormActions onCancel={() => onOpenChange(false)} isSubmitting={mutation.isPending} />
        </form>
      </Form>
    </CrudModal>
  )
}
