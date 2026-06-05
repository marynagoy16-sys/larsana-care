import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CrudModal } from '@/components/crud/CrudModal'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormActions } from '@/components/crud/FormActions'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import { requiredString } from '@/schemas/common'
import { professionalsService } from '@/services/index'

const schema = z.object({
  full_name: requiredString('Nome'),
  cpf_cnpj: requiredString('CPF/CNPJ'),
  profession: z.enum(['FISIO', 'NUTI', 'MED', 'CUID', 'FONO']),
  pp_class: z.enum(['BRONZE', 'PRATA', 'OURO']),
  person_type: z.enum(['PF', 'PJ']).default('PF'),
})

type FormValues = z.infer<typeof schema>

interface InviteProfessionalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteProfessionalModal({ open, onOpenChange }: InviteProfessionalModalProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: { full_name: '', cpf_cnpj: '', profession: 'FISIO', pp_class: 'BRONZE', person_type: 'PF' },
  })

  const create = useCrudMutation({
    mutationFn: (v: FormValues) =>
      professionalsService.create({ ...v, credentialing_status: 'rascunho', is_active: false }),
    queryKey: ['professionals'],
    successMessage: 'Profissional convidado com sucesso',
    onSuccess: () => {
      form.reset()
      onOpenChange(false)
    },
  })

  return (
    <CrudModal open={open} onOpenChange={onOpenChange} title="Convidar profissional" size="md">
      <Form {...form}>
        <form onSubmit={form.handleSubmit((v) => create.mutate(v))} className="space-y-4">
          <FormField control={form.control} name="full_name" render={({ field }) => (
            <FormItem><FormLabel>Nome completo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="cpf_cnpj" render={({ field }) => (
            <FormItem><FormLabel>CPF/CNPJ</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="profession" render={({ field }) => (
            <FormItem>
              <FormLabel>Profissão</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="FISIO">Fisioterapia</SelectItem>
                  <SelectItem value="NUTI">Nutrição</SelectItem>
                  <SelectItem value="MED">Medicina</SelectItem>
                  <SelectItem value="CUID">Cuidador</SelectItem>
                  <SelectItem value="FONO">Fonoaudiologia</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="pp_class" render={({ field }) => (
            <FormItem>
              <FormLabel>Classe PP</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {['BRONZE', 'PRATA', 'OURO'].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormActions onCancel={() => onOpenChange(false)} isSubmitting={create.isPending} submitLabel="Enviar convite" />
        </form>
      </Form>
    </CrudModal>
  )
}
