import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CrudModal } from '@/components/crud/CrudModal'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { FormActions } from '@/components/crud/FormActions'
import { MaskedInput } from '@/components/forms/MaskedInput'
import { CityRegionFields } from '@/components/forms/CityRegionFields'
import { addressStepSchema, type AddressStepValues } from '@/schemas/patient'
import { useUpsertAddress } from '@/hooks/mutations/usePatientSubMutations'
import { useAllCities } from '@/hooks/queries/useRegions'
import { syncCityRegion } from '@/services/regions'

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
  const { data: cities = [] } = useAllCities()
  const mutation = useUpsertAddress(patientId)

  const form = useForm<AddressStepValues & { id?: string; region_id?: string }>({
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

  const cityId = form.watch('city_id')
  const regionId = form.watch('region_id')

  useEffect(() => {
    if (!open) return
    form.reset(
      defaultValues ?? {
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        postal_code: '',
        city_id: '',
        full_address: '',
      },
    )
  }, [open, defaultValues, form])

  useEffect(() => {
    if (!cityId || cities.length === 0) return
    const synced = syncCityRegion(cityId, cities)
    if (synced && synced.regionId !== regionId) {
      form.setValue('region_id', synced.regionId)
    }
  }, [cityId, cities, regionId, form])

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
          <FormField control={form.control} name="city_id" render={() => (
            <FormItem>
              <CityRegionFields
                cityId={cityId}
                regionId={regionId}
                onCityChange={(nextCityId, nextRegionId) => {
                  form.setValue('city_id', nextCityId, { shouldValidate: true, shouldDirty: true })
                  form.setValue('region_id', nextRegionId, { shouldDirty: true })
                }}
              />
              <FormMessage />
            </FormItem>
          )} />
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
          <FormActions onCancel={() => onOpenChange(false)} isSubmitting={mutation.isPending} />
        </form>
      </Form>
    </CrudModal>
  )
}
