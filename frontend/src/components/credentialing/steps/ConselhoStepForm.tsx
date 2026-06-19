import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { conselhoStepSchema, type ConselhoStepValues } from '@/schemas/credentialing'
import { councilTypeLabels } from '@/constants/labels'
import { defaultCouncilForProfession, type CredentialingSnapshot } from '@/lib/credentialingModel'

type Props = {
  snapshot: CredentialingSnapshot
  onSubmit: (values: ConselhoStepValues) => Promise<void>
  disabled?: boolean
}

export function ConselhoStepForm({ snapshot, onSubmit, disabled }: Props) {
  const defaultCouncil = defaultCouncilForProfession(snapshot.professional.profession)

  const form = useForm<ConselhoStepValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(conselhoStepSchema) as any,
    defaultValues: {
      council_type: snapshot.council?.council_type ?? defaultCouncil,
      registration_number: snapshot.council?.registration_number ?? '',
    },
    mode: 'onBlur',
  })

  useEffect(() => {
    if (!snapshot.council) {
      form.setValue('council_type', defaultCouncil)
    }
  }, [defaultCouncil, form, snapshot.council])

  return (
    <Form {...form}>
      <form id="credentialing-step-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="council_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conselho</FormLabel>
              <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                <FormControl>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(councilTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="registration_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de registro</FormLabel>
              <FormControl>
                <Input placeholder="Ex.: 269110-F" {...field} disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
