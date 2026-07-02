import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MaskedInput } from '@/components/forms/MaskedInput'
import { dadosStepSchema, type DadosStepValues } from '@/schemas/credentialing'
import { personTypeLabels, professionTypeLabels } from '@/constants/labels'
import type { CredentialingSnapshot } from '@/lib/credentialingModel'

type Props = {
  snapshot: CredentialingSnapshot
  onSubmit: (values: DadosStepValues) => Promise<void>
  disabled?: boolean
}

function toDefaultValues(pro: CredentialingSnapshot['professional']): DadosStepValues {
  return {
    full_name: pro.full_name ?? '',
    person_type: pro.person_type ?? 'PF',
    cpf_cnpj: pro.cpf_cnpj ?? '',
    birth_date: pro.birth_date ?? '',
    email: pro.email ?? '',
    phone: pro.phone ?? '',
    address: pro.address ?? '',
    profession: pro.profession ?? 'FISIO',
    referral_code: '',
  }
}

export function DadosStepForm({ snapshot, onSubmit, disabled }: Props) {
  const form = useForm<DadosStepValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(dadosStepSchema) as any,
    defaultValues: toDefaultValues(snapshot.professional),
    mode: 'onBlur',
  })

  const personType = form.watch('person_type')

  return (
    <Form {...form}>
      <form id="credentialing-step-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome completo</FormLabel>
              <FormControl><Input {...field} disabled={disabled} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="person_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de pessoa</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(personTypeLabels).map(([value, label]) => (
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
            name="cpf_cnpj"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{personType === 'PJ' ? 'CNPJ' : 'CPF'}</FormLabel>
                <FormControl>
                  {personType === 'PJ' ? (
                    <Input {...field} disabled={disabled} placeholder="00.000.000/0000-00" />
                  ) : (
                    <MaskedInput
                      mask="cpf"
                      value={field.value}
                      onChange={field.onChange}
                      disabled={disabled}
                    />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="birth_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de nascimento</FormLabel>
                <FormControl><Input type="date" {...field} disabled={disabled} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="profession"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profissão</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(professionTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl><Input type="email" {...field} disabled={disabled} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <MaskedInput mask="phone" value={field.value} onChange={field.onChange} disabled={disabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço completo</FormLabel>
              <FormControl><Textarea rows={2} {...field} disabled={disabled} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="referral_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código de indicação (opcional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled={disabled}
                  placeholder="Código de um colega PP"
                  className="font-mono uppercase"
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
