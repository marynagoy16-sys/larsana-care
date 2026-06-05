import { z } from 'zod'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EntityListPage } from '@/components/crud/EntityListPage'
import { CrudModal } from '@/components/crud/CrudModal'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormActions } from '@/components/crud/FormActions'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { professionalsService } from '@/services/index'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import { requiredString } from '@/schemas/common'
import { formatCpf } from '@/lib/formatters'
import { credentialingStatusLabels } from '@/constants/labels'

const schema = z.object({
  full_name: requiredString('Nome'),
  cpf_cnpj: requiredString('CPF/CNPJ'),
  profession: z.enum(['FISIO', 'NUTI', 'MED', 'CUID', 'FONO']),
  pp_class: z.enum(['BRONZE', 'PRATA', 'OURO']),
  person_type: z.enum(['PF', 'PJ']).default('PF'),
})

type FormValues = z.infer<typeof schema>

export function ProfessionalsPage() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: { full_name: '', cpf_cnpj: '', profession: 'FISIO', pp_class: 'BRONZE', person_type: 'PF' },
  })

  const create = useCrudMutation({
    mutationFn: (v: FormValues) => professionalsService.create({ ...v, credentialing_status: 'rascunho', is_active: false }),
    queryKey: ['professionals'],
    successMessage: 'Profissional cadastrado',
    onSuccess: () => { form.reset(); setOpen(false) },
  })

  return (
    <>
      <EntityListPage
        title="Profissionais"
        description="Profissionais parceiros credenciados"
        queryKey={['professionals']}
        queryFn={() => professionalsService.list('id, full_name, cpf_cnpj, profession, pp_class, credentialing_status')}
        onCreate={() => setOpen(true)}
        createLabel="Novo profissional"
        onRowClick={(r) => navigate(`/admin/profissionais/${r.id}`)}
        columns={[
          { key: 'name', header: 'Nome', cell: (r) => String(r.full_name) },
          { key: 'cpf', header: 'CPF/CNPJ', cell: (r) => formatCpf(String(r.cpf_cnpj)) },
          { key: 'class', header: 'Classe', cell: (r) => String(r.pp_class) },
          { key: 'status', header: 'Status', cell: (r) => credentialingStatusLabels[String(r.credentialing_status)] ?? String(r.credentialing_status) },
        ]}
      />
      <CrudModal open={open} onOpenChange={setOpen} title="Novo profissional" size="md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => create.mutate(v))} className="space-y-4">
            <FormField control={form.control} name="full_name" render={({ field }) => (
              <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="cpf_cnpj" render={({ field }) => (
              <FormItem><FormLabel>CPF/CNPJ</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="pp_class" render={({ field }) => (
              <FormItem><FormLabel>Classe PP</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>{['BRONZE','PRATA','OURO'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              <FormMessage /></FormItem>
            )} />
            <FormActions onCancel={() => setOpen(false)} isSubmitting={create.isPending} />
          </form>
        </Form>
      </CrudModal>
    </>
  )
}
